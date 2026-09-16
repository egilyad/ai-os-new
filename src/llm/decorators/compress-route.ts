import type { ChatMessage, ProviderResponse, SendMessageOptions, StreamMeta } from '../core/types';
import { BaseDecorator } from '../core/base-decorator';
import { compressMessages, getCompressionStats } from '../utils/compression';
import type { CompressOptions, CompressionResult } from '../utils/compression';
import { estimateTokenCount } from '../utils/token-counter';

export interface CompressRouteConfig {
    enabled: boolean;
    maxTokens: number;
    strategy: CompressOptions['strategy'];
    logStats: boolean;
}

const DEFAULT_CONFIG: CompressRouteConfig = {
    enabled: true,
    maxTokens: 4096,
    strategy: 'truncate-middle',
    logStats: false,
};

export class CompressRouteDecorator extends BaseDecorator {
    private config: CompressRouteConfig;
    private stats: CompressionResult[] = [];
    private static readonly MAX_STATS = 1000;

    constructor(
        inner: import('../core/types').LLMProviderAdapter,
        config?: Partial<CompressRouteConfig>,
    ) {
        super(inner);
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    get id(): string {
        return `${this.inner.id}[compress]`;
    }

    private shouldCompress(messages: ChatMessage[]): boolean {
        if (!this.config.enabled) return false;
        const hasToolMessages = messages.some((m) => m.toolCalls || m.toolCallId || m.name);
        if (hasToolMessages) return false;
        const total = messages.reduce((s, m) => s + estimateTokenCount(m.content), 0);
        return total > this.config.maxTokens;
    }

    private compress(messages: ChatMessage[]): ChatMessage[] {
        // H-16: Preserve toolCall fields (toolCalls, toolCallId, name) during compression
        const original = messages.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.name ? { name: m.name } : {}),
            ...(m.toolCallId ? { toolCallId: m.toolCallId } : {}),
            ...(m.toolCalls ? { toolCalls: m.toolCalls } : {}),
        }));
        const compressed = compressMessages(original, {
            maxTokens: this.config.maxTokens,
            strategy: this.config.strategy,
        });

        if (this.config.logStats) {
            const origTokens = original.reduce((s, m) => s + estimateTokenCount(m.content), 0);
            const compTokens = compressed.reduce((s, m) => s + estimateTokenCount(m.content), 0);
            this.stats.push({
                text: '',
                originalTokens: origTokens,
                compressedTokens: compTokens,
                ratio: compTokens / origTokens,
            });
            this.trimStats();
        }

        // H-16: Preserve toolCall fields in compressed output
        return compressed.map((m) => {
            const orig =
                original.find((o) => o.role === m.role && o.content === m.content) ??
                original.find((o) => o.role === m.role) ??
                original[0];
            return {
                role: m.role as ChatMessage['role'],
                content: m.content,
                ...(orig!.name ? { name: orig!.name } : {}),
                ...(orig!.toolCallId ? { toolCallId: orig!.toolCallId } : {}),
                ...(orig!.toolCalls ? { toolCalls: orig!.toolCalls } : {}),
            };
        });
    }

    private trimStats(): void {
        if (this.stats.length > CompressRouteDecorator.MAX_STATS) {
            this.stats = this.stats.slice(-CompressRouteDecorator.MAX_STATS);
        }
    }

    getCompressionStats(): ReturnType<typeof getCompressionStats> {
        return getCompressionStats(this.stats);
    }

    clearStats(): void {
        this.stats = [];
    }

    async sendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<ProviderResponse> {
        const msgs = this.shouldCompress(messages) ? this.compress(messages) : messages;
        return this.inner.sendMessage(msgs, model, apiKey, signal, options);
    }

    async streamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<void> {
        const msgs = this.shouldCompress(messages) ? this.compress(messages) : messages;
        if (!this.inner.streamMessage)
            throw new Error('CompressRoute: inner adapter does not support streaming');
        return this.inner.streamMessage(msgs, model, apiKey, onChunk, signal, options);
    }

    destroy(): void {
        super.destroy();
    }
}
