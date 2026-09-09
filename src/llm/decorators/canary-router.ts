import type {
    ChatMessage,
    ProviderResponse,
    HealthCheckResult,
    LLMProviderAdapter,
    SendMessageOptions,
    StreamMeta,
} from '../core/types';
import { BaseDecorator } from '../core/base-decorator';

interface CanaryTarget {
    adapter: LLMProviderAdapter;
    model: string;
    weight: number;
}

export interface CanaryRouterConfig {
    targets: CanaryTarget[];
    stickySession: boolean;
}

export interface CanaryResult {
    target: string;
    model: string;
    success: boolean;
    latency: number;
    tokens: number;
    timestamp: number;
}

function pickTarget(targets: CanaryTarget[]): CanaryTarget {
    const totalWeight = targets.reduce((s, t) => s + t.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const t of targets) {
        roll -= t.weight;
        if (roll <= 0) return t;
    }
    return targets[targets.length - 1]!;
}

function simpleHash(s: string): string {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
}

export class CanaryRouterDecorator extends BaseDecorator {
    private sessionMap = new Map<string, { targetIndex: number; timestamp: number }>();
    private results: CanaryResult[] = [];
    private readonly maxResults: number;
    private static readonly SESSION_TTL = 30 * 60 * 1000;

    readonly #config: CanaryRouterConfig;

    constructor(config: CanaryRouterConfig, options?: { maxResults?: number }) {
        if (config.targets.length < 2) throw new Error('CanaryRouter requires at least 2 targets');
        super(config.targets[0]!.adapter);
        this.#config = config;
        this.maxResults = options?.maxResults ?? 1000;
    }

    get id(): string {
        return this.#config.targets.map((t) => `${t.adapter.id}:${t.model}`).join('|');
    }

    getControl(): CanaryTarget {
        return this.#config.targets[0]!;
    }

    getCandidate(): CanaryTarget {
        return this.#config.targets[1]!;
    }

    private selectTarget(messages: ChatMessage[], model: string): CanaryTarget {
        if (this.#config.stickySession) {
            const now = Date.now();
            const userMsg = messages.filter((m) => m.role === 'user').slice(-1)[0];
            const contentPrefix = (userMsg?.content ?? '').slice(0, 50);
            const sessionKey = `${model}:${contentPrefix.length}:${simpleHash(contentPrefix)}`;
            const cached = this.sessionMap.get(sessionKey);
            if (
                cached !== undefined &&
                cached.targetIndex < this.#config.targets.length &&
                now - cached.timestamp < CanaryRouterDecorator.SESSION_TTL
            ) {
                return this.#config.targets[cached.targetIndex]!;
            }
            const chosen = pickTarget(this.#config.targets);
            this.sessionMap.set(sessionKey, {
                targetIndex: this.#config.targets.indexOf(chosen),
                timestamp: now,
            });
            if (this.sessionMap.size > 1000) {
                for (const [key, val] of this.sessionMap) {
                    if (now - val.timestamp > CanaryRouterDecorator.SESSION_TTL)
                        this.sessionMap.delete(key);
                }
                if (this.sessionMap.size > 1000) {
                    const first = this.sessionMap.keys().next();
                    if (first.value) this.sessionMap.delete(first.value);
                }
            }
            return chosen;
        }
        return pickTarget(this.#config.targets);
    }

    private record(r: CanaryResult): void {
        this.results.push(r);
        if (this.results.length > this.maxResults) {
            this.results = this.results.slice(-this.maxResults);
        }
    }

    getResults(): CanaryResult[] {
        return [...this.results];
    }

    getSummary(): Record<
        string,
        { requests: number; avgLatency: number; avgTokens: number; errors: number }
    > {
        const summarize = (items: CanaryResult[]) => {
            if (items.length === 0) return { requests: 0, avgLatency: 0, avgTokens: 0, errors: 0 };
            return {
                requests: items.length,
                avgLatency: items.reduce((s, r) => s + r.latency, 0) / items.length,
                avgTokens: items.reduce((s, r) => s + r.tokens, 0) / items.length,
                errors: items.filter((r) => !r.success).length,
            };
        };

        const result: Record<
            string,
            { requests: number; avgLatency: number; avgTokens: number; errors: number }
        > = {};
        for (const target of this.#config.targets) {
            const targetResults = this.results.filter((r) => r.target === target.adapter.id);
            result[target.adapter.id] = summarize(targetResults);
        }
        return result;
    }

    clearResults(): void {
        this.results = [];
    }

    async sendMessage(
        messages: ChatMessage[],
        _model: string,
        apiKey: string,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<ProviderResponse> {
        const target = this.selectTarget(messages, _model);
        const start = Date.now();
        try {
            const res = await target.adapter.sendMessage(
                messages,
                target.model,
                apiKey,
                signal,
                options,
            );
            this.record({
                target: target.adapter.id,
                model: target.model,
                success: true,
                latency: res.latency,
                tokens: res.tokens,
                timestamp: Date.now(),
            });
            return res;
        } catch (e) {
            this.record({
                target: target.adapter.id,
                model: target.model,
                success: false,
                latency: Date.now() - start,
                tokens: 0,
                timestamp: Date.now(),
            });
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
        const target = this.selectTarget(messages, model);
        const start = Date.now();
        try {
            if (!target.adapter.streamMessage)
                throw new Error('CanaryRouter: target adapter does not support streaming');
            await target.adapter.streamMessage(
                messages,
                target.model,
                apiKey,
                onChunk,
                signal,
                options,
            );
            this.record({
                target: target.adapter.id,
                model: target.model,
                success: true,
                latency: Date.now() - start,
                tokens: 0,
                timestamp: Date.now(),
            });
        } catch (e) {
            this.record({
                target: target.adapter.id,
                model: target.model,
                success: false,
                latency: Date.now() - start,
                tokens: 0,
                timestamp: Date.now(),
            });
            throw e;
        }
    }

    async checkHealth(apiKey: string): Promise<HealthCheckResult> {
        const primary = await this.#config.targets[0]!.adapter.checkHealth(apiKey);
        if (primary.status === 'active') return primary;
        return this.#config.targets[1]!.adapter.checkHealth(apiKey);
    }

    async getAvailableModels(apiKey: string, signal?: AbortSignal): Promise<string[]> {
        const all = await Promise.all(
            this.#config.targets.map((t) => t.adapter.getAvailableModels(apiKey, signal)),
        );
        return [
            ...new Set(all.flat().filter((model): model is string => typeof model === 'string')),
        ];
    }

    destroy(): void {
        super.destroy();
    }
}
