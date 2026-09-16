import type {
    ChatMessage,
    ProviderResponse,
    HealthCheckResult,
    SendMessageOptions,
    StreamMeta,
} from '../core/types';
import { BaseDecorator } from '../core/base-decorator';
import { FALLBACK_LOGGER } from '../../shared/utils/logger';
import { sanitizeError } from '../../shared/utils/sanitize';

const LOGGER = FALLBACK_LOGGER.child('LoggingDecorator');

export class LoggingDecorator extends BaseDecorator {
    async sendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<ProviderResponse> {
        const start = Date.now();
        try {
            const res = await this.inner.sendMessage(messages, model, apiKey, signal, options);
            LOGGER.debug(
                'LoggingDecorator',
                `${this.id} ${model} ${res.tokens}t in ${Date.now() - start}ms`,
                { finishReason: res.finishReason },
            );
            return res;
        } catch (e) {
            LOGGER.error(
                'LoggingDecorator',
                `${this.id} ${model} failed after ${Date.now() - start}ms`,
                { error: sanitizeError(e instanceof Error ? e.message : String(e)) },
            );
            throw e;
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
        const start = Date.now();
        let count = 0;
        const wrapped: typeof onChunk = (chunk, meta) => {
            count++;
            onChunk(chunk, meta);
        };
        try {
            if (!this.inner.streamMessage)
                throw new Error('LoggingDecorator: inner adapter does not support streaming');
            await this.inner.streamMessage(messages, model, apiKey, wrapped, signal, options);
            LOGGER.debug(
                'LoggingDecorator',
                `${this.id} ${model} stream ended: ${count} chunks, ${Date.now() - start}ms`,
            );
        } catch (e) {
            LOGGER.error(
                'LoggingDecorator',
                `${this.id} ${model} stream failed after ${Date.now() - start}ms`,
                { error: sanitizeError(e instanceof Error ? e.message : String(e)) },
            );
            throw e;
        }
    }

    async checkHealth(apiKey: string): Promise<HealthCheckResult> {
        const start = Date.now();
        const res = await this.inner.checkHealth(apiKey);
        LOGGER.debug(
            'LoggingDecorator',
            `${this.id} health=${res.status} ${res.models.length} models in ${Date.now() - start}ms`,
        );
        return res;
    }

    destroy(): void {
        super.destroy();
    }
}
