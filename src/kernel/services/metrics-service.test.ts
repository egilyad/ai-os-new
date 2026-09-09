import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetricsService } from './metrics-service';
import type { MetricsServiceDeps } from './metrics-service';
import type { SystemState } from '../../kernel/types/metrics-types';

function createDeps(overrides?: Partial<MetricsServiceDeps>): MetricsServiceDeps {
    return {
        eventBus: {
            on: vi.fn(() => vi.fn()),
            emit: vi.fn(),
        },
        database: {
            getKv: vi.fn().mockResolvedValue(null),
            setKv: vi.fn().mockResolvedValue(undefined),
        },
        kernel: {
            getState: vi.fn(
                () =>
                    ({
                        providers: {} as Record<string, unknown>,
                        weights: {
                            base: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
                            adaptiveDelta: { ttft: 0, tps: 0, reliability: 0 },
                            effective: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
                        },
                        decisions: [],
                        totalRequests: 100,
                        totalTokens: 50000,
                        estimatedCost: 1.25,
                        explorationFactor: 0.5,
                        violations: [],
                        activeSLA: 'DEFAULT' as const,
                        history: [],
                    }) as never,
            ),
        },
        ...overrides,
    } as MetricsServiceDeps;
}

function makeProviderState(_id: string, overrides?: Record<string, unknown>) {
    return {
        status: 'healthy' as const,
        avgTTFT: 150,
        avgTPS: 25,
        totalRequests: 50,
        errorCount: 2,
        totalTokens: 10000,
        reliability: 0.95,
        stabilityIndex: 0.9,
        reputationScore: 80,
        currentConcurrent: 3,
        ...overrides,
    };
}

