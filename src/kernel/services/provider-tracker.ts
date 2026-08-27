import type { ProviderState } from '../types/metrics-types';
import type { ICostCalculator } from '../contracts/pricing';
import type { IKeyStateStore } from '../contracts/key-state';
import type { IEventBus, HealthEvent, HealthEventType } from '../types/interfaces';
import type { IProviderTracker } from '../types/interfaces';
import { rootLogger } from './logger-service';
import { EVENTS } from '../events/event-names';
import { estimateTokens } from '../utils/tokenEstimate';

/** Metric data received from provider events for tracking */
export interface ProviderMetricData {
    provider: string;
    latency: number;
    tokens?: number;
    fullContent?: string;
    model?: string;
    ttft?: number;
}

const ALPHA = 0.15;
const LOGGER = rootLogger.child('ProviderTracker');

// Re-export for backward compat — canonical definition lives in types/interfaces.ts
export type { IProviderTracker };
export type { HealthEvent, HealthEventType } from '../types/interfaces';

export interface ProviderTrackerDeps {
    costCalculator?: ICostCalculator;
    keyStateStore?: IKeyStateStore;
    database?: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    eventBus?: IEventBus;
}

export interface ProviderRanking {
    provider: string;
    score: number;
    reliability: number;
    avgLatency: number;
    requests: number;
    costPerRequest: number;
    recommendation: 'recommended' | 'good' | 'fair' | 'avoid';
    installed: boolean;
}

export class ProviderTracker implements IProviderTracker {
    private costCalculator?: ICostCalculator;
    private keyStateStore?: IKeyStateStore;
    private database?: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    private eventBus?: IEventBus;
    private transientHealthEvents: HealthEvent[] = [];
    private latencyWarnings = new Map<string, number>();
    private static readonly MAX_HEALTH_EVENTS = 100;
    private static readonly METRICS_KEY = 'provider_tracker_metrics';
    private unsubs: Array<() => void> = [];
    private _metrics = new Map<string, ProviderState>();

    constructor(deps?: ProviderTrackerDeps) {
        this.costCalculator = deps?.costCalculator;
        this.keyStateStore = deps?.keyStateStore;
        this.database = deps?.database;
    }

    /**
     * ILifecycle init — sets up event subscriptions.
     * Accepts optional eventBus for direct use; otherwise uses stored reference (set by start()).
     */
    init(eventBus?: IEventBus): void | Promise<void> {
        const bus = eventBus ?? this.eventBus;
        if (!bus || this.unsubs.length > 0) return; // already subscribed or no bus
        this.eventBus = bus;
        this.unsubs.push(
            bus.onSafe<{ id: string }>(EVENTS.KEY_REMOVED, (data) => {
                this.latencyWarnings.delete(data.id);
            }),
            bus.on(EVENTS.STREAM_END, (raw: unknown) => {
                const data = raw as {
                    provider?: string;
                    latency: number;
                    tokens?: number;
                    fullContent?: string;
                    model?: string;
                    ttft?: number;
                    requestId?: string;
                };
                // H-167: Skip probe events to avoid polluting real provider metrics
                if (data?.requestId?.startsWith('probe-')) return;
                if (data?.provider) this.handleMetricUpdate(data as ProviderMetricData);
            }),
            bus.on(EVENTS.STREAM_ERROR, (raw: unknown) => {
                const data = raw as { provider: string };
                if (data?.provider) this.handleErrorUpdate(data);
            }),
            bus.on(EVENTS.DECISION, (raw: unknown) => {
                const data = raw as { selected: string };
                if (data?.selected) this.handleDecision();
            }),
        );
        void this.hydrateMetrics();
    }

    /**
     * Stores the eventBus and delegates to init() — supports both lifecycle manager
     * (no-arg start()) and factory (eventBus-arg start(eventBus)) call patterns.
     */
    start(eventBus?: IEventBus): void {
        if (eventBus) {
            this.init(eventBus);
        }
        // No-arg call from LifecycleManager.startAll() — just skip (already subscribed via init)
    }

