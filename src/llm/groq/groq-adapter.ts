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
            const stream = (await client.chat.completions.create(body as never, {
                signal,
            })) as unknown as AsyncIterable<{ choices?: { delta?: { content?: string } }[] }>;
            for await (const chunk of stream) {
                const delta = chunk.choices?.[0]?.delta;
                if (delta?.content) {
                    onChunk(delta.content);
                }
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