describe('MetricsService', () => {
    let deps: ReturnType<typeof createDeps>;
    let service: MetricsService;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(1000000);
        deps = createDeps();
        service = new MetricsService(deps);
        await service.init();
    });

    afterEach(() => {
        vi.useRealTimers();
        service.destroy();
    });

    describe('init', () => {
        it('loads saved state from database', async () => {
            const saved = {
                history: [{ timestamp: 1, value: 10, label: 'requests' }],
                thresholds: [],
                alerts: [],
            };
            deps = createDeps({
                database: { getKv: vi.fn().mockResolvedValue(saved), setKv: vi.fn() },
            });
            service = new MetricsService(deps);
            await service.init();
            expect(service.getHistory()).toHaveLength(1);
        });

        it('is idempotent', async () => {
            const spy = deps.database.getKv;
            await service.init();
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('subscribes to kernel:updated', () => {
            expect(deps.eventBus.on).toHaveBeenCalledWith('kernel:updated', expect.any(Function));
        });

        it('subscribes to cognitive:step:completed', () => {
            expect(deps.eventBus.on).toHaveBeenCalledWith(
                'cognitive:step:completed',
                expect.any(Function),
            );
        });
    });

    describe('generateAggregated', () => {
        it('computes metrics from kernel state with no providers', () => {
            const report = service.generateAggregated();
            expect(report.totalRequests).toBe(100);
            expect(report.totalTokens).toBe(50000);
            expect(report.estimatedCost).toBe(1.25);
            expect(report.avgLatency).toBe(0);
            expect(report.successRate).toBe(1);
            expect(report.errorRate).toBe(0);
            expect(report.activeProviders).toBe(0);
        });

        it('computes metrics with providers', () => {
            deps.kernel.getState = vi.fn(
                () =>
                    ({
                        providers: {
                            groq: makeProviderState('groq', {
                                avgTTFT: 200,
                                totalRequests: 100,
                                errorCount: 10,
                            }),
                            gemini: makeProviderState('gemini', {
                                avgTTFT: 100,
                                totalRequests: 50,
                                errorCount: 0,
                            }),
                        },
                        totalRequests: 150,
                        totalTokens: 60000,
                        estimatedCost: 2.0,
                        decisions: [],
                        violations: [],
                        weights: {
                            base: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
                            adaptiveDelta: { ttft: 0, tps: 0, reliability: 0 },
                            effective: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
                        },
                        explorationFactor: 0.5,
                        activeSLA: 'DEFAULT' as const,
                        history: [],
                    }) as never,
            );
            const report = service.generateAggregated();
            expect(report.avgLatency).toBe(150);
            expect(report.activeProviders).toBe(2);
            expect(report.errorRate).toBeCloseTo(10 / 150);
            expect(report.successRate).toBeCloseTo(140 / 150);
        });
    });

    describe('generateProviderSummaries', () => {
        it('lists all providers with metrics', () => {
            deps.kernel.getState = vi.fn(
                () =>
                    ({
                        providers: {
                            groq: makeProviderState('groq', { avgTTFT: 200, totalRequests: 100 }),
                            gemini: makeProviderState('gemini', {
                                avgTTFT: 100,
                                totalRequests: 50,
                            }),
                        },
                        totalRequests: 150,
                        totalTokens: 60000,
                        estimatedCost: 2.0,
                        decisions: [],
                        violations: [],
                        weights: {
                            base: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
                            adaptiveDelta: { ttft: 0, tps: 0, reliability: 0 },
                            effective: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
                        },
                        explorationFactor: 0.5,
                        activeSLA: 'DEFAULT' as const,
                        history: [],
                    }) as never,
            );
            const summaries = service.generateProviderSummaries();
            expect(summaries).toHaveLength(2);
            const groq = summaries.find((s) => s.id === 'groq');
            expect(groq?.avgLatency).toBe(200);
        });
    });

    describe('generateReport', () => {
        it('returns full report with aggregated and providers', () => {
            deps.kernel.getState = vi.fn(
                () =>
                    ({
                        providers: {
                            groq: makeProviderState('groq', { reputationScore: 90 }),
                            gemini: makeProviderState('gemini', { reputationScore: 70 }),
                        },
                        totalRequests: 100,
                        totalTokens: 50000,
                        estimatedCost: 1.25,
                        decisions: [],
                        violations: [],
                        weights: {
                            base: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
                            adaptiveDelta: { ttft: 0, tps: 0, reliability: 0 },
                            effective: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
                        },
                        explorationFactor: 0.5,
                        activeSLA: 'DEFAULT' as const,
                        history: [],
                    }) as never,
            );
            const report = service.generateReport();
            expect(report.aggregated).toBeDefined();
            expect(report.providers).toHaveLength(2);
            expect(report.topProvider?.id).toBe('groq');
            expect(report.worstProvider?.id).toBe('gemini');
            expect(report.timestamp).toBe(1000000);
        });
    });

    describe('getHistory', () => {
        beforeEach(() => {
            const hist = [
                { timestamp: 1, value: 10, label: 'requests' },
                { timestamp: 2, value: 20, label: 'tokens' },
                { timestamp: 3, value: 30, label: 'requests' },
            ];
            deps = createDeps({
                database: {
                    getKv: vi.fn().mockResolvedValue({ history: hist, thresholds: [], alerts: [] }),
                    setKv: vi.fn(),
                },
                kernel: deps.kernel,
            });
            service = new MetricsService(deps);
        });

        it('returns all points without filter', async () => {
            await service.init();
            expect(service.getHistory()).toHaveLength(3);
        });

        it('filters by metric label', async () => {
            await service.init();
            const reqs = service.getHistory('requests');
            expect(reqs).toHaveLength(2);
            expect(reqs.every((p) => p.label === 'requests')).toBe(true);
        });

        it('limits results', async () => {
            await service.init();
            expect(service.getHistory(undefined, 1)).toHaveLength(1);
        });
    });

    describe('alerts', () => {
        it('getAlerts returns unresolved by default', () => {
            expect(service.getAlerts()).toEqual([]);
        });

        it('resolveAlert marks alert as resolved', () => {
            const alert = {
                id: 'alert-1',
                metric: 'avgLatency',
                value: 5000,
                threshold: 3000,
                severity: 'warning' as const,
                timestamp: 1000,
                resolved: false,
            };
            service['alerts'].push(alert);
            service.resolveAlert('alert-1');
            expect(service.getAlerts()).toHaveLength(0);
            expect(service.getAlerts(true)).toHaveLength(1);
            expect(service.getAlerts(true)[0].resolved).toBe(true);
        });

        it('resolveAlert emits METRICS_ALERT_RESOLVED', () => {
            const alert = {
                id: 'alert-2',
                metric: 'errorRate',
                value: 0.5,
                threshold: 0.25,
                severity: 'critical' as const,
                timestamp: 1000,
                resolved: false,
            };
            service['alerts'].push(alert);
            service.resolveAlert('alert-2');
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                'observability:metrics:alert:resolved',
                expect.objectContaining({ id: 'alert-2' }),
            );
        });
    });

    describe('thresholds', () => {
        it('getThresholds returns defaults', () => {
            const thresholds = service.getThresholds();
            expect(thresholds.length).toBeGreaterThan(0);
            expect(thresholds[0].metric).toBe('avgLatency');
        });

        it('setThresholds persists new thresholds', () => {
            const custom = [
                {
                    metric: 'avgLatency' as const,
                    warning: 9999,
                    critical: 19999,
                    operator: 'gt' as const,
                },
            ];
            service.setThresholds(custom);
            expect(service.getThresholds()).toEqual(custom);
        });
    });

    describe('resetHistory', () => {
        it('clears history and alerts', async () => {
            const hist = [{ timestamp: 1, value: 10, label: 'test' }];
            deps = createDeps({
                database: {
                    getKv: vi.fn().mockResolvedValue({ history: hist, thresholds: [], alerts: [] }),
                    setKv: vi.fn(),
                },
                kernel: deps.kernel,
            });
            service = new MetricsService(deps);
            await service.init();
            expect(service.getHistory()).toHaveLength(1);
            service.resetHistory();
            expect(service.getHistory()).toHaveLength(0);
        });
    });

    describe('getTimeRange', () => {
        it('filters points within time range', () => {
            const pts = [
                { timestamp: 100, value: 1, label: 'a' },
                { timestamp: 200, value: 2, label: 'b' },
                { timestamp: 300, value: 3, label: 'c' },
            ];
            service['history'] = pts;
            const result = service.getTimeRange(150, 250);
            expect(result).toHaveLength(1);
            expect(result[0].label).toBe('b');
        });
    });

    describe('recordLatency / getAgentPercentiles', () => {
        it('records latency and computes percentiles', () => {
            service.recordLatency('agent-1', 100);
            service.recordLatency('agent-1', 200);
            service.recordLatency('agent-1', 300);
            const p = service.getAgentPercentiles('agent-1');
            expect(p.p50).toBe(200);
            expect(p.p90).toBe(300);
        });

        it('returns zeros for unknown agent', () => {
            const p = service.getAgentPercentiles('unknown');
            expect(p).toEqual({ p50: 0, p90: 0, p95: 0, p99: 0 });
        });
    });

    describe('recordThroughput / getAgentThroughput', () => {
        it('records throughput and calculates rate', () => {
            vi.setSystemTime(0);
            service.recordThroughput('agent-1');
            service.recordThroughput('agent-1');
            vi.setSystemTime(10000);
            const rate = service.getAgentThroughput('agent-1');
            expect(rate).toBeCloseTo(0.2);
        });

        it('returns 0 for unknown agent', () => {
            expect(service.getAgentThroughput('unknown')).toBe(0);
        });
    });

    describe('threshold breach alert', () => {
        const stateWithHighLatency = () =>
            ({
                providers: {
                    test: makeProviderState('test', { avgTTFT: 5000 }),
                },
                totalRequests: 100,
                totalTokens: 50000,
                estimatedCost: 1.25,
                decisions: [],
                violations: [],
                weights: {
                    base: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
                    adaptiveDelta: { ttft: 0, tps: 0, reliability: 0 },
                    effective: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
                },
                explorationFactor: 0.5,
                activeSLA: 'DEFAULT' as const,
                history: [],
            }) as never;

        it('emits alert when avgLatency exceeds warning threshold', () => {
            deps.kernel.getState = vi.fn(stateWithHighLatency);
            service['captureSnapshot']();
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                'observability:metrics:alert',
                expect.objectContaining({ metric: 'avgLatency', severity: 'warning' }),
            );
        });

        it('does not emit duplicate unresolved alerts', () => {
            const emitMock = deps.eventBus.emit as unknown as { mock: { calls: unknown[][] } };
            deps.kernel.getState = vi.fn(stateWithHighLatency) as unknown as () => SystemState;
            service['captureSnapshot']();
            service['captureSnapshot']();
            const alertCalls = emitMock.mock.calls.filter(
                (c) => c[0] === 'observability:metrics:alert',
            );
            expect(alertCalls).toHaveLength(1);
        });
    });

    describe('destroy', () => {
        it('clears intervals and unsubscribes', async () => {
            const unsub = vi.fn();
            deps = createDeps({
                eventBus: { on: vi.fn(() => unsub), emit: vi.fn(), emitOnce: vi.fn(() => true) },
                kernel: deps.kernel,
            });
            service = new MetricsService(deps);
            await service.init();
            service.destroy();
            expect(unsub).toHaveBeenCalled();
        });
    });
});
