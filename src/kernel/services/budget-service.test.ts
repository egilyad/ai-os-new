import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetService, type BudgetServiceDeps } from './budget-service';

function createDeps(overrides?: Partial<BudgetServiceDeps>): BudgetServiceDeps {
    const eventBus = {
        on: vi.fn(() => vi.fn()),
        onSafe: vi.fn(() => vi.fn()),
        emit: vi.fn(),
        ...overrides?.eventBus,
    };
    const db = new Map<string, unknown>();
    return {
        eventBus,
        database: {
            getKv: vi.fn(async <T>(id: string) => (db.get(id) ?? null) as T | null),
            setKv: vi.fn(async <T>(id: string, value: T) => {
                db.set(id, value);
            }),
            ...overrides?.database,
        },
        costCalculator: {
            calculateCost: vi.fn(
                (_model: string, input: number, output: number) => (input + output) * 0.000002,
            ),
            getInputCost: vi.fn(() => 0.000003),
            getOutputCost: vi.fn(() => 0.000015),
            ...(overrides?.costCalculator as Partial<BudgetServiceDeps['costCalculator']>),
        },
    } as BudgetServiceDeps;
}

describe('BudgetService', () => {
    let deps: BudgetServiceDeps;
    let service: BudgetService;

    beforeEach(() => {
        vi.clearAllMocks();
        deps = createDeps();
        service = new BudgetService(deps);
    });

    describe('lifecycle', () => {
        it('initializes and loads saved data', async () => {
            await service.init();
            expect(deps.database.getKv).toHaveBeenCalled();
            expect(deps.eventBus.onSafe).toHaveBeenCalled();
        });

        it('is idempotent on repeated init', async () => {
            await service.init();
            const calls = vi.mocked(deps.database.getKv).mock.calls.length;
            await service.init();
            expect(vi.mocked(deps.database.getKv).mock.calls.length).toBe(calls);
        });

        it('destroy cleans up listeners and history', async () => {
            const unsub = vi.fn();
            deps.eventBus.onSafe = vi.fn(() => unsub);
            deps.eventBus.on = vi.fn(() => unsub);
            await service.init();
            service.destroy();
            expect(unsub).toHaveBeenCalled();
        });
    });

    describe('monthly budget', () => {
        beforeEach(async () => {
            await service.init();
        });

        it('defaults to 50', () => {
            const info = service.getBudgetInfo();
            expect(info.monthlyBudget).toBe(50);
        });

        it('setMonthlyBudget persists and returns new value', () => {
            service.setMonthlyBudget(100);
            expect(service.getBudgetInfo().monthlyBudget).toBe(100);
            expect(deps.database.setKv).toHaveBeenCalledWith('super_agents_pricing_budget', {
                monthlyBudget: 100,
            });
        });

        it('canUseGlobal returns true when no budget set', () => {
            service.setMonthlyBudget(0);
            expect(service.canUseGlobal(100)).toBe(true);
        });

        it('canUseGlobal blocks spend exceeding budget', () => {
            service.setMonthlyBudget(50);
            expect(service.canUseGlobal(60)).toBe(false);
        });

        it('canUseGlobal allows spend within budget', () => {
            service.setMonthlyBudget(50);
            expect(service.canUseGlobal(30)).toBe(true);
        });
    });

    describe('provider budgets', () => {
        beforeEach(async () => {
            await service.init();
        });

        it('setProviderBudget persists and returns', () => {
            service.setProviderBudget('OpenAI', 100);
            expect(service.getProviderBudget('OpenAI')).toBe(100);
            expect(service.getProviderBudget('openai')).toBe(100);
            expect(deps.database.setKv).toHaveBeenCalledWith('provider_budgets', {
                openai: 100,
            });
        });

        it('canUseProvider returns true when no budget set', () => {
            expect(service.canUseProvider('openai', 100)).toBe(true);
        });

        it('canUseProvider blocks spend exceeding budget', () => {
            service.setProviderBudget('openai', 50);
            service.recordSpend(null, 'openai', 30);
            expect(service.canUseProvider('openai', 30)).toBe(false);
            expect(service.canUseProvider('openai', 10)).toBe(true);
        });

        it('checkProviderBudget behaves same as canUseProvider', () => {
            service.setProviderBudget('gemini', 50);
            service.recordSpend(null, 'gemini', 40);
            expect(service.checkProviderBudget('gemini', 20)).toBe(false);
            expect(service.checkProviderBudget('gemini', 5)).toBe(true);
        });
    });

    describe('agent budgets', () => {
        beforeEach(async () => {
            await service.init();
        });

        it('returns undefined for unset agent', () => {
            expect(service.getAgentBudget('agent-1')).toBeUndefined();
        });

        it('setAgentBudget persists and returns', () => {
            service.setAgentBudget('agent-1', 25);
            expect(service.getAgentBudget('agent-1')).toBe(25);
        });

        it('getAllAgentBudgets returns copy', () => {
            service.setAgentBudget('agent-1', 10);
            service.setAgentBudget('agent-2', 20);
            const all = service.getAllAgentBudgets();
            expect(all).toEqual({ 'agent-1': 10, 'agent-2': 20 });
            all['agent-1'] = 999;
            expect(service.getAgentBudget('agent-1')).toBe(10);
        });
    });

    describe('recordSpend', () => {
        beforeEach(async () => {
            await service.init();
        });

        it('ignores zero or negative amounts', () => {
            service.recordSpend('agent-1', 'openai', 0);
            expect(service.getSpendSummary().global.spent).toBe(0);
        });

        it('records global spend', () => {
            service.recordSpend(null, 'openai', 10);
            expect(service.getSpendSummary().global.spent).toBe(10);
        });

        it('records provider spend', () => {
            service.setProviderBudget('openai', 100);
            service.recordSpend(null, 'openai', 25);
            const summary = service.getSpendSummary();
            const providerInfo = summary.providers.find((p) => p.provider === 'openai');
            expect(providerInfo?.spent).toBe(25);
        });

        it('records agent spend and triggers thresholds', () => {
            service.setAgentBudget('agent-1', 20);
            service.recordSpend('agent-1', 'openai', 15);
            expect(service.getAgentSpend('agent-1')).toBe(15);
        });

        it('caps history at 10000 entries', () => {
            for (let i = 0; i < 10050; i++) {
                service.recordSpend(null, 'openai', 1);
            }
            expect(service.getCostHistory(20000).length).toBeLessThanOrEqual(10000);
        });
    });

    describe('STREAM_END event listener', () => {
        it('subscribes to STREAM_END on init', async () => {
            await service.init();
            expect(deps.eventBus.onSafe).toHaveBeenCalledWith(
                'chat:stream:end',
                expect.any(Function),
            );
        });

        it('processes STREAM_END and records cost', async () => {
            let handler: (data: unknown) => void = () => {};
            deps.eventBus.onSafe = vi.fn((_event: string, cb: (data: unknown) => void) => {
                handler = cb;
                return vi.fn();
            }) as unknown as BudgetServiceDeps['eventBus']['onSafe'];
            service = new BudgetService(deps);
            await service.init();

            handler({
                requestId: 'req-1',
                model: 'gpt-4',
                provider: 'OpenAI',
                tokens: 1000,
                inputTokens: 300,
                outputTokens: 700,
                agentId: 'agent-1',
            });

            const history = service.getCostHistory(5);
            expect(history.length).toBe(1);
            expect(history[0].model).toBe('gpt-4');
            expect(history[0].provider).toBe('openai');
            expect(history[0].totalCost).toBeGreaterThan(0);
            expect(vi.mocked(deps.database.setKv)).toHaveBeenCalled();
        });

        it('deduplicates by requestId', async () => {
            let handler: (data: unknown) => void = () => {};
            deps.eventBus.onSafe = vi.fn((_event: string, cb: (data: unknown) => void) => {
                handler = cb;
                return vi.fn();
            }) as unknown as BudgetServiceDeps['eventBus']['onSafe'];
            service = new BudgetService(deps);
            await service.init();

            const payload = {
                requestId: 'req-1',
                model: 'gpt-4',
                provider: 'openai',
                tokens: 1000,
            };
            handler(payload);
            handler(payload);

            expect(service.getCostHistory(5).length).toBe(1);
        });

        it('ignores STREAM_END without requestId or model', async () => {
            let handler: (data: unknown) => void = () => {};
            deps.eventBus.onSafe = vi.fn((_event: string, cb: (data: unknown) => void) => {
                handler = cb;
                return vi.fn();
            }) as unknown as BudgetServiceDeps['eventBus']['onSafe'];
            service = new BudgetService(deps);
            await service.init();

            handler({ provider: 'openai', tokens: 500 });
            expect(service.getCostHistory(5).length).toBe(0);
        });
    });

    describe('threshold alerts', () => {
        beforeEach(async () => {
            await service.init();
        });

        it('emits alert when global spend reaches 50% via STREAM_END', async () => {
            let handler: (data: unknown) => void = () => {};
            deps.eventBus.onSafe = vi.fn((_event: string, cb: (data: unknown) => void) => {
                handler = cb;
                return vi.fn();
            }) as unknown as BudgetServiceDeps['eventBus']['onSafe'];
            deps.costCalculator.calculateCost = vi.fn(() => 60);
            service = new BudgetService(deps);
            await service.init();
            service.setMonthlyBudget(100);
            handler({
                requestId: 'r1',
                model: 'gpt-4',
                provider: 'openai',
                tokens: 500,
                inputTokens: 150,
                outputTokens: 350,
            });
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                expect.stringContaining('budget'),
                expect.objectContaining({ type: 'global', level: 50 }),
            );
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                expect.stringContaining('notif'),
                expect.objectContaining({ type: 'warning' }),
            );
        });

        it('emits alert when global spend reaches 100% via STREAM_END', async () => {
            let handler: (data: unknown) => void = () => {};
            deps.eventBus.onSafe = vi.fn((_event: string, cb: (data: unknown) => void) => {
                handler = cb;
                return vi.fn();
            }) as unknown as BudgetServiceDeps['eventBus']['onSafe'];
            deps.costCalculator.calculateCost = vi.fn(() => 10);
            service = new BudgetService(deps);
            await service.init();
            service.setMonthlyBudget(100);
            handler({
                requestId: 'r0',
                model: 'gpt-4',
                provider: 'openai',
                tokens: 100,
                inputTokens: 50,
                outputTokens: 50,
            });
            handler({
                requestId: 'r1',
                model: 'gpt-4',
                provider: 'openai',
                tokens: 100,
                inputTokens: 50,
                outputTokens: 50,
            });
            handler({
                requestId: 'r2',
                model: 'gpt-4',
                provider: 'openai',
                tokens: 100,
                inputTokens: 50,
                outputTokens: 50,
            });
            handler({
                requestId: 'r3',
                model: 'gpt-4',
                provider: 'openai',
                tokens: 100,
                inputTokens: 50,
                outputTokens: 50,
            });
            handler({
                requestId: 'r4',
                model: 'gpt-4',
                provider: 'openai',
                tokens: 100,
                inputTokens: 50,
                outputTokens: 50,
            });
            handler({
                requestId: 'r5',
                model: 'gpt-4',
                provider: 'openai',
                tokens: 100,
                inputTokens: 50,
                outputTokens: 50,
            });
            handler({
                requestId: 'r6',
                model: 'gpt-4',
                provider: 'openai',
                tokens: 100,
                inputTokens: 50,
                outputTokens: 50,
            });
            handler({
                requestId: 'r7',
                model: 'gpt-4',
                provider: 'openai',
                tokens: 100,
                inputTokens: 50,
                outputTokens: 50,
            });
            handler({
                requestId: 'r8',
                model: 'gpt-4',
                provider: 'openai',
                tokens: 100,
                inputTokens: 50,
                outputTokens: 50,
            });
            handler({
                requestId: 'r9',
                model: 'gpt-4',
                provider: 'openai',
                tokens: 100,
                inputTokens: 50,
                outputTokens: 50,
            });
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                expect.stringContaining('budget'),
                expect.objectContaining({ type: 'global', level: 100 }),
            );
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                expect.stringContaining('notif'),
                expect.objectContaining({ type: 'error' }),
            );
        });

        it('does not re-emit same alert level for same provider', () => {
            service.setProviderBudget('openai', 100);
            service.recordSpend(null, 'openai', 50);
            const emit50count = vi
                .mocked(deps.eventBus.emit)
                .mock.calls.filter(
                    (c) =>
                        c[0] &&
                        String(c[0]).includes('budget') &&
                        typeof c[1] === 'object' &&
                        c[1] !== null &&
                        (c[1] as Record<string, unknown>).level === 50,
                ).length;
            expect(emit50count).toBe(1);
        });

        it('emits provider threshold alerts', () => {
            service.setProviderBudget('openai', 100);
            service.recordSpend(null, 'openai', 80);
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                expect.stringContaining('budget'),
                expect.objectContaining({ type: 'provider', entity: 'openai', level: 80 }),
            );
        });

        it('records provider alert in history', () => {
            service.setProviderBudget('openai', 100);
            service.recordSpend(null, 'openai', 90);
            const alerts = service.getAlertsHistory();
            expect(alerts.length).toBeGreaterThanOrEqual(1);
            expect(alerts[alerts.length - 1].message).toContain('90%');
        });
    });

    describe('getSpendSummary', () => {
        beforeEach(async () => {
            await service.init();
        });

        it('returns zero spend when no costs recorded', () => {
            const s = service.getSpendSummary();
            expect(s.global.spent).toBe(0);
            expect(s.providers).toEqual([]);
            expect(s.agents).toEqual([]);
        });

        it('returns provider breakdown', () => {
            service.setProviderBudget('openai', 100);
            service.setProviderBudget('gemini', 50);
            service.recordSpend(null, 'openai', 30);
            service.recordSpend(null, 'gemini', 10);

            const s = service.getSpendSummary();
            expect(s.global.spent).toBe(40);
            const o = s.providers.find((p) => p.provider === 'openai');
            expect(o?.spent).toBe(30);
            expect(o?.remaining).toBe(70);
            const g = s.providers.find((p) => p.provider === 'gemini');
            expect(g?.spent).toBe(10);
            expect(g?.remaining).toBe(40);
        });

        it('returns agent breakdown for agents with budget set', () => {
            service.setAgentBudget('agent-1', 100);
            service.recordSpend('agent-1', 'openai', 25);
            const s = service.getSpendSummary();
            expect(s.agents).toHaveLength(1);
            expect(s.agents[0].agentId).toBe('agent-1');
            expect(s.agents[0].spent).toBe(25);
        });
    });

    describe('getBudgetInfo', () => {
        beforeEach(async () => {
            await service.init();
        });

        it('returns budget info with projections', () => {
            service.setMonthlyBudget(100);
            service.recordSpend(null, 'openai', 30);
            const info = service.getBudgetInfo();
            expect(info.monthlyBudget).toBe(100);
            expect(info.spentThisMonth).toBe(30);
            expect(info.remainingBudget).toBe(70);
            expect(info.dailyAverage).toBeGreaterThan(0);
            expect(info.projectedMonthly).toBeGreaterThan(0);
        });

        it('caches result within TTL across consecutive calls', () => {
            service.recordSpend(null, 'openai', 10);
            const a = service.getBudgetInfo();
            const b = service.getBudgetInfo();
            expect(b.spentThisMonth).toBe(a.spentThisMonth);
        });
    });

    describe('getDailyCosts', () => {
        beforeEach(async () => {
            await service.init();
        });

        it('returns empty when no history', () => {
            expect(service.getDailyCosts()).toEqual([]);
        });

        it('groups costs by day', () => {
            service.recordSpend(null, 'openai', 10);
            service.recordSpend(null, 'openai', 20);
            const daily = service.getDailyCosts(30);
            expect(daily.length).toBe(1);
            expect(daily[0].cost).toBe(30);
            expect(daily[0].count).toBe(2);
        });
    });

    describe('getCostTrend', () => {
        beforeEach(async () => {
            await service.init();
        });

        it('returns stable when insufficient data', () => {
            const trend = service.getCostTrend();
            expect(trend.direction).toBe('stable');
        });
    });

    describe('detectAnomalies', () => {
        beforeEach(async () => {
            await service.init();
        });

        it('returns empty when insufficient data', () => {
            expect(service.detectAnomalies()).toEqual([]);
        });
    });

    describe('getCostByProvider / Model / Agent', () => {
        beforeEach(async () => {
            await service.init();
        });

        it('returns empty when no history', () => {
            expect(service.getCostByProvider()).toEqual({});
            expect(service.getCostByModel()).toEqual({});
            expect(service.getCostByAgent()).toEqual({});
        });

        it('groups by provider, model, and agent', () => {
            service.recordSpend('agent-1', 'openai', 10);
            service.recordSpend('agent-1', 'openai', 20);
            service.recordSpend('agent-2', 'gemini', 30);

            expect(service.getCostByProvider()).toEqual({ openai: 30, gemini: 30 });
            expect(service.getCostByAgent()).toEqual({ 'agent-1': 30, 'agent-2': 30 });
        });
    });

    describe('clearHistory / clearAlerts', () => {
        beforeEach(async () => {
            await service.init();
        });

        it('clears cost history', () => {
            service.recordSpend(null, 'openai', 50);
            expect(service.getSpendSummary().global.spent).toBeGreaterThan(0);
            service.clearHistory();
            expect(service.getSpendSummary().global.spent).toBe(0);
        });

        it('clears alerts', () => {
            service.setProviderBudget('openai', 100);
            service.recordSpend(null, 'openai', 90);
            expect(service.getAlerts().length).toBeGreaterThan(0);
            service.clearAlerts();
            expect(service.getAlerts().length).toBe(0);
        });
    });

    describe('load from persistence', () => {
        it('restores monthly budget from saved data', async () => {
            const db = new Map<string, unknown>();
            db.set('super_agents_pricing_budget', { monthlyBudget: 200 });
            deps = createDeps({
                database: {
                    getKv: vi.fn(
                        async <T>(id: string) => (db.get(id) ?? null) as T | null,
                    ) as unknown as BudgetServiceDeps['database']['getKv'],
                    setKv: vi.fn(async <T>(id: string, value: T) => {
                        db.set(id, value);
                    }) as unknown as BudgetServiceDeps['database']['setKv'],
                },
            });
            service = new BudgetService(deps);
            await service.init();
            expect(service.getBudgetInfo().monthlyBudget).toBe(200);
        });

        it('restores provider budgets from saved data', async () => {
            const db = new Map<string, unknown>();
            db.set('provider_budgets', { openai: 150, gemini: 75 });
            deps = createDeps({
                database: {
                    getKv: vi.fn(
                        async <T>(id: string) => (db.get(id) ?? null) as T | null,
                    ) as unknown as BudgetServiceDeps['database']['getKv'],
                    setKv: vi.fn(async <T>(id: string, value: T) => {
                        db.set(id, value);
                    }) as unknown as BudgetServiceDeps['database']['setKv'],
                },
            });
            service = new BudgetService(deps);
            await service.init();
            expect(service.getProviderBudget('openai')).toBe(150);
            expect(service.getProviderBudget('gemini')).toBe(75);
        });

        it('restores cost history from saved data', async () => {
            const db = new Map<string, unknown>();
            db.set('super_agents_cost_history', [
                {
                    model: 'gpt-4',
                    provider: 'openai',
                    inputTokens: 100,
                    outputTokens: 50,
                    inputCost: 0.0003,
                    outputCost: 0.00075,
                    totalCost: 0.00105,
                    timestamp: Date.now(),
                },
            ]);
            deps = createDeps({
                database: {
                    getKv: vi.fn(
                        async <T>(id: string) => (db.get(id) ?? null) as T | null,
                    ) as unknown as BudgetServiceDeps['database']['getKv'],
                    setKv: vi.fn(async <T>(id: string, value: T) => {
                        db.set(id, value);
                    }) as unknown as BudgetServiceDeps['database']['setKv'],
                },
            });
            service = new BudgetService(deps);
            await service.init();
            expect(service.getCostHistory(5)).toHaveLength(1);
            expect(service.getCostHistory(5)[0].model).toBe('gpt-4');
        });
    });
});
