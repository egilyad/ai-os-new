import { BaseLLMAdapter, type SendMessageOptions } from '../core/base-adapter';
import type {
    ChatMessage,
    ProviderResponse,
    HealthCheckResult,
    ToolCall,
    StreamMeta,
} from '../core/types';
import { LLMError } from '../core/errors';
import { parseSSEStream } from '../http/sse-parser';
import { LLMHttpClient, PROVIDER_HTTP_TIMEOUT_MS } from '../http/llm-http-client';
import { OpenAiCompatibleResponseSchema } from './openai-compatible-types';
import { rootLogger } from '../../kernel/services/logger-service';

const LOGGER = rootLogger.child('OpenAICompatibleAdapter');

const FINISH_REASONS = new Set<NonNullable<ProviderResponse['finishReason']>>([
    'STOP',
    'MAX_TOKENS',
    'SAFETY',
    'RECITATION',
    'OTHER',
    'TOOL_CALLS',
]);

function normalizeFinishReason(reason: string | undefined): ProviderResponse['finishReason'] {
    if (!reason) return undefined;
    const upper = reason.toUpperCase();
    if (upper === 'LENGTH') return 'MAX_TOKENS';
    if (upper === 'CONTENT_FILTER') return 'SAFETY';
    return FINISH_REASONS.has(upper as NonNullable<ProviderResponse['finishReason']>)
        ? (upper as NonNullable<ProviderResponse['finishReason']>)
        : 'OTHER';
}

function extractToolCalls(msg: Record<string, unknown> | undefined): ToolCall[] | undefined {
    const raw = msg?.tool_calls as Array<Record<string, unknown>> | undefined;
    if (!raw || raw.length === 0) return undefined;
    return raw.map((tc) => ({
        id: (tc.id as string) || '',
        type: 'function' as const,
        function: {
            name: ((tc.function as Record<string, unknown>)?.name as string) || '',
            arguments: ((tc.function as Record<string, unknown>)?.arguments as string) || '',
        },
    }));
}

export class OpenAiCompatibleAdapter extends BaseLLMAdapter {
    id: string;
    private httpClient: LLMHttpClient;

    constructor(id: string, baseUrl: string, useProxy = false) {
        super();
        this.id = id;
        const proxyUrl = useProxy ? `/proxy/${this.id}` : baseUrl;
        this.httpClient = new LLMHttpClient(
            proxyUrl,
            {
                'Content-Type': 'application/json',
                ...(this.id === 'groq' ? { Origin: 'http://localhost:5173' } : {}),
            },
            'authorization',
            this.id,
            PROVIDER_HTTP_TIMEOUT_MS,
        );
    }

    private buildBody(
        model: string,
        messages: ChatMessage[],
        stream?: boolean,
        options?: SendMessageOptions,
    ): Record<string, unknown> {
        const body = this.buildRequestBody(model, messages, stream, options);
        // Mercury (Inception Labs) expects max_completion_tokens, not
        // max_tokens (OpenAI-style newer API). Keep other OpenAI-compatible
        // providers on max_tokens.
        if (this.id === 'mercury') {
            if (typeof body.max_tokens === 'number') {
                body.max_completion_tokens = body.max_tokens;
                delete body.max_tokens;
            }
            // Mercury spends tokens on hidden reasoning before the visible
            // answer — with a tiny budget the answer is truncated to empty
            // (content: null). Enforce a floor so responses are non-empty.
            if (typeof body.max_completion_tokens === 'number' && body.max_completion_tokens < 256) {
                body.max_completion_tokens = 256;
            }
        }
        return body;
    }

    private toProviderResponse(data: Record<string, unknown>): Omit<ProviderResponse, 'latency'> {
        const parsed = OpenAiCompatibleResponseSchema.safeParse(data);
        if (!parsed.success) {
            LOGGER.warn('OpenAICompatibleAdapter', `[${this.id}] Response validation failed`, {
                issues: parsed.error.issues,
            });
        }
        const safe = parsed.success ? parsed.data : data;
        const choice = (safe.choices as Array<Record<string, unknown>> | undefined)?.[0];
        // 5.4: a missing first choice is not a lenient variant — without it
        // there is no content at all. Fail loudly instead of cascading
        // `content: ''` / `tokens: 0` downstream.
        if (!choice) {
            throw new LLMError(
                `[${this.id}] Provider response has no choices[0]`,
                this.id,
                undefined,
            );
        }
        const msg = choice?.message as Record<string, unknown> | undefined;
        const rawContent = msg?.content;
        let content = '';
        if (typeof rawContent === 'string') {
            content = rawContent;
        } else if (Array.isArray(rawContent)) {
            // Some OpenAI-compatible APIs return content as parts: [{type:'text',text:'…'}]
            content = rawContent
                .map((p) =>
                    typeof p === 'string'
                        ? p
                        : ((p as Record<string, unknown>)?.text as string) ?? '',
                )
                .join('');
        }
        if (!content) {
            // Fallbacks for providers that put the text elsewhere.
            content =
                ((choice.text as string) ?? '') ||
                ((msg?.reasoning_content as string) ?? '') ||
                ((data.output_text as string) ?? '');
        }
        return {
            content,
            tokens: ((safe.usage as Record<string, unknown>)?.total_tokens as number) ?? 0,
            finishReason: normalizeFinishReason(choice?.finish_reason as string | undefined),
            toolCalls: extractToolCalls(msg),
        };
    }

