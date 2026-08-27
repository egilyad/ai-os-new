import type { ChatMessage, ProviderResponse, HealthCheckResult, StreamMeta } from '../core/types';
import type { SendMessageOptions } from '../core/base-adapter';
import { BaseLLMAdapter } from '../core/base-adapter';
import { parseSSEStream } from '../http/sse-parser';
import { LLMHttpClient } from '../http/llm-http-client';
import { estimateTokenCount } from '../utils/token-counter';
import { NvidiaNIMResponseSchema } from './nvidia-nim-types';
import { LLMError } from '../core/errors';

const MODEL_NAME_RE = /^[a-zA-Z0-9_.\-/]+$/;

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

interface NvidiaOptions {
    baseURL?: string;
    timeout?: number;
    maxRetries?: number;
    idleTimeoutMs?: number;
}

export class NvidiaNIMAdapter extends BaseLLMAdapter {
    readonly id = 'nvidia-nim';

    private httpClient: LLMHttpClient;
    private _idleTimeoutMs: number;

    constructor(options?: NvidiaOptions) {
        super();
        const url = options?.baseURL ?? '/proxy/nvidia';
        this._idleTimeoutMs = options?.idleTimeoutMs ?? 90000;
        this.httpClient = new LLMHttpClient(
            url,
            { 'Content-Type': 'application/json' },
            'authorization',
            this.id,
            // Must exceed the debate caller's large-model timeout (90s), otherwise
            // the HTTP-layer timer aborts first with a bare AbortError that the
            // caller classifies as a user-abort → no retry, agent loses its turn.
            options?.timeout ?? 120000,
        );
    }

    protected override sanitizeModel(model: string): string {
        if (!MODEL_NAME_RE.test(model)) {
            throw new LLMError(`Invalid model name: "${model}"`, 'nvidia');
        }
        return model;
    }

    private buildBody(
        messages: ChatMessage[],
        model: string,
        stream?: boolean,
        options?: SendMessageOptions,
    ): Record<string, unknown> {
        return this.buildRequestBody(model, messages, stream, options, {
            sanitizeModel: true,
            mapMessages: true,
            omitFields: ['cachedContent'],
        });
    }

    private toProviderResponse(raw: unknown, latency: number): ProviderResponse {
        const parsed = NvidiaNIMResponseSchema.safeParse(raw);
        if (!parsed.success) {
            throw new LLMError(`Invalid NIM response shape: ${parsed.error.message}`, this.id);
        }
        const data = parsed.data;
        const choice = data.choices?.[0];
        const content = choice?.message?.content ?? '';
        const finishReason = normalizeFinishReason(choice?.finish_reason);
        const tokens = data.usage?.total_tokens ?? estimateTokenCount(content);

        return { content, latency, tokens, finishReason };
    }

    async doSendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        options: SendMessageOptions | undefined,
        signal: AbortSignal | undefined,
    ): Promise<Omit<ProviderResponse, 'latency'>> {
        const body = this.buildBody(messages, model, false, options);
        const { data } = await this.httpClient.post(
            '/v1/chat/completions',
            body,
            `Bearer ${apiKey}`,
            signal,
        );
        return this.toProviderResponse(data, 0);
    }

    async doStreamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal: AbortSignal | undefined,
        options: SendMessageOptions | undefined,
    ): Promise<void> {
        const body = this.buildBody(messages, model, true, options);
        const res = await this.httpClient.streamPost(
            '/v1/chat/completions',
            body,
            `Bearer ${apiKey}`,
            signal,
        );

        let finalFinishReason: string | undefined;

        await parseSSEStream(
            res,
            (text) => onChunk(text),
            (parsed: Record<string, unknown>) => {
                const choices = parsed.choices as Array<Record<string, unknown>> | undefined;
                const choice = choices?.[0];
                const delta = choice?.delta as { content?: string; reasoning?: string } | undefined;
                if (choice?.finish_reason) finalFinishReason = choice.finish_reason as string;
                return delta?.content;
            },
            undefined,
            { signal, idleTimeoutMs: this._idleTimeoutMs },
        );

        if (finalFinishReason) {
            onChunk('', { finishReason: finalFinishReason });
        }
    }

    private _modelFetchFails = new Map<string, number>();
    private static MODEL_FETCH_RETRY_MS = 30_000;

    async getAvailableModels(apiKey: string, signal?: AbortSignal): Promise<string[]> {
        const lastFail = this._modelFetchFails.get(apiKey);
        if (lastFail && Date.now() - lastFail < NvidiaNIMAdapter.MODEL_FETCH_RETRY_MS) {
            return [];
        }
        try {
            const { data } = await this.httpClient.get('/v1/models', `Bearer ${apiKey}`, signal);
            this._modelFetchFails.delete(apiKey);
            const resp = data as { data?: Array<{ id: string }> };
            return (
                resp.data
                    ?.filter((m): m is { id: string } => typeof m.id === 'string')
                    .map((m) => m.id) || []
            );
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
            this._modelFetchFails.set(apiKey, Date.now());
            return [];
        }
    }

    async checkHealth(apiKey: string): Promise<HealthCheckResult> {
        const start = Date.now();
        try {
            const models = await this.getAvailableModels(apiKey);
            if (models.length === 0) throw new LLMError('No models returned', this.id, 503);
            return { status: 'active', latency: Date.now() - start, models };
        } catch (e: unknown) {
            return {
                status: 'error',
                latency: Date.now() - start,
                models: [],
                error: e instanceof Error ? e.message : String(e),
            };
        }
    }
}
