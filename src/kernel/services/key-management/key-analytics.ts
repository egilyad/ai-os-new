import type { ApiKey, KeyExtendedStats } from '../../types/metrics-types';
import { CONFIG } from '../config-registry';
import { EVENTS } from '../../events/event-names';
import type { IKeyAnalyticsService } from '../../contracts/key-analytics';

export interface KeyAnalyticsDeps {
    pricingService: {
        calculateCost: (model: string, inputTokens: number, outputTokens: number) => number;
    };
    eventBus: {
        emit: (event: string, data?: unknown) => void;
    };
    onLatencyBurst: (id: string, provider: string, latency: number) => void;
    onStateChanged: (id: string, provider: string, newState: string, previousState: string) => void;
    onReputationThresholdCrossed: (id: string, provider: string, score: number) => void;
    ensureExtendedStats: (key: ApiKey) => void;
}

export class KeyAnalytics implements IKeyAnalyticsService {
    constructor(private deps: KeyAnalyticsDeps) {}

    private ensureUsageReset(ext: KeyExtendedStats): void {
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        const lastUpdate = ext.lastUsageDate;
        const currentMonthKey = now.getUTCFullYear() * 12 + now.getUTCMonth();
        const lastMonthKey = ext.lastUsageDate
            ? new Date(ext.lastUsageDate + 'T00:00:00Z').getUTCFullYear() * 12 +
              new Date(ext.lastUsageDate + 'T00:00:00Z').getUTCMonth()
            : -1;

        if (lastUpdate !== today) {
            ext.usageToday = { tokens: 0, weightedTokens: 0, requests: 0, estimatedCost: 0 };
            ext.hourlyUsage = new Array(24).fill(0);
            ext.lastUsageDate = today;
        }

        if (currentMonthKey !== lastMonthKey) {
            ext.usageMonthly = { tokens: 0, requests: 0, estimatedCost: 0 };
            ext.estimatedCost = 0;
        }
    }

    recordUsage(
        key: ApiKey,
        latency: number,
        tokens: number,
        model?: string,
        extra?: Record<string, unknown>,
    ): void {
        if (!key.stats) return;
        this.deps.ensureExtendedStats(key);
        const stats = key.stats;
        const ext = key.stats.extended!;

        const extExtra = extra as
            | {
                  tps?: number;
                  ttft?: number;
                  fullContent?: string;
                  inputTokens?: number;
                  outputTokens?: number;
                  task?: string;
                  failed?: boolean;
                  error?: string;
              }
            | undefined;

        if (extExtra?.failed) {
            stats.errorCount++;
            ext.errorBreakdown ??= {
                rateLimit: 0,
                timeout: 0,
                serverError: 0,
                validationError: 0,
                other: 0,
                provider: 0,
            };
            if (extExtra.error) {
                const err = extExtra.error.toLowerCase();
                if (err.includes('429') || err.includes('quota') || err.includes('rate limit')) {
                    ext.errorBreakdown.rateLimit = (ext.errorBreakdown.rateLimit ?? 0) + 1;
                } else if (err.includes('timeout') || err.includes('timed out')) {
                    ext.errorBreakdown.timeout = (ext.errorBreakdown.timeout ?? 0) + 1;
                } else if (
                    err.includes('401') ||
                    err.includes('403') ||
                    err.includes('unauthorized') ||
                    err.includes('forbidden') ||
                    err.includes('auth')
                ) {
                    ext.errorBreakdown.validationError =
                        (ext.errorBreakdown.validationError ?? 0) + 1;
                } else if (
                    err.includes('500') ||
                    err.includes('502') ||
                    err.includes('503') ||
                    err.includes('504') ||
                    err.includes('5xx') ||
                    err.includes('server error') ||
                    err.includes('service unavailable')
                ) {
                    ext.errorBreakdown.serverError = (ext.errorBreakdown.serverError ?? 0) + 1;
                } else {
                    ext.errorBreakdown.other = (ext.errorBreakdown.other ?? 0) + 1;
                }
            }
        } else {
            ext.latencyBreakdown ??= { ttft: 0, total: 0, tokensPerSec: 0 };
            const tps = extExtra?.tps || 0;

            stats.successCount++;
            stats.totalTokens += tokens;
            if (model) stats.lastModel = model;

            if (stats.minLatency === 0 || latency < stats.minLatency) stats.minLatency = latency;
            if (latency > stats.maxLatency) stats.maxLatency = latency;

            stats.avgLatency =
                stats.avgLatency === 0
                    ? latency
                    : Math.round(stats.avgLatency * 0.7 + latency * 0.3);

            if (ext.coldStartLatency === 0) ext.coldStartLatency = latency;
            else ext.warmStartLatency = ext.warmStartLatency * 0.8 + latency * 0.2;

            if (latency > ext.warmStartLatency * 2 && ext.warmStartLatency > 0) {
                this.deps.onLatencyBurst(key.id, key.provider, latency);
            }

            ext.latencyBreakdown = {
                ttft: extExtra?.ttft ?? latency * 0.4,
                total: latency,
                tokensPerSec: tps,
            };

            const maxConcurrent = Math.max(1, ext.rules.maxConcurrentRequests);
            ext.rateLimitPressure =
                ext.rateLimitPressure * 0.8 + (ext.currentConcurrentRequests / maxConcurrent) * 0.2;
            ext.stabilityIndex = Math.min(
                1.0,
                ext.stabilityIndex * 0.95 + (latency < ext.rules.timeoutMs ? 0.05 : 0),
            );

            this.ensureUsageReset(ext);
            if (extExtra?.failed) return;

            const currentHour = new Date().getHours();
            ext.hourlyUsage[currentHour] = (ext.hourlyUsage[currentHour] || 0) + 1;

            ext.usageToday.tokens += tokens;
            ext.usageToday.requests += 1;
            ext.usageMonthly.tokens += tokens;
            ext.usageMonthly.requests += 1;

            const inputTokens = extExtra?.inputTokens ?? Math.round(tokens * 0.3);
            const outputTokens = extExtra?.outputTokens ?? tokens;
            ext.usageToday.weightedTokens += inputTokens + outputTokens * 3;
            const sessionCost = this.deps.pricingService.calculateCost(
                model || key.stats.lastModel || 'default',
                inputTokens,
                outputTokens,
            );

            ext.estimatedCost += sessionCost;
            ext.usageToday.estimatedCost += sessionCost;
            ext.usageMonthly.estimatedCost += sessionCost;

            ext.fourSignals.latency = ext.fourSignals.latency * 0.9 + latency * 0.1;
            ext.fourSignals.throughput = ext.fourSignals.throughput * 0.7 + tps * 0.3;
            ext.fourSignals.saturation =
                ext.currentConcurrentRequests / Math.max(1, ext.rules.maxConcurrentRequests);
        }
    }

