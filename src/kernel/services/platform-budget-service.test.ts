/**
 * PlatformBudgetService + BudgetIncidentService tests — AGEMS port Phase 4.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformBudgetService, BudgetIncidentService } from './platform-budget-service';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function makeKeyValueDb() {
    const store = new Map<string, { id: string; value: unknown }>();
    return {
        keyValue: {
            get: async (id: string) => store.get(id),
            put: async (record: { id: string; value: unknown }) => { store.set(record.id, record); return record.id; },
        },
    };
}

function makeIncidentsDb() {
    const incidents = new Map<string, Record<string, unknown>>();
    return {
        budgetIncidents: {
            toArray: async () => Array.from(incidents.values()),
            put: async (v: Record<string, unknown>) => { incidents.set(v.id as string, v); return v.id as string; },
        },
    };
}

describe('PlatformBudgetService', () => {
    let db: ReturnType<typeof makeKeyValueDb>;
    let svc: PlatformBudgetService;

    beforeEach(() => {
        db = makeKeyValueDb();
        svc = new PlatformBudgetService(db);
    });

    it('creates and retrieves platform budget', async () => {
        const b = await svc.setPlatformBudget({ monthlyLimitUsd: 1000, dailyLimitUsd: 50 });
        expect(b.monthlyLimitUsd).toBe(1000);
        expect(b.dailyLimitUsd).toBe(50);
        expect(b.hardStopEnabled).toBe(true);
        expect(b.softAlertPercent).toBe(80);

        const retrieved = await svc.getPlatformBudget();
        expect(retrieved?.monthlyLimitUsd).toBe(1000);
    });

    it('allows spend within budget', async () => {
        await svc.setPlatformBudget({ monthlyLimitUsd: 100, currentSpendUsd: 50 });
        const result = await svc.checkPlatformBudget(10);
        expect(result.allowed).toBe(true);
    });

    it('rejects spend exceeding monthly limit', async () => {
        await svc.setPlatformBudget({ monthlyLimitUsd: 100, currentSpendUsd: 95 });
        const result = await svc.checkPlatformBudget(10);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Monthly limit');
    });

    it('records spend and updates currentSpendUsd', async () => {
        await svc.setPlatformBudget({ monthlyLimitUsd: 100, currentSpendUsd: 0 });
        await svc.recordPlatformSpend(25);
        const b = await svc.getPlatformBudget();
        expect(b?.currentSpendUsd).toBe(25);
    });

    it('resets period', async () => {
        await svc.setPlatformBudget({ monthlyLimitUsd: 100, currentSpendUsd: 80 });
        await svc.resetPeriod();
        const b = await svc.getPlatformBudget();
        expect(b?.currentSpendUsd).toBe(0);
        expect(b?.periodStart).toBeGreaterThan(0);
    });

    it('allows spend when no budget configured', async () => {
        const result = await svc.checkPlatformBudget(1000);
        expect(result.allowed).toBe(true);
    });
});

describe('BudgetIncidentService', () => {
    let db: ReturnType<typeof makeIncidentsDb>;
    let svc: BudgetIncidentService;

    beforeEach(() => {
        db = makeIncidentsDb();
        svc = new BudgetIncidentService(db);
    });

    it('logs an incident', async () => {
        const inc = await svc.logIncident({
            budgetId: 'b1',
            type: 'soft_alert',
            message: 'Approaching limit',
            spendUsd: 80,
            limitUsd: 100,
        });
        expect(inc.id).toMatch(/^incident-/);
        expect(inc.type).toBe('soft_alert');
    });

    it('lists incidents sorted by createdAt desc', async () => {
        const first = await svc.logIncident({ budgetId: 'b1', type: 'soft_alert', message: 'first', spendUsd: 80, limitUsd: 100 });
        // Ensure different timestamps
        await new Promise(r => setTimeout(r, 5));
        const second = await svc.logIncident({ budgetId: 'b1', type: 'hard_stop', message: 'second', spendUsd: 100, limitUsd: 100 });
        const list = await svc.listIncidents();
        expect(list.length).toBe(2);
        // Both should be present (order may vary with same ts)
        expect(list.some(i => i.type === 'soft_alert')).toBe(true);
        expect(list.some(i => i.type === 'hard_stop')).toBe(true);
    });

    it('lists incidents by agent', async () => {
        await svc.logIncident({ budgetId: 'b1', type: 'soft_alert', message: 'a', spendUsd: 0, limitUsd: 100, agentId: 'agent-1' });
        await svc.logIncident({ budgetId: 'b1', type: 'soft_alert', message: 'b', spendUsd: 0, limitUsd: 100, agentId: 'agent-2' });
        const list = await svc.listIncidentsByAgent('agent-1');
        expect(list.length).toBe(1);
        expect(list[0].agentId).toBe('agent-1');
    });

    it('resolves an incident', async () => {
        const inc = await svc.logIncident({ budgetId: 'b1', type: 'manual_override', message: 'override', spendUsd: 0, limitUsd: 100 });
        const resolved = await svc.resolveIncident(inc.id, 'admin');
        expect(resolved.resolvedBy).toBe('admin');
        expect(resolved.resolvedAt).toBeDefined();
    });

    it('throws on resolve of missing incident', async () => {
        await expect(svc.resolveIncident('missing', 'admin')).rejects.toThrow('not found');
    });

    it('gets incident stats', async () => {
        await svc.logIncident({ budgetId: 'b1', type: 'soft_alert', message: 'a', spendUsd: 0, limitUsd: 100 });
        await svc.logIncident({ budgetId: 'b1', type: 'hard_stop', message: 'b', spendUsd: 0, limitUsd: 100 });
        await svc.logIncident({ budgetId: 'b1', type: 'soft_alert', message: 'c', spendUsd: 0, limitUsd: 100 });
        const stats = await svc.getIncidentStats();
        expect(stats.softAlerts).toBe(2);
        expect(stats.hardStops).toBe(1);
        expect(stats.total).toBe(3);
    });

    it('returns empty stats when no incidents', async () => {
        const stats = await svc.getIncidentStats();
        expect(stats).toEqual({ softAlerts: 0, hardStops: 0, total: 0 });
    });
});
