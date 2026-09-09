import type { ChatMessage, ProviderResponse, SendMessageOptions, StreamMeta } from '../core/types';
import { BaseDecorator } from '../core/base-decorator';

export type Priority = 'high' | 'normal' | 'low';

interface QueueItem {
    messages: ChatMessage[];
    model: string;
    apiKey: string;
    signal?: AbortSignal;
    options?: SendMessageOptions;
    priority: Priority;
    resolve: (value: ProviderResponse) => void;
    reject: (reason: unknown) => void;
    cleanup?: () => void;
}

interface StreamQueueItem {
    messages: ChatMessage[];
    model: string;
    apiKey: string;
    onChunk: (chunk: string, meta?: StreamMeta) => void;
    signal?: AbortSignal;
    options?: SendMessageOptions;
    priority: Priority;
    resolve: () => void;
    reject: (reason: unknown) => void;
    cleanup?: () => void;
}

export interface PriorityQueueConfig {
    maxConcurrency: number;
    lowPriorityDelayMs: number;
    maxQueueSize: number;
}

const DEFAULT_CONFIG: PriorityQueueConfig = {
    maxConcurrency: 4,
    lowPriorityDelayMs: 200,
    maxQueueSize: 1000,
};

export class PriorityQueueDecorator extends BaseDecorator {
    private config: PriorityQueueConfig;
    private sendQueue: QueueItem[] = [];
    private streamQueue: StreamQueueItem[] = [];
    private activeSends = 0;
    private activeStreams = 0;
    private highPriorityStreak = 0;
    private sendProcessed = 0;
    private streamProcessed = 0;