    updateMetricsFromResponse(
        key: ApiKey,
        res: {
            keyId?: string;
            provider: string;
            status: string;
            error?: string;
            latency?: number;
            ttft?: number;
            tokens?: number | { total?: number };
            tps?: number;
        },
    ): void {
        if (!key || !key.stats || !key.stats.extended) return;
        this.deps.ensureExtendedStats(key);
        const ext = key.stats.extended;

        this.ensureUsageReset(ext);

        ext.latencyBreakdown ??= { ttft: 0, total: 0, tokensPerSec: 0 };
        const latencyBreakdown = ext.latencyBreakdown;

        if (res.status === 'error') {
            key.stats.errorCount++;
            const errorMsg = res.error || 'Unknown error';

            const isRateLimit =
                errorMsg.includes('429') ||
                errorMsg.toLowerCase().includes('quota') ||
                errorMsg.toLowerCase().includes('rate limit');

            if (isRateLimit) {
                this.deps.eventBus.emit(EVENTS.KEY_QUOTA_EXCEEDED, {
                    id: key.id,
                    provider: key.provider,
                    quotaType: 'requests',
                });
            }

            const errLow = errorMsg.toLowerCase();
            if (
                errLow.includes('401') ||
                errLow.includes('403') ||
                errLow.includes('unauthorized') ||
                errLow.includes('forbidden') ||
                errLow.includes('auth')
            ) {
                ext.errorBreakdown.validationError = (ext.errorBreakdown.validationError ?? 0) + 1;
            } else if (
                errLow.includes('500') ||
                errLow.includes('502') ||
                errLow.includes('503') ||
                errLow.includes('504') ||
                errLow.includes('server error') ||
                errLow.includes('service unavailable')
            ) {
                ext.errorBreakdown.serverError = (ext.errorBreakdown.serverError ?? 0) + 1;
            } else {
                ext.errorBreakdown.other = (ext.errorBreakdown.other ?? 0) + 1;
            }
        } else if (res.status === 'done') {
            key.stats.successCount++;

            if (res.latency) {
                key.stats.avgLatency = key.stats.avgLatency * 0.7 + res.latency * 0.3;
                key.latency = res.latency;
                latencyBreakdown.total = res.latency;
                if (res.ttft) latencyBreakdown.ttft = res.ttft;
            }

            if (res.tokens) {
                const tokens = typeof res.tokens === 'number' ? res.tokens : res.tokens?.total || 0;
                key.stats.totalTokens += tokens;
                ext.usageToday.tokens += tokens;
                const model = key.stats.lastModel || 'default';
                const cost = this.deps.pricingService.calculateCost(
                    model,
                    Math.round(tokens * 0.3),
                    Math.round(tokens * 0.7),
                );
                ext.estimatedCost += cost;
                ext.usageToday.estimatedCost += cost;
            }

            if (res.tps) latencyBreakdown.tokensPerSec = res.tps;

            const tokensCount =
                typeof res.tokens === 'number' ? res.tokens : res.tokens?.total || 0;
            ext.throughputHistory = [
                ...(ext.throughputHistory || []),
                { timestamp: Date.now(), latency: res.latency || 0, tokens: tokensCount },
            ].slice(-20);

            this.calculateReputation(key);
        }
    }

