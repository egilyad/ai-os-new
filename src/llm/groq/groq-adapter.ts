import Groq from 'groq-sdk';
import type {
    ChatMessage,
    ProviderResponse,
    HealthCheckResult,
    SendMessageOptions,
    ToolCall,
    StreamMeta,
} from '../core/types';
import { BaseLLMAdapter } from '../core/base-adapter';
import { LLMError, AuthError, RetryableError } from '../core/errors';

function trimMessagesForGroq(messages: ChatMessage[]): ChatMessage[] {
    if (messages.length <= 2) return messages;
    const totalLen = messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
    if (totalLen <= 6000) return messages;

    const firstMsg = messages[0];
    const recentMsgs = messages.slice(-2);
    const trimmed: ChatMessage[] = [firstMsg!];

    if (messages.length > 3) {
        trimmed.push({
            role: 'system',
            content: '[Previous debate history summarized due to Groq context window limits]',
        });
        for (const msg of recentMsgs) {
            if (msg !== firstMsg) {
                trimmed.push(msg);
            }
        }
        return trimmed;
    }
    return messages;
}

export class GroqAdapter extends BaseLLMAdapter {
    id = 'groq';

    private getClient(apiKey: string): Groq {
        // SDK timeout must exceed the debate-caller's large-model timeout
        // (getLargeModelTimeoutMs = 90s) so the caller's own RequestTimedOut fires
        // first and triggers retry/failover instead of a premature SDK abort.
        return new Groq({ apiKey, timeout: 120000, maxRetries: 2, dangerouslyAllowBrowser: true });
    }