    private async hydrateMetrics(): Promise<void> {
        if (!this.database) return;
        try {
            const saved = await this.database.getKv<Record<string, ProviderState>>(
                ProviderTracker.METRICS_KEY,
            );
            if (saved && typeof saved === 'object') {
                for (const [id, prov] of Object.entries(saved)) {
                    this._metrics.set(id.toLowerCase(), prov);
                }
            }
        } catch (e) {
            LOGGER.warn('ProviderTracker', 'Failed to restore persisted state', { error: e });
        }
    }

    private persistMetrics(): void {
        if (!this.database) return;
        const obj: Record<string, ProviderState> = {};
        for (const [id, prov] of this._metrics) {
            obj[id] = prov;
        }
        void this.database
            .setKv(ProviderTracker.METRICS_KEY, obj)
            .catch((e) => LOGGER.warn('ProviderTracker', 'Persist metrics failed', { error: e }));
    }

    private handleMetricUpdate(data: ProviderMetricData): void {
        const p = data.provider.toLowerCase();
        const base = this._metrics.get(p) ?? this.getDefaultProvider(p);
        const prev = { ...base };

        const tokens = data.tokens || estimateTokens(data.fullContent || '');
        const genTime = (data.latency - (data.ttft || 0)) / 1000;
        let currentTPS = prev.avgTPS;
        if (genTime > 0 && tokens > 0) {
            const raw = tokens / genTime;
            if (isFinite(raw) && raw >= 0) currentTPS = raw;
        }

        prev.avgTTFT = data.ttft ? ALPHA * data.ttft + (1 - ALPHA) * prev.avgTTFT : prev.avgTTFT;
        prev.avgTPS = ALPHA * currentTPS + (1 - ALPHA) * prev.avgTPS;
        const quality =
            data.ttft && data.latency
                ? Math.max(0, Math.min(1, 1 - data.ttft / data.latency))
                : 0.9;
        prev.reliability = ALPHA * quality + (1 - ALPHA) * prev.reliability;
        prev.stabilityIndex = Math.min(1.0, ALPHA * quality + (1 - ALPHA) * prev.stabilityIndex);
        prev.reputationScore = Math.min(100, ALPHA * 100 + (1 - ALPHA) * prev.reputationScore);
        prev.status =
            prev.reliability > 0.8 ? 'healthy' : prev.reliability > 0.4 ? 'degraded' : 'offline';
        prev.totalRequests++;

        if (data.model) {
            const model = data.model.toLowerCase();
            const inputTokens = Math.ceil(tokens * 0.3);
            const outputTokens = tokens - inputTokens;
            const requestCost = this.costCalculator
                ? this.costCalculator.calculateCost(model, inputTokens, outputTokens)
                : (inputTokens * 0.002 + outputTokens * 0.008) / 1000; // $0.002/1K in + $0.008/1K out fallback
            prev.estimatedCost = (prev.estimatedCost || 0) + requestCost;
        }

        this._metrics.set(p, prev);

        this.detectLatencySpike(p, data);
        if (data.ttft && this.detectRecovery(p, prev, base))
            this.recordHealthEvent(p, 'recovery', `TTFT improved to ${data.ttft}ms`);
        this.detectStatusChange(p, base.status, prev.status);
        this.persistMetrics();
    }

    private handleErrorUpdate(data: { provider: string }): void {
        const p = data.provider.toLowerCase();
        const base = this._metrics.get(p) ?? this.getDefaultProvider(p);
        const prev = { ...base };
        prev.reliability = ALPHA * 0 + (1 - ALPHA) * prev.reliability;
        prev.stabilityIndex = Math.max(0, ALPHA * 0 + (1 - ALPHA) * prev.stabilityIndex);
        prev.reputationScore = Math.max(0, ALPHA * 0 + (1 - ALPHA) * prev.reputationScore);
        prev.totalRequests++;
        this._metrics.set(p, prev);
        this.detectErrorBurst(p, prev);
        this.detectStatusChange(p, base.status, prev.status);
        this.persistMetrics();
    }