    calculateReputation(key: ApiKey): void {
        if (!key.stats?.extended) return;
        const stats = key.stats;
        const ext = key.stats.extended;

        const successRate = stats.successCount / (stats.successCount + stats.errorCount || 1);
        const latencyFactor = Math.max(0, 1 - stats.avgLatency / 5000);

        const prevScore = ext.reputationScore;
        ext.reputationScore = Math.floor((successRate * 0.7 + latencyFactor * 0.3) * 100);

        if (ext.reputationScore < 40) ext.state = 'DEGRADED';
        else if (ext.reputationScore < 80) ext.state = 'UNSTABLE';
        else ext.state = 'HEALTHY';

        if (prevScore && Math.abs(ext.reputationScore - prevScore) > 20) {
            this.deps.onReputationThresholdCrossed(key.id, key.provider, ext.reputationScore);
        }
    }

    recalculateAllReputations(keys: ApiKey[]): void {
        for (const key of keys) {
            this.calculateReputation(key);
        }
    }

    incrementConcurrency(key: ApiKey): void {
        if (key.stats?.extended) {
            key.stats.extended.currentConcurrentRequests++;
        }
    }

    decrementConcurrency(key: ApiKey): void {
        if (key.stats?.extended) {
            key.stats.extended.currentConcurrentRequests = Math.max(
                0,
                key.stats.extended.currentConcurrentRequests - 1,
            );
        }
    }

    resetKeyStats(key: ApiKey): void {
        if (!key.stats) return;
        key.stats = {
            successCount: 0,
            errorCount: 0,
            totalTokens: 0,
            avgLatency: 0,
            minLatency: 0,
            maxLatency: 0,
            extended: {
                reputationScore: 100,
                stabilityForecast: 'stable',
                fingerprint: crypto.randomUUID().slice(0, 6),
                state: 'HEALTHY',
                activeSLA: 'BALANCED',
                stabilityIndex: 1,
                retryImpactScore: 0,
                rateLimitPressure: 0,
                keyAgeScore: 1,
                latencyBreakdown: { ttft: 0, total: 0, tokensPerSec: 0 },
                coldStartLatency: 0,
                warmStartLatency: 0,
                throughputHistory: [],
                errorBreakdown: {
                    rateLimit: 0,
                    timeout: 0,
                    serverError: 0,
                    validationError: 0,
                    other: 0,
                    provider: 0,
                },
                estimatedCost: 0,
                tokenEfficiency: 1,
                quality: {
                    score: 1,
                    semanticDrift: 0,
                    instructionFollowing: 1,
                    structureConsistency: 1,
                },
                contextUtilization: 0,
                retentionCurve: [],
                streaming: {},
                userPreferenceScore: 0.5,
                manualSwitches: 0,
                cancellations: 0,
                traces: [],
                fourSignals: { latency: 0, throughput: 0, errorRate: 0, saturation: 0 },
                rules: structuredClone(CONFIG.keys.defaultRules),
                learning: {
                    specialization: [],
                    performanceByTask: {},
                    taskMatrix: {},
                    advisorInsights: { recommendedFor: [], avoidFor: [], confidence: 0 },
                    lastFiveResults: [],
                },
                currentConcurrentRequests: 0,
                usageToday: { tokens: 0, weightedTokens: 0, requests: 0, estimatedCost: 0 },
                usageMonthly: { tokens: 0, requests: 0, estimatedCost: 0 },
                alerts: [],
                lastUsageDate: new Date().toISOString().slice(0, 10),
                hourlyUsage: new Array(24).fill(0),
            },
        };
    }
}