    async doSendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        options: SendMessageOptions | undefined,
        signal?: AbortSignal,
    ): Promise<Omit<ProviderResponse, 'latency'>> {
        const body = this.buildBody(model, messages, false, options);
        const { data } = await this.httpClient.post(
            '/chat/completions',
            body,
            `Bearer ${apiKey}`,
            signal,
        );
        return this.toProviderResponse(data as Record<string, unknown>);
    }

    async doStreamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<void> {
        const isClassificationModel = model.includes('distil') || model.includes('guard');

        if (isClassificationModel) {
            const response = await this.doSendMessage(messages, model, apiKey, options, signal);
            onChunk(response.content);
            return;
        }

        const body = this.buildBody(model, messages, true, options);
        const { response: res, release } = await this.httpClient.streamPost(
            '/chat/completions',
            body,
            `Bearer ${apiKey}`,
            signal,
        );

        try {
            let finalFinishReason: string | undefined;
            let finalUsage: { total_tokens?: number } | undefined;
            let finalReasoning: string | undefined;
            // Phase 70, трасса B-3: склейка chunked tool_calls по индексу
            // (delta.tool_calls[]: [{ index, id?, function: { name?, arguments? } }]).
            // Без этого streaming-режим терял tool_calls — runWithTools через
            // onChunk видел только текст (ro2 §1.3).
            const streamedTools = new Map<number, { id: string; name: string; args: string }>();

            await parseSSEStream(
                res,
                (chunk) => onChunk(chunk),
                (parsed) => {
                    const choices = parsed.choices as Array<Record<string, unknown>> | undefined;
                    const choice = choices?.[0];
                    const delta = choice?.delta as
                        | {
                              content?: string;
                              reasoning_content?: string;
                              tool_calls?: Array<{
                                  index?: number;
                                  id?: string;
                                  function?: { name?: string; arguments?: string };
                              }>;
                          }
                        | undefined;
                    if (choice?.finish_reason) finalFinishReason = choice.finish_reason as string;
                    if (parsed.usage) finalUsage = parsed.usage as { total_tokens?: number };
                    if (delta?.reasoning_content)
                        finalReasoning = (finalReasoning || '') + delta.reasoning_content;
                    for (const tc of delta?.tool_calls ?? []) {
                        const index = typeof tc.index === 'number' ? tc.index : 0;
                        const entry = streamedTools.get(index) ?? { id: '', name: '', args: '' };
                        if (tc.id) entry.id = tc.id;
                        if (tc.function?.name) entry.name += tc.function.name;
                        if (tc.function?.arguments) entry.args += tc.function.arguments;
                        streamedTools.set(index, entry);
                    }
                    return delta?.content;
                },
                undefined,
                { signal, idleTimeoutMs: 30000 },
            );

            const streamedToolCalls: ToolCall[] | undefined =
                streamedTools.size > 0
                    ? [...streamedTools.entries()]
                          .sort(([a], [b]) => a - b)
                          .filter(([, e]) => e.name)
                          .map(([, e]) => ({
                              id: e.id,
                              type: 'function' as const,
                              function: { name: e.name, arguments: e.args || '{}' },
                          }))
                    : undefined;
            if (finalFinishReason || finalUsage || finalReasoning || streamedToolCalls) {
                onChunk('', {
                    finishReason: normalizeFinishReason(finalFinishReason),
                    tokens: finalUsage?.total_tokens,
                    reasoning: finalReasoning,
                    toolCalls: streamedToolCalls,
                });
            }
        } finally {
            // H-5: unregister from cancelAll + free the slot when body done.
            release();
        }
    }

    async checkHealth(apiKey: string): Promise<HealthCheckResult> {
        const start = Date.now();
        try {
            const models = await this.getAvailableModels(apiKey);
            if (models.length === 0) throw new LLMError('No models returned', this.id, 503);
            return {
                status: 'active',
                latency: Date.now() - start,
                models,
            };
        } catch (e: unknown) {
            return {
                status: 'error',
                latency: Date.now() - start,
                models: [],
                error: e instanceof Error ? e.message : String(e),
            };
        }
    }

    private _lastModelFetchFail = 0;
    private static MODEL_FETCH_RETRY_MS = 300_000;

    async getAvailableModels(apiKey: string, signal?: AbortSignal): Promise<string[]> {
        if (
            this._lastModelFetchFail &&
            Date.now() - this._lastModelFetchFail < OpenAiCompatibleAdapter.MODEL_FETCH_RETRY_MS
        ) {
            return [];
        }
        try {
            const { data } = await this.httpClient.get('/models', `Bearer ${apiKey}`, signal);
            this._lastModelFetchFail = 0;
            const resp = data as { data?: Array<{ id: string }> };
            return resp.data?.map((m) => m.id) || [];
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
            this._lastModelFetchFail = Date.now();
            return [];
        }
    }
}
