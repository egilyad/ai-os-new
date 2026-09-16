import type {
    LLMProviderAdapter,
    ChatMessage,
    ProviderResponse,
    HealthCheckResult,
    SendMessageOptions,
    StreamMeta,
} from '../core/types';
import { BaseDecorator } from '../core/base-decorator';
import { AuthError, SafetyError } from '../core/errors';
import { FALLBACK_LOGGER } from '../../shared/utils/logger';
const LOGGER = FALLBACK_LOGGER.child('FallbackDecorator');

export class FallbackDecorator extends BaseDecorator {
    readonly #primary: LLMProviderAdapter;
    readonly #fallback: LLMProviderAdapter;

    constructor(primary: LLMProviderAdapter, fallback: LLMProviderAdapter) {
        super(primary);
        this.#primary = primary;
        this.#fallback = fallback;
    }

    private extractProviderName(id: string): string {
        return id
            .replace(/\[(rl|cb|pq|rt|log|metrics|cache|fb|sr|cr|cm)\]/g, '')
            .replace(/\[.*\]/, '')
            .split('-')[0]!
            .split('/')[0]!;
    }

    private isSameProvider(): boolean {
        const p = this.extractProviderName(this.#primary.id);
        const f = this.extractProviderName(this.#fallback.id);
        return p.toLowerCase() === f.toLowerCase();
    }

    get id(): string {
        return `${this.#primary.id}+${this.#fallback.id}`;
    }

    private isFatalError(e: unknown): boolean {
        if (e instanceof AuthError) return true;
        if (e instanceof SafetyError) return true;
        if (e instanceof DOMException && e.name === 'AbortError') return true;
        if (e instanceof Error && e.name === 'AbortError') return true;
        return false;
    }

    async sendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<ProviderResponse> {
        // LLM-H06: If primary and fallback are the same provider type, don't retry — it wastes calls.
        if (this.isSameProvider()) {
            return this.#primary.sendMessage(messages, model, apiKey, signal, options);
        }
        try {
            return await this.#primary.sendMessage(messages, model, apiKey, signal, options);
        } catch (e) {
            if (this.isFatalError(e)) throw e;
            LOGGER.warn('FallbackDecorator', 'Primary failed, falling back', {
                primary: this.#primary.id,
                fallback: this.#fallback.id,
                error: (e as Error).message,
            });
            return this.#fallback.sendMessage(messages, model, apiKey, signal, options);
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
        let hasEmittedChunks = false;
        const guardedChunk: typeof onChunk = (chunk, meta) => {
            hasEmittedChunks = true;
            onChunk(chunk, meta);
        };
        if (!this.#primary.streamMessage)
            throw new Error('FallbackDecorator: primary adapter does not support streaming');
        // LLM-H06: If same provider, skip fallback attempt to avoid wasted retries.
        if (this.isSameProvider()) {
            await this.#primary.streamMessage(messages, model, apiKey, onChunk, signal, options);
            return;
        }
        try {
            await this.#primary.streamMessage(
                messages,
                model,
                apiKey,
                guardedChunk,
                signal,
                options,
            );
        } catch (e) {
            if (this.isFatalError(e)) throw e;
            if (hasEmittedChunks) {
                throw e;
            }
            if (!this.#fallback.streamMessage)
                throw new Error('FallbackDecorator: fallback adapter does not support streaming', {
                    cause: e,
                });
            LOGGER.warn('FallbackDecorator', 'Stream failed before chunks, falling back', {
                primary: this.#primary.id,
                fallback: this.#fallback.id,
                error: (e as Error).message,
            });
            await this.#fallback.streamMessage(messages, model, apiKey, onChunk, signal, options);
        }
    }

    async checkHealth(apiKey: string): Promise<HealthCheckResult> {
        const primary = await this.#primary.checkHealth(apiKey);
        if (primary.status === 'active') return primary;
        return this.#fallback.checkHealth(apiKey);
    }

    async getAvailableModels(apiKey: string, signal?: AbortSignal): Promise<string[]> {
        const primary = await this.#primary.getAvailableModels(apiKey, signal);
        if (primary.length > 0) return primary;
        return this.#fallback.getAvailableModels(apiKey, signal);
    }

    destroy(): void {
        this.#fallback.destroy?.();
        super.destroy();
    }
}
