import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentHealthMonitor } from './agent-health-monitor';
import type { AgentHealthMonitorDeps } from './agent-health-monitor';

function makeDeps(overrides: Partial<AgentHealthMonitorDeps> = {}): AgentHealthMonitorDeps {
    return {
        eventBus: {
            onSafe: vi.fn().mockReturnValue(vi.fn()),
            on: vi.fn().mockReturnValue(vi.fn()),
            emit: vi.fn(),
        },
        database: {
            getKv: vi.fn().mockResolvedValue(null),
            setKv: vi.fn().mockResolvedValue(undefined),
        },
        ...overrides,
    } as unknown as AgentHealthMonitorDeps;
}

describe('AgentHealthMonitor', () => {
    let monitor: AgentHealthMonitor;
    let deps: AgentHealthMonitorDeps;

    beforeEach(() => {
        vi.useFakeTimers();
        deps = makeDeps();
        monitor = new AgentHealthMonitor(deps);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('ingest', () => {
        it('should add a record and recompute health', () => {
            monitor.ingest('agent-1', 100, true);
            const health = monitor.getHealth('agent-1');
            expect(health.agentId).toBe('agent-1');
            expect(health.totalCalls).toBe(1);
            expect(health.errorRate).toBe(0);
        });

        it('should track errors', () => {
            monitor.ingest('agent-1', 100, true);
            monitor.ingest('agent-1', 200, false);
            const health = monitor.getHealth('agent-1');
            expect(health.totalCalls).toBe(2);
            expect(health.errorRate).toBe(0.5);
        });

        it('should classify as healthy with low error rate', () => {
            for (let i = 0; i < 10; i++) {
                monitor.ingest('agent-1', 100, true);
            }
            expect(monitor.getHealth('agent-1').health).toBe('healthy');
        });

        it('should classify as degraded with >50% error rate', () => {
            monitor.ingest('agent-1', 100, true);
            monitor.ingest('agent-1', 200, false);
            monitor.ingest('agent-1', 200, false);
            expect(monitor.getHealth('agent-1').health).toBe('degraded');
        });

        it('should classify as unhealthy with >80% error rate', () => {
            monitor.ingest('agent-1', 100, true);
            for (let i = 0; i < 5; i++) {
                monitor.ingest('agent-1', 200, false);
            }
            expect(monitor.getHealth('agent-1').health).toBe('unhealthy');
        });

        it('should classify as unhealthy with 5+ consecutive errors', () => {
            for (let i = 0; i < 5; i++) {
                monitor.ingest('agent-1', 100, false);
            }
            expect(monitor.getHealth('agent-1').health).toBe('unhealthy');
        });

        it('should compute p95 latency', () => {
            for (let i = 0; i < 20; i++) {
                monitor.ingest('agent-1', i * 10, true);
            }
            const health = monitor.getHealth('agent-1');
            expect(health.p95Latency).toBeGreaterThan(0);
        });

        it('should compute consecutive errors', () => {
            monitor.ingest('agent-1', 100, true);
            monitor.ingest('agent-1', 100, false);
            monitor.ingest('agent-1', 100, false);
            const health = monitor.getHealth('agent-1');
            expect(health.consecutiveErrors).toBe(2);
        });
    });

    describe('getHealth', () => {
        it('should return default for unknown agent', () => {
            const h = monitor.getHealth('unknown');
            expect(h.health).toBe('unknown');
            expect(h.totalCalls).toBe(0);
        });

        it('should return cached snapshot', () => {
            monitor.ingest('agent-1', 100, true);
            const h = monitor.getHealth('agent-1');
            expect(h.agentId).toBe('agent-1');
        });
    });

    describe('getAllHealth', () => {
        it('should return all cached snapshots', () => {
            monitor.ingest('agent-1', 100, true);
            monitor.ingest('agent-2', 200, false);
            const all = monitor.getAllHealth();
            expect(all).toHaveLength(2);
            expect(all.map((h) => h.agentId).sort()).toEqual(['agent-1', 'agent-2']);
        });
    });

    describe('event emission', () => {
        it('should emit health change on transition', () => {
            for (let i = 0; i < 5; i++) {
                monitor.ingest('agent-1', 100, false);
            }
            expect(deps.eventBus.emit).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('should clear all state', () => {
            monitor.ingest('agent-1', 100, true);
            monitor.destroy();
            expect(monitor.getAllHealth()).toHaveLength(0);
            expect(monitor.getHealth('agent-1').health).toBe('unknown');
        });

        it('should be safe to call multiple times', () => {
            monitor.destroy();
            expect(() => monitor.destroy()).not.toThrow();
        });
    });
});
