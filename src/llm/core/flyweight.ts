import type { SendMessageOptions } from './types';

export class LLMFlyweightConfig {
    private static pool: Map<string, SendMessageOptions> = new Map();
    private static timestamps: Map<string, number> = new Map();
    private static readonly MAX_SIZE = 1000;
    private static readonly TTL_MS = 30 * 60 * 1000; // 30 minutes

    static get(options?: SendMessageOptions): SendMessageOptions | undefined {
        if (!options) return undefined;

        this.evictExpired();

        // Construct unique serialization key for intrinsic properties
        const key = JSON.stringify({
            temp: options.temperature,
            tokens: options.maxOutputTokens,
            stop: options.stopSequences,
            format: options.responseFormat,
            safety: options.safetySettings,
            tools: options.tools,
            toolChoice: options.toolChoice,
        });

        if (!this.pool.has(key)) {
            // Evict oldest entries if pool is too large
            if (this.pool.size >= this.MAX_SIZE) {
                this.evictOldest();
            }

            // Freeze the options to enforce immutability of intrinsic state
            const immutableOptions = Object.freeze({
                temperature: options.temperature,
                maxOutputTokens: options.maxOutputTokens,
                stopSequences: options.stopSequences ? [...options.stopSequences] : undefined,
                toolChoice: options.toolChoice,
                responseFormat: options.responseFormat ? { ...options.responseFormat } : undefined,
                safetySettings: options.safetySettings
                    ? options.safetySettings.map((s) => ({ ...s }))
                    : undefined,
                tools: options.tools
                    ? options.tools.map((t) =>
                          Object.freeze({
                              ...t,
                              function: t.function ? Object.freeze({ ...t.function }) : undefined,
                          }),
                      )
                    : undefined,
            });
            this.pool.set(key, immutableOptions);
            this.timestamps.set(key, Date.now());
        }

        return this.pool.get(key);
    }

    private static evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTimestamp = Infinity;

        for (const [key, timestamp] of this.timestamps.entries()) {
            if (timestamp < oldestTimestamp) {
                oldestTimestamp = timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.pool.delete(oldestKey);
            this.timestamps.delete(oldestKey);
        }
    }

    private static evictExpired(): void {
        const now = Date.now();
        const keysToEvict: string[] = [];
        for (const [key, timestamp] of this.timestamps.entries()) {
            if (now - timestamp > this.TTL_MS) {
                keysToEvict.push(key);
            }
        }
        for (const key of keysToEvict) {
            this.pool.delete(key);
            this.timestamps.delete(key);
        }
    }

    static getPoolSize(): number {
        // Periodically evict expired entries
        this.evictExpired();
        return this.pool.size;
    }

    static clear(): void {
        this.pool.clear();
        this.timestamps.clear();
    }
}