    private handleDecision(): void {
        const total = this._metrics.size;
        if (total === 0) return;
        const counts: Record<string, number> = {};
        for (const [id, prov] of this._metrics) {
            counts[id] = prov.totalRequests || 0;
        }
        const grandTotal = Object.values(counts).reduce((a, b) => a + b, 0);
        if (grandTotal === 0) return;
        for (const [id, prov] of this._metrics) {
            prov.selectionRate = (counts[id] || 0) / grandTotal;
            this._metrics.set(id, prov);
        }
    }

    getHealthEvents(provider?: string, limit = 100): HealthEvent[] {
        const normalizedProvider = provider?.toLowerCase();
        return this.transientHealthEvents
            .filter(
                (event) =>
                    !normalizedProvider || event.provider.toLowerCase() === normalizedProvider,
            )
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    destroy(): void {
        for (const unsub of this.unsubs) unsub();
        this.unsubs = [];
        this.transientHealthEvents = [];
        this._metrics.clear();
        this.latencyWarnings.clear();
    }

    getMetrics(
        _provider: string,
        keyId: string,
    ): {
        errors: number;
        totalRequests: number;
        avgLatency: number;
        quotaRemaining: number;
        quotaLimit: number;
        reputation: number;
        lastUsed: number;
    } | null {
        const state = this.keyStateStore?.get(keyId);
        if (!state) return null;
        return {
            errors: state.health.consecutiveErrors,
            totalRequests: state.quota.usedRequests,
            avgLatency: state.lastProbe.latency,
            quotaRemaining: state.quota.limitTokens - state.quota.usedTokens,
            quotaLimit: state.quota.limitTokens,
            reputation: state.healthScore,
            lastUsed: state.updatedAt,
        };
    }

    getProviderRankings(catalogProviders: string[] = []): ProviderRanking[] {
        const installed = new Set(catalogProviders.map((p) => p.toLowerCase()));
        const seen = new Set<string>();
        const rankings: ProviderRanking[] = [];

        const pushRanking = (id: string, p: ProviderState) => {
            const norm = id.toLowerCase();
            if (seen.has(norm)) return;
            seen.add(norm);
            const reliability = p.reliability || 0;
            const latencyPenalty = Math.min(1, p.avgTTFT / 3000);
            const hasTraffic = p.totalRequests > 0;
            const score = hasTraffic
                ? reliability * 0.6 + (1 - latencyPenalty) * 0.4
                : installed.has(norm)
                  ? 0.45
                  : 0;
            const costPerRequest =
                hasTraffic && (p.estimatedCost || 0) > 0
                    ? (p.estimatedCost || 0) / p.totalRequests
                    : 0;
            const recommendation = !hasTraffic
                ? installed.has(norm)
                    ? 'fair'
                    : 'avoid'
                : score > 0.8
                  ? 'recommended'
                  : score > 0.6
                    ? 'good'
                    : score > 0.3
                      ? 'fair'
                      : 'avoid';
            rankings.push({
                provider: norm,
                score,
                reliability,
                avgLatency: p.avgTTFT,
                requests: p.totalRequests,
                costPerRequest,
                recommendation,
                installed: installed.has(norm),
            });
        };

        for (const [id, p] of this._metrics) {
            if (p.totalRequests > 0 || installed.has(id)) {
                pushRanking(id, p);
            }
        }

        for (const raw of catalogProviders) {
            const id = raw.toLowerCase();
            if (seen.has(id)) continue;
            pushRanking(id, this._metrics.get(id) ?? this.getDefaultProvider(raw));
        }

        return rankings.sort((a, b) => b.score - a.score);
    }

    getCollaborativeSuggestions(
        installedProviders: string[] = [],
    ): Array<{ provider: string; reason: string; matchScore: number }> {
        const installed = new Set(installedProviders.map((p) => p.toLowerCase()));
        const suggestions: Array<{ provider: string; reason: string; matchScore: number }> = [];

        const knownProviders = [
            'openai',
            'anthropic',
            'gemini',
            'groq',
            'nvidia',
            'openrouter',
            'deepseek',
            'mistral',
            'cohere',
            'cloudflare',
            'together',
            'fireworks',
            'cerebras',
        ];

        const heuristicPairs: Array<[string, string, string, number]> = [
            ['openai', 'anthropic', 'Pairs well for reasoning diversity', 0.82],
            ['gemini', 'groq', 'Low-latency complement to Gemini', 0.75],
            ['openrouter', 'nvidia', 'Self-hosted NIM alternative to OpenRouter', 0.68],
            ['groq', 'deepseek', 'Cost-effective coding alongside Groq', 0.71],
        ];
        for (const [a, b, reason, score] of heuristicPairs) {
            if (installed.has(a) && !installed.has(b)) {
                suggestions.push({ provider: b, reason, matchScore: score });
            }
        }

        for (const p of knownProviders) {
            if (!installed.has(p) && !suggestions.some((s) => s.provider === p)) {
                const state = this._metrics.get(p);
                const used = state?.totalRequests || 0;
                if (used > 0) {
                    suggestions.push({
                        provider: p,
                        reason: 'Had traffic before — consider re-adding keys',
                        matchScore: 0.58,
                    });
                }
            }
        }

        const deduped = new Map<string, { provider: string; reason: string; matchScore: number }>();
        for (const s of suggestions.sort((a, b) => b.matchScore - a.matchScore)) {
            const prev = deduped.get(s.provider);
            if (!prev || prev.matchScore < s.matchScore) deduped.set(s.provider, s);
        }
        return [...deduped.values()].sort((a, b) => b.matchScore - a.matchScore);
    }

    private recordHealthEvent(provider: string, type: HealthEventType, detail: string): void {
        this.transientHealthEvents.push({ provider, type, detail, timestamp: Date.now() });
        if (this.transientHealthEvents.length > ProviderTracker.MAX_HEALTH_EVENTS) {
            this.transientHealthEvents.shift();
        }
    }

    private getDefaultProvider(id: string): ProviderState {
        return {
            id,
            avgTTFT: 0,
            avgTPS: 0,
            reliability: 0,
            stabilityIndex: 0,
            reputationScore: 0,
            totalRequests: 0,
            selectionRate: 0,
            status: 'unknown',
        };
    }

    private detectLatencySpike(provider: string, data: ProviderMetricData): void {
        if (!data.ttft) return;
        const prev = this.latencyWarnings.get(provider) ?? 0;
        if (data.ttft > 5000 && Date.now() - prev > 30_000) {
            this.recordHealthEvent(provider, 'latency_spike', `TTFT spike: ${data.ttft}ms`);
            this.latencyWarnings.set(provider, Date.now());
        }
    }

    private detectErrorBurst(provider: string, _state: ProviderState): void {
        const kss = this.keyStateStore
            ?.getAll()
            ?.find((s) => s.provider.toLowerCase() === provider);
        const consecutive = kss?.health.consecutiveErrors ?? 0;
        if (consecutive >= 5 && consecutive % 5 === 0) {
            this.recordHealthEvent(provider, 'error_burst', `${consecutive} consecutive errors`);
        }
    }

    private detectRecovery(
        _provider: string,
        current: ProviderState,
        previous: ProviderState,
    ): boolean {
        return previous.reliability < 0.4 && current.reliability >= 0.4;
    }

    private detectStatusChange(provider: string, oldStatus: string, newStatus: string): void {
        if (oldStatus !== newStatus) {
            this.recordHealthEvent(provider, 'status_change', `${oldStatus} → ${newStatus}`);
        }
    }
}
