import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetAlertService } from './budget-alert-service';
import type { IBudgetService } from '../contracts/budget';

function makeBudgetService(overrides: Partial<IBudgetService> = {}): IBudgetService {
    return {
        getSpendSummary: vi.fn().mockReturnValue({
            global: { budget: 100, spent: 50, remaining: 50, pct: 50 },
            providers: [{ provider: 'openai', budget: 80, spent: 40, remaining: 40, pct: 50 }],
            agents: [],
        }),
        getCostTrend: vi.fn().mockReturnValue({
            direction: 'stable',
            dailyAvg: 5,
            projectedMonthly: 150,
            forecast: 150,
        }),
        detectAnomalies: vi.fn().mockReturnValue([]),
        ...overrides,
    } as unknown as IBudgetService;
}

describe('BudgetAlertService', () => {
    let svc: BudgetAlertService;

    beforeEach(async () => {
        svc = new BudgetAlertService();
        svc.setBudgetService(makeBudgetService());
        await svc.init();
    });

    describe('init', () => {
        it('should preset rules on first init', async () => {
            const rules = svc.getRules();
            expect(rules.length).toBeGreaterThanOrEqual(3);
            expect(rules[0]).toBeDefined();
            expect(rules[0]!.name).toBe('Monthly budget 80%');
            expect(rules[0]!.id).toBeTruthy();
        });
    });

    describe('CRUD', () => {
        it('should add a rule', () => {
            const rule = svc.addRule({
                name: 'Custom',
                condition: 'above_threshold',
                threshold: 90,
                action: 'notification',
                enabled: true,
            });
            const foundRule = svc.getRules().find((r) => r.id === rule.id);
            expect(foundRule).toBeDefined();
            expect(foundRule!.name).toBe('Custom');
            expect(svc.getRules().length).toBeGreaterThanOrEqual(4);
        });

        it('should update a rule', () => {
            const rules = svc.getRules();
            const originalRule = rules[0];
            if (!originalRule) throw new Error('No rule found');

            svc.updateRule(originalRule.id, { threshold: 95 });
            const updated = svc.getRules().find((r) => r.id === originalRule.id);
            expect(updated).toBeDefined();
            expect(updated!.threshold).toBe(95);
        });

        it('should disable a rule', () => {
            const rule = svc.addRule({
                name: 'Auto-disable',
                condition: 'above_threshold',
                threshold: 50,
                action: 'notification',
                enabled: true,
            });
            svc.updateRule(rule.id, { threshold: 75, enabled: false });
            const updated = svc.getRules().find((r) => r.id === rule.id);
            expect(updated).toBeDefined();
            expect(updated!.threshold).toBe(75);
            expect(updated!.enabled).toBe(false);
        });

        it('should remove a rule', () => {
            const rule = svc.addRule({
                name: 'Temp',
                condition: 'near_limit',
                threshold: 80,
                action: 'warn_user',
                enabled: true,
            });
            svc.removeRule(rule.id);
            expect(svc.getRules().find((r) => r.id === rule.id)).toBeUndefined();
        });
    });

    describe('evaluate', () => {
        it('should return empty when no budget service', () => {
            const s = new BudgetAlertService();
            const events = s.evaluate();
            expect(events).toHaveLength(0);
        });

        it('should trigger near_limit rule for global usage near threshold', () => {
            const budget = makeBudgetService({
                getSpendSummary: vi.fn().mockReturnValue({
                    global: { budget: 100, spent: 75, remaining: 25, pct: 75 },
                    providers: [],
                    agents: [],
                }),
            });
            const s = new BudgetAlertService();
            s.setBudgetService(budget);
            s.init();
            const events = s.evaluate();
            expect(events.length).toBeGreaterThanOrEqual(1);
            const event = events[0];
            expect(event).toBeDefined();
            expect(event!.ruleName).toBe('Monthly budget 80%');
        });

        it('should trigger trending_up rule', () => {
            const budget = makeBudgetService({
                getCostTrend: vi.fn().mockReturnValue({
                    direction: 'up',
                    dailyAvg: 10,
                    projectedMonthly: 300,
                    forecast: 320,
                }),
                detectAnomalies: vi.fn().mockReturnValue([
                    {
                        date: '2026-07-22',
                        cost: 20,
                        expected: 10,
                        deviation: 5,
                        severity: 'high',
                    },
                ]),
            });
            const s = new BudgetAlertService();
            s.setBudgetService(budget);
            s.init();
            const events = s.evaluate();
            expect(events.length).toBeGreaterThanOrEqual(1);
            expect(events.some((e) => e.ruleName === 'Cost spike detection')).toBe(true);
        });

        it('should trigger above_threshold rule for provider', () => {
            const s = new BudgetAlertService();
            const rule = s.addRule({
                name: 'Provider check',
                condition: 'above_threshold',
                threshold: 40,
                action: 'block_usage',
                enabled: true,
                provider: 'openai',
            });
            const budget = makeBudgetService({
                getSpendSummary: vi.fn().mockReturnValue({
                    global: { budget: 100, spent: 50, remaining: 50, pct: 50 },
                    providers: [
                        { provider: 'openai', budget: 80, spent: 60, remaining: 20, pct: 75 },
                    ],
                    agents: [],
                }),
            });
            s.setBudgetService(budget);
            const events = s.evaluate();
            expect(events.length).toBeGreaterThanOrEqual(1);
            const event = events[0];
            expect(event).toBeDefined();
            expect(event!.ruleId).toBe(rule.id);
        });

        it('should not trigger disabled rules', () => {
            const s = new BudgetAlertService();
            s.addRule({
                name: 'Disabled rule',
                condition: 'above_threshold',
                threshold: 0,
                action: 'notification',
                enabled: false,
            });
            const budget = makeBudgetService({
                getSpendSummary: vi.fn().mockReturnValue({
                    global: { budget: 100, spent: 100, remaining: 0, pct: 100 },
                    providers: [],
                    agents: [],
                }),
            });
            s.setBudgetService(budget);
            const events = s.evaluate();
            expect(events.filter((e) => e.ruleName === 'Disabled rule')).toHaveLength(0);
        });
    });

    describe('alert history', () => {
        it('should record triggered events', () => {
            const s = new BudgetAlertService();
            s.setBudgetService(
                makeBudgetService({
                    getSpendSummary: vi.fn().mockReturnValue({
                        global: { budget: 100, spent: 82, remaining: 18, pct: 82 },
                        providers: [],
                        agents: [],
                    }),
                }),
            );
            s.addRule({
                name: 'Test',
                condition: 'near_limit',
                threshold: 80,
                action: 'notification',
                enabled: true,
            });
            s.evaluate();
            const history = s.getAlertHistory();
            expect(history.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('destroy', () => {
        it('should clear all state', () => {
            svc.destroy();
            expect(svc.getRules()).toHaveLength(0);
            expect(svc.getAlertHistory()).toHaveLength(0);
        });
    });
});