    constructor(
        inner: import('../core/types').LLMProviderAdapter,
        config?: Partial<PriorityQueueConfig>,
    ) {
        super(inner);
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    get id(): string {
        return `${this.inner.id}[pq]`;
    }

    private processSendQueue(): void {
        if (this.activeSends >= this.config.maxConcurrency || this.sendQueue.length === 0) return;

        const order: Priority[] = ['high', 'normal', 'low'];

        // Anti-starvation: every 10th item serves 'low' if any pending
        let effectiveOrder = order;
        if (
            this.sendProcessed > 0 &&
            this.sendProcessed % 10 === 0 &&
            this.sendQueue.some((q) => q.priority === 'low')
        ) {
            effectiveOrder = ['low', 'high', 'normal'];
        } else if (
            this.highPriorityStreak >= 3 &&
            this.sendQueue.some((q) => q.priority === 'normal')
        ) {
            effectiveOrder = ['normal', 'high', 'low'];
        }

        for (const p of effectiveOrder) {
            const availableItems = this.sendQueue.filter((q) => q.priority === p);
            if (availableItems.length === 0) continue;

            // Batch path disabled: decorator chain always reports batchSendMessage as supported
            // (BaseDecorator delegates to inner), but no concrete adapter implements it.
            // The path always throws, causing all queued items to reject with a confusing error.

            // Single item sending
            const idx = this.sendQueue.indexOf(availableItems[0]!);
            const item = this.sendQueue.splice(idx, 1)[0]!;
            item.cleanup?.();
            this.activeSends++;
            this.sendProcessed++;
            if (p === 'high') this.highPriorityStreak++;
            else this.highPriorityStreak = 0;
            this.executeSend(item);
            return;
        }
    }

    private async executeSend(item: QueueItem): Promise<void> {
        try {
            const res = await this.inner.sendMessage(
                item.messages,
                item.model,
                item.apiKey,
                item.signal,
                item.options,
            );
            item.resolve(res);
        } catch (e) {
            item.reject(e);
        } finally {
            this.activeSends--;
            this.processSendQueue();
        }
    }

    private processStreamQueue(): void {
        if (this.activeStreams >= this.config.maxConcurrency || this.streamQueue.length === 0)
            return;

        const order: Priority[] = ['high', 'normal', 'low'];
        let effectiveOrder = order;
        if (
            this.streamProcessed > 0 &&
            this.streamProcessed % 10 === 0 &&
            this.streamQueue.some((q) => q.priority === 'low')
        ) {
            effectiveOrder = ['low', 'high', 'normal'];
        }
        for (const p of effectiveOrder) {
            const availableItems = this.streamQueue.filter((q) => q.priority === p);
            if (availableItems.length === 0) continue;

            // Batch path disabled: same reason as send batch path above.

            // Single item stream
            const idx = this.streamQueue.indexOf(availableItems[0]!);
            const item = this.streamQueue.splice(idx, 1)[0]!;
            item.cleanup?.();
            this.activeStreams++;
            this.streamProcessed++;
            this.executeStream(item);
            return;
        }
    }

    private async executeStream(item: StreamQueueItem): Promise<void> {
        if (!this.inner.streamMessage) {
            item.reject(new Error('PriorityQueue: inner adapter does not support streaming'));
            return;
        }
        try {
            await this.inner.streamMessage(
                item.messages,
                item.model,
                item.apiKey,
                item.onChunk,
                item.signal,
                item.options,
            );
            item.resolve();
        } catch (e) {
            item.reject(e);
        } finally {
            this.activeStreams--;
            this.processStreamQueue();
        }
    }

    private getPriority(
        apiKey: string,
        messages: ChatMessage[],
        options?: SendMessageOptions,
    ): Priority {
        if (options?.priority) return options.priority as Priority;
        if (apiKey.startsWith('high:')) return 'high';
        if (apiKey.startsWith('low:')) return 'low';
        const urgent = messages.some(
            (m) => m.role === 'system' && /urgent|critical|asap/i.test(m.content),
        );
        if (urgent) return 'high';
        return 'normal';
    }

    async sendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<ProviderResponse> {
        const priority = this.getPriority(apiKey, messages, options);

        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        if (priority === 'high' && this.activeSends < Math.max(1, this.config.maxConcurrency - 1)) {
            this.activeSends++;
            this.sendProcessed++;
            this.highPriorityStreak++;
            try {
                return await this.inner.sendMessage(messages, model, apiKey, signal, options);
            } finally {
                this.activeSends--;
                this.processSendQueue();
            }
        }

        if (priority === 'low') {
            await this.delayWithSignal(this.config.lowPriorityDelayMs, signal);
        }

        if (this.sendQueue.length >= this.config.maxQueueSize) {
            throw new Error('Queue is full, cannot add more items');
        }

        return new Promise<ProviderResponse>((resolve, reject) => {
            const item: QueueItem = {
                messages,
                model,
                apiKey,
                signal,
                options,
                priority,
                resolve,
                reject,
            };
            if (signal) {
                const onAbort = () => {
                    const idx = this.sendQueue.indexOf(item);
                    if (idx >= 0) {
                        this.sendQueue.splice(idx, 1);
                        reject(new DOMException('Aborted', 'AbortError'));
                    }
                };
                signal.addEventListener('abort', onAbort, { once: true });
                item.cleanup = () => signal.removeEventListener('abort', onAbort);
            }
            this.sendQueue.push(item);
            this.processSendQueue();
        });
    }

    async streamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<void> {
        const priority = this.getPriority(apiKey, messages, options);

        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        if (
            priority === 'high' &&
            this.activeStreams < Math.max(1, this.config.maxConcurrency - 1)
        ) {
            if (!this.inner.streamMessage)
                throw new Error('PriorityQueue: inner adapter does not support streaming');
            this.activeStreams++;
            this.streamProcessed++;
            try {
                return await this.inner.streamMessage(
                    messages,
                    model,
                    apiKey,
                    onChunk,
                    signal,
                    options,
                );
            } finally {
                this.activeStreams--;
                this.processStreamQueue();
            }
        }

        if (priority === 'low') {
            await this.delayWithSignal(this.config.lowPriorityDelayMs, signal);
        }

        if (this.streamQueue.length >= this.config.maxQueueSize) {
            throw new Error('Stream queue is full, cannot add more items');
        }

        return new Promise<void>((resolve, reject) => {
            const item: StreamQueueItem = {
                messages,
                model,
                apiKey,
                onChunk,
                signal,
                options,
                priority,
                resolve,
                reject,
            };
            if (signal) {
                const onAbort = () => {
                    const idx = this.streamQueue.indexOf(item);
                    if (idx >= 0) {
                        this.streamQueue.splice(idx, 1);
                        reject(new DOMException('Aborted', 'AbortError'));
                    }
                };
                signal.addEventListener('abort', onAbort, { once: true });
                item.cleanup = () => signal.removeEventListener('abort', onAbort);
            }
            this.streamQueue.push(item);
            this.processStreamQueue();
        });
    }

    getQueueStats(): {
        sendQueue: number;
        streamQueue: number;
        activeSends: number;
        activeStreams: number;
    } {
        return {
            sendQueue: this.sendQueue.length,
            streamQueue: this.streamQueue.length,
            activeSends: this.activeSends,
            activeStreams: this.activeStreams,
        };
    }

    private delayWithSignal(ms: number, signal?: AbortSignal): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (signal?.aborted) {
                reject(new DOMException('Aborted', 'AbortError'));
                return;
            }
            let onAbort: (() => void) | null = null;
            const timer = setTimeout(() => {
                if (onAbort && signal) signal.removeEventListener('abort', onAbort);
                resolve();
            }, ms);
            if (signal) {
                onAbort = () => {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted', 'AbortError'));
                };
                signal.addEventListener('abort', onAbort, { once: true });
            }
        });
    }

    destroy(): void {
        this.flushAll();
        super.destroy();
    }

    flushAll(): void {
        const error = new Error('Queue flushed');
        for (const item of this.sendQueue.splice(0)) {
            item.cleanup?.();
            item.reject(error);
        }
        for (const item of this.streamQueue.splice(0)) {
            item.cleanup?.();
            item.reject(error);
        }
    }
}
