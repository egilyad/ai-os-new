import type {
    LLMProviderAdapter,
    ChatMessage,
    ProviderResponse,
    HealthCheckResult,
    SendMessageOptions,
    StreamMeta,
} from './types';
import { LLMError, SafetyError } from './errors';

export type { SendMessageOptions } from './types';

export interface BuildBodyConfig {
    sanitizeModel?: boolean;
    mapMessages?: boolean;
    omitFields?: Array<'safetySettings' | 'cachedContent'>;
}

export abstract class BaseLLMAdapter implements LLMProviderAdapter {
    abstract id: string;

    protected sanitizeModel(model: string): string {
        return model;
    }

    protected buildRequestBody(
        model: string,
        messages: ChatMessage[],
        stream: boolean | undefined,
        options: SendMessageOptions | undefined,
        config?: BuildBodyConfig,
    ): Record<string, unknown> {
        const body: Record<string, unknown> = {
            model: this.sanitizeModel(model),
            // H-04: OpenAI wire format requires snake_case tool_calls/tool_call_id.
            // Map in BOTH branches: the mapped branch rebuilds the message, the
            // pass-through branch renames in place (preserving name/inlineData/
            // reasoningContent which must flow through verbatim).
            messages: messages.map((m) => {
                if (config?.mapMessages) {
                    const mapped: Record<string, unknown> = { role: m.role, content: m.content };
                    if (m.toolCalls) mapped.tool_calls = m.toolCalls;
                    if (m.toolCallId) mapped.tool_call_id = m.toolCallId;
                    return mapped;
                }
                const passthrough: Record<string, unknown> = {
                    ...(m as unknown as Record<string, unknown>),
                };
                if (m.toolCalls !== undefined) {
                    passthrough.tool_calls = m.toolCalls;
                    delete passthrough.toolCalls;
                }
                if (m.toolCallId !== undefined) {
                    passthrough.tool_call_id = m.toolCallId;
                    delete passthrough.toolCallId;
                }
                return passthrough;
            }),
        };
        if (stream) body.stream = true;
        if (options) {
            if (options.temperature !== undefined) body.temperature = options.temperature;
            if (options.maxOutputTokens !== undefined) body.max_tokens = options.maxOutputTokens;
            if (options.stopSequences !== undefined && options.stopSequences.length > 0) {
                body.stop = options.stopSequences;
            }
            if (options.tools !== undefined) body.tools = options.tools;
            if (options.toolChoice !== undefined) body.tool_choice = options.toolChoice;
            if (options.responseFormat !== undefined) body.response_format = options.responseFormat;
            if (
                !config?.omitFields?.includes('safetySettings') &&
                options.safetySettings !== undefined
            )
                body.safety_settings = options.safetySettings;
            if (
                !config?.omitFields?.includes('cachedContent') &&
                options.cachedContent !== undefined
            )
                body.cached_content = options.cachedContent;
        }
        return body;
    }

    abstract doSendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        options: SendMessageOptions | undefined,
        signal: AbortSignal | undefined,
    ): Promise<Omit<ProviderResponse, 'latency'>>;

    abstract doStreamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal: AbortSignal | undefined,
        options: SendMessageOptions | undefined,
    ): Promise<void>;

    async sendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<ProviderResponse> {
        const start = Date.now();
        try {
            const result = await this.doSendMessage(messages, model, apiKey, options, signal);
            return { ...result, latency: Date.now() - start };
        } catch (e) {
            if (e instanceof LLMError) throw e;
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
            throw new LLMError(e instanceof Error ? e.message : String(e), this.id, undefined, {
                cause: e,
            });
        }
    }

    async streamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<void> {
        try {
            await this.doStreamMessage(messages, model, apiKey, onChunk, signal, options);
        } catch (e) {
            if (e instanceof LLMError) throw e;
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
            throw new LLMError(e instanceof Error ? e.message : String(e), this.id, undefined, {
                cause: e,
            });
        }
    }

    /** @throws LLMError 501 — Subclasses must override this method */
    async checkHealth(_apiKey: string): Promise<HealthCheckResult> {
        throw new LLMError('checkHealth not implemented', this.id, 501);
    }

    /** @throws LLMError 501 — Subclasses must override this method */
    async getAvailableModels(_apiKey: string, _signal?: AbortSignal): Promise<string[]> {
        throw new LLMError('getAvailableModels not implemented', this.id, 501);
    }

    destroy(): void {
        // Override in subclasses with cleanup needs
    }

    protected handleBlockedResponse(
        finishReason?: string,
        safetyRatings?: Array<{ category: string; probability: string }>,
    ): void {
        if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
            throw new SafetyError(this.id, finishReason, safetyRatings);
        }
    }
}