    async doSendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        options?: SendMessageOptions,
        signal?: AbortSignal,
    ): Promise<Omit<ProviderResponse, 'latency'>> {
        const client = this.getClient(apiKey);
        const safeMessages = trimMessagesForGroq(messages);
        const body: Record<string, unknown> = {
            model,
            messages: safeMessages.map((m) => ({
                role: m.role,
                content: m.content,
                ...(m.toolCalls ? { tool_calls: m.toolCalls } : {}),
                ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
            })),
        };
        if (options?.temperature !== undefined) body.temperature = options.temperature;
        if (options?.maxOutputTokens !== undefined) body.max_tokens = options.maxOutputTokens;
        if (options?.stopSequences?.length) body.stop = options.stopSequences;
        if (options?.tools) body.tools = options.tools;
        if (options?.toolChoice) body.tool_choice = options.toolChoice;

        try {
            const completion = (await client.chat.completions.create(body as never, {
                signal,
            })) as {
                choices?: {
                    message?: {
                        content?: string | null;
                        tool_calls?: {
                            function?: { name?: string; arguments?: string };
                            id?: string;
                        }[];
                    };
                    finish_reason?: string;
                }[];
                usage?: { total_tokens?: number };
            };
            const choice = completion.choices?.[0];
            return {
                content: choice?.message?.content || '',
                finishReason: this.normalizeFinishReason(choice?.finish_reason),
                tokens: completion.usage?.total_tokens ?? 0,
                toolCalls: this.extractToolCalls(choice?.message?.tool_calls),
            };
        } catch (e: unknown) {
            throw this.normalizeError(e);
        }
    }

    async doStreamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<void> {
        const client = this.getClient(apiKey);
        const safeMessages = trimMessagesForGroq(messages);
        const body: Record<string, unknown> = {
            model,
            messages: safeMessages.map((m) => ({
                role: m.role,
                content: m.content,
                ...(m.toolCalls ? { tool_calls: m.toolCalls } : {}),
                ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
            })),
            stream: true,
        };
        if (options?.temperature !== undefined) body.temperature = options.temperature;
        if (options?.maxOutputTokens !== undefined) body.max_tokens = options.maxOutputTokens;
        if (options?.stopSequences?.length) body.stop = options.stopSequences;
        if (options?.tools) body.tools = options.tools;
        if (options?.toolChoice) body.tool_choice = options.toolChoice;

        try {
            type GroqToolDelta = {
                index?: number;
                id?: string;
                type?: string;
                function?: { name?: string; arguments?: string };
            };
            type GroqStreamChunk = {
                choices?: Array<{
                    delta?: { content?: string; tool_calls?: GroqToolDelta[] };
                    finish_reason?: string;
                }>;
                x_groq?: { usage?: { total_tokens?: number } };
                usage?: { total_tokens?: number };
            };
            let finalFinishReason: string | undefined;
            let finalTokens: number | undefined;
            const toolParts = new Map<number, { id?: string; name?: string; args: string }>();
            const stream = (await client.chat.completions.create(body as never, {
                signal,
            })) as unknown as AsyncIterable<GroqStreamChunk>;
            for await (const chunk of stream) {
                const choice = chunk.choices?.[0];
                const delta = choice?.delta;
                if (delta?.content) {
                    onChunk(delta.content);
                }
                if (choice?.finish_reason) finalFinishReason = choice.finish_reason;
                for (const tc of delta?.tool_calls ?? []) {
                    const idx = tc.index ?? 0;
                    const part = toolParts.get(idx) ?? { args: '' };
                    if (tc.id) part.id = tc.id;
                    if (tc.function?.name) part.name = tc.function.name;
                    if (tc.function?.arguments) part.args += tc.function.arguments;
                    toolParts.set(idx, part);
                }
                const usage = chunk.x_groq?.usage ?? chunk.usage;
                if (typeof usage?.total_tokens === 'number') finalTokens = usage.total_tokens;
            }
            // H-07: terminal meta chunk — finish_reason/usage/tool_calls, otherwise
            // budgets count $0 and length-truncation stays invisible.
            if (finalFinishReason || finalTokens !== undefined || toolParts.size > 0) {
                onChunk('', {
                    finishReason: this.normalizeFinishReason(finalFinishReason),
                    tokens: finalTokens,
                    toolCalls:
                        toolParts.size > 0
                            ? [...toolParts.entries()]
                                  .sort(([a], [b]) => a - b)
                                  .map(([, p]): ToolCall => ({
                                      id: p.id ?? '',
                                      type: 'function',
                                      function: { name: p.name ?? '', arguments: p.args },
                                  }))
                            : undefined,
                });
            }
        } catch (e: unknown) {
            throw this.normalizeError(e);
        }
    }

    async checkHealth(apiKey: string): Promise<HealthCheckResult> {
        const start = Date.now();
        try {
            const models = await this.getAvailableModels(apiKey);
            return {
                status: models.length > 0 ? 'active' : 'error',
                latency: Date.now() - start,
                models,
            };
        } catch (e: unknown) {
            return {
                status: 'error',
                latency: Date.now() - start,
                models: [],
                error: (e as Error).message,
            };
        }
    }

    async getAvailableModels(apiKey: string, _signal?: AbortSignal): Promise<string[]> {
        try {
            const client = this.getClient(apiKey);
            const list = await client.models.list();
            return list.data?.map((m: { id: string }) => m.id) || [];
        } catch {
            return [];
        }
    }

    private normalizeFinishReason(reason: string | undefined): ProviderResponse['finishReason'] {
        if (!reason) return undefined;
        const upper = reason.toUpperCase();
        if (upper === 'LENGTH') return 'MAX_TOKENS';
        if (upper === 'CONTENT_FILTER') return 'SAFETY';
        if (['STOP', 'MAX_TOKENS', 'SAFETY', 'RECITATION', 'OTHER', 'TOOL_CALLS'].includes(upper))
            return upper as NonNullable<ProviderResponse['finishReason']>;
        return 'OTHER';
    }

    private extractToolCalls(
        raw: { function?: { name?: string; arguments?: string }; id?: string }[] | undefined,
    ): ToolCall[] | undefined {
        if (!raw || raw.length === 0) return undefined;
        return raw.map((tc) => ({
            id: tc.id || '',
            type: 'function' as const,
            function: {
                name: tc.function?.name || '',
                arguments: tc.function?.arguments || '',
            },
        }));
    }

    private normalizeError(e: unknown): Error {
        const err = e as { status?: number; message?: string; name?: string };
        // H-05: groq-sdk wraps aborts as APIUserAbortError (plain Error) — re-wrap as
        // DOMException so executor abort detection (and key health) treats it as cancel.
        if (err.name === 'APIUserAbortError') {
            return new DOMException('Aborted', 'AbortError');
        }
        if (err.status === 401 || err.status === 403) {
            return new AuthError(err.message || '', this.id, err.status);
        }
        if (err.status === 429) {
            return new RetryableError(err.message || '', this.id, err.status);
        }
        if (err.name === 'APIConnectionTimeoutError' || err.name === 'TimeoutError') {
            return new LLMError('Groq request timed out', this.id, 408);
        }
        return e instanceof Error ? e : new LLMError(String(e), this.id, err.status || 500);
    }
}
