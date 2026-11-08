import { describe, it, expect, vi } from 'vitest';
import { MonitoringService, type MonitoringServiceDeps } from './monitoring-service';
import { EVENTS } from '../events/event-names';

function makeDeps(overrides: Partial<MonitoringServiceDeps> = {}): MonitoringServiceDeps {
    const eventBus = { on: vi.fn(() => () => {}), emit: vi.fn() };
    return {
        eventBus,
        traceService: {
            getTraces: vi.fn(() => []),
            getTraceStats: vi.fn(() => ({
                total: 0,
                completed: 0,
                failed: 0,
                running: 0,
                successRate: 1,
                avgDuration: 0,
                avgTokens: 0,
            })),
        },
        metricsService: {
            getAllMetrics: vi.fn(() => ({
                aggregated: {
                    totalRequests: 10,
                    totalTokens: 100,
                    estimatedCost: 0.5,
                    avgLatency: 20,
                    avgTTFT: 5,
                    avgTPS: 3,
                    successRate: 0.95,
                    errorRate: 0.05,
                    activeProviders: 1,
                    totalProviders: 1,
                    decisions: 0,
                    violations: 0,
                },
                providers: [
                    {
                        id: 'openrouter',
                        avgLatency: 20,
                        avgTTFT: 5,
                        avgTPS: 3,
                        successCount: 10,
                        errorCount: 0,
                        totalTokens: 100,
                        reliability: 0.95,
                        stabilityIndex: 1,
                        reputationScore: 100,
                        currentConcurrent: 0,
                        status: 'active',
                    },
                ],
            })),
            getAlerts: vi.fn(() => []),
            getHistory: vi.fn(() => []),
        },
        timelineService: {
            getEvents: vi.fn(() => []),
            getEvent: vi.fn(() => undefined),
            addEvent: vi.fn(),
            addEvents: vi.fn(() => []),
            clearEvents: vi.fn(),
            getEventStats: vi.fn(() => ({ total: 0, byCategory: {}, bySeverity: {} })),
            getTimeRange: vi.fn(() => []),
        },
        ...overrides,
    };
}

describe('MonitoringService', () => {
    it('generateReport aggregates metrics, timeline and alerts', () => {
        const deps = makeDeps();
        const svc = new MonitoringService(deps);
        const report = svc.generateReport();
        expect(report.aggregated.totalRequests).toBe(10);
        expect(report.timeline).toEqual([]);
        expect(report.alerts).toEqual([]);
        expect(typeof report.timestamp).toBe('number');
    });

    it('emitSnapshot emits METRICS_SNAPSHOT with aggregated counters', () => {
        const deps = makeDeps();
        const svc = new MonitoringService(deps);
        svc.emitSnapshot();
        expect(deps.eventBus.emit).toHaveBeenCalledWith(EVENTS.METRICS_SNAPSHOT, {
            timestamp: expect.any(Number),
            totalRequests: 10,
            totalTokens: 100,
            estimatedCost: 0.5,
            avgLatency: 20,
            successRate: 0.95,
        });
    });

    it('getProviderHealthSummary returns provider breakdown', () => {
        const deps = makeDeps();
        const svc = new MonitoringService(deps);
        const summary = svc.getProviderHealthSummary();
        expect(summary).toHaveLength(1);
        expect(summary[0]!.id).toBe('openrouter');
        expect(summary[0]!.status).toBe('active');
    });
});
