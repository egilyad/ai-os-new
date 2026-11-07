import { describe, it, expect, vi } from 'vitest';
import { AdminService, type AdminServiceDeps } from './admin-service';

function makeDeps(overrides: Partial<AdminServiceDeps> = {}): AdminServiceDeps {
    return {
        eventBus: {
            on: vi.fn(() => () => {}),
            onSafe: vi.fn(() => () => {}),
            emit: vi.fn(),
        },
        database: {
            getKv: vi.fn(async () => null),
            setKv: vi.fn(async () => {}),
        },
        keyService: {
            getKeys: vi.fn(() => []),
            updateKeyStatus: vi.fn(),
            handleProviderError: vi.fn(),
        },
        kernel: {
            getState: vi.fn(() => ({
                totalRequests: 0,
                totalTokens: 0,
                estimatedCost: 0,
                decisions: [{ id: 'd1' }],
                violations: [],
            })),
            loadState: vi.fn(),
            resetRuntime: vi.fn(),
            resetMetrics: vi.fn(),
        },
        orchestrator: {
            getActiveTopology: vi.fn(() => null),
            mount: vi.fn(),
            isNodeDisabled: vi.fn(() => false),
        },
        settingsService: {
            getSettings: vi.fn(() => ({})),
            updateSettings: vi.fn(),
        },
        agentService: {
            resetAllStats: vi.fn(),
            restartAgent: vi.fn(async () => {}),
        },
        metricsService: {
            generateAggregated: vi.fn(() => ({
                avgLatency: 0,
                errorRate: 0,
                successRate: 1,
                totalRequests: 0,
                totalTokens: 0,
                estimatedCost: 0,
            })),
            getAlerts: vi.fn(() => []),
            resetHistory: vi.fn(),
        },
        toolService: {
            getTools: vi.fn(() => []),
            toggleTool: vi.fn(),
        },
        roleService: {
            getAllRoles: vi.fn(() => []),
            getRoles: vi.fn(() => []),
        },
        snapshotService: {
            capture: vi.fn(() => null),
            restoreById: vi.fn(() => false),
            createSnapshot: vi.fn(() => ({ id: 'snap-1' })),
        },
        runtime: {
            getStatus: vi.fn(() => ({
                phase: 'ready',
                uptime: 0,
                startTime: 0,
                servicesReady: 0,
                servicesTotal: 0,
                lastError: null,
                memoryUsage: 0,
            })),
        },
        ...overrides,
    };
}

describe('AdminService', () => {
    it('getProviders strips raw keys', () => {
        const deps = makeDeps({
            keyService: {
                getKeys: vi.fn(() => [
                    {
                        id: 'k1',
                        provider: 'openrouter',
                        key: 'sk-secret',
                        status: 'active',
                        stats: { avgLatency: 10 },
                    },
                ]),
                updateKeyStatus: vi.fn(),
                handleProviderError: vi.fn(),
            },
        });
        const svc = new AdminService(deps);
        const providers = svc.getProviders();
        expect(providers).toHaveLength(1);
        expect(providers[0]).not.toHaveProperty('key');
        expect(providers[0]).toHaveProperty('id', 'k1');
    });

    it('getMetrics delegates to metricsService', () => {
        const deps = makeDeps();
        const svc = new AdminService(deps);
        expect(svc.getMetrics().totalRequests).toBe(0);
        expect(deps.metricsService.generateAggregated).toHaveBeenCalled();
    });

    it('getDecisionHistory returns kernel decisions', () => {
        const deps = makeDeps();
        const svc = new AdminService(deps);
        expect(svc.getDecisionHistory()).toEqual([{ id: 'd1' }]);
    });

    it('getAuditLog returns an empty log initially', () => {
        const deps = makeDeps();
        const svc = new AdminService(deps);
        expect(svc.getAuditLog()).toEqual([]);
    });
});
