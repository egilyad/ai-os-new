/**
 * Platform Budget + Budget Incidents services (AGEMS port, Phase 4).
 *
 * PlatformBudget: org-wide hourly/daily/monthly limits.
 * BudgetIncidents: soft_alert, hard_stop, budget_reset, manual_override.
 */
import type {
    PlatformBudget,
    BudgetIncident,
    BudgetIncidentType,
    IPlatformBudgetService,
    IBudgetIncidentService,
} from '../contracts/budget';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('BudgetPlatformService');

// ── Platform Budget Service ──

export class PlatformBudgetService implements IPlatformBudgetService {
    private db: {
        keyValue: {
            get(id: string): Promise<{ value: unknown } | undefined>;
            put(record: { id: string; value: unknown; version?: number }): Promise<string>;
        };
    };

    constructor(db: {
        keyValue: {
            get(id: string): Promise<{ value: unknown } | undefined>;
            put(record: { id: string; value: unknown; version?: number }): Promise<string>;
        };
    }) {
        this.db = db;
    }

    private static KEY = 'platform_budget';

    async getPlatformBudget(): Promise<PlatformBudget | undefined> {
        const record = await this.db.keyValue.get(PlatformBudgetService.KEY);
        return record?.value as PlatformBudget | undefined;
    }

    async setPlatformBudget(input: Partial<Omit<PlatformBudget, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PlatformBudget> {
        const existing = await this.getPlatformBudget();
        const now = Date.now();

        const budget: PlatformBudget = {
            id: 'platform-budget',
            hourlyLimitUsd: input.hourlyLimitUsd ?? existing?.hourlyLimitUsd,
            dailyLimitUsd: input.dailyLimitUsd ?? existing?.dailyLimitUsd,
            monthlyLimitUsd: input.monthlyLimitUsd ?? existing?.monthlyLimitUsd,
            currentSpendUsd: input.currentSpendUsd ?? existing?.currentSpendUsd ?? 0,
            softAlertPercent: input.softAlertPercent ?? existing?.softAlertPercent ?? 80,
            hardStopEnabled: input.hardStopEnabled ?? existing?.hardStopEnabled ?? true,
            periodStart: input.periodStart ?? existing?.periodStart ?? now,
            periodEnd: input.periodEnd ?? existing?.periodEnd ?? now + 30 * 24 * 60 * 60 * 1000,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        };

        await this.db.keyValue.put({
            id: PlatformBudgetService.KEY,
            value: budget,
        });

        LOGGER.info('setPlatformBudget', `Platform budget updated: monthly=$${budget.monthlyLimitUsd ?? 'none'}, daily=$${budget.dailyLimitUsd ?? 'none'}`);
        return budget;
    }

    async checkPlatformBudget(costUsd: number): Promise<{ allowed: boolean; reason?: string }> {
        const budget = await this.getPlatformBudget();
        if (!budget) return { allowed: true };

        // Check monthly limit
        if (budget.monthlyLimitUsd !== undefined) {
            const projected = budget.currentSpendUsd + costUsd;
            if (projected > budget.monthlyLimitUsd) {
                return { allowed: false, reason: `Monthly limit exceeded: $${projected.toFixed(2)} > $${budget.monthlyLimitUsd}` };
            }
            if (projected > budget.monthlyLimitUsd * (budget.softAlertPercent / 100)) {
                LOGGER.warn('checkPlatformBudget', `Approaching monthly limit: $${projected.toFixed(2)} / $${budget.monthlyLimitUsd} (${((projected / budget.monthlyLimitUsd) * 100).toFixed(1)}%)`);
            }
        }

        // Check daily limit
        if (budget.dailyLimitUsd !== undefined) {
            // For daily check, we'd need to track daily spend separately
            // Simplified: use currentSpendUsd / 30 as daily average
            const dailyAvg = budget.currentSpendUsd / 30;
            if (dailyAvg + costUsd > budget.dailyLimitUsd) {
                return { allowed: false, reason: `Daily limit would be exceeded: $${(dailyAvg + costUsd).toFixed(2)} > $${budget.dailyLimitUsd}` };
            }
        }

        return { allowed: true };
    }

    async recordPlatformSpend(amountUsd: number): Promise<void> {
        const budget = await this.getPlatformBudget();
        if (!budget) return;

        budget.currentSpendUsd += amountUsd;
        budget.updatedAt = Date.now();
        await this.db.keyValue.put({
            id: PlatformBudgetService.KEY,
            value: budget,
        });
    }

    async resetPeriod(): Promise<void> {
        const budget = await this.getPlatformBudget();
        if (!budget) return;

        const now = Date.now();
        budget.currentSpendUsd = 0;
        budget.periodStart = now;
        budget.periodEnd = now + 30 * 24 * 60 * 60 * 1000;
        budget.updatedAt = now;
        await this.db.keyValue.put({
            id: PlatformBudgetService.KEY,
            value: budget,
        });
        LOGGER.info('resetPeriod', 'Platform budget period reset');
    }
}

// ── Budget Incidents Service ──

let incidentCounter = 0;

export class BudgetIncidentService implements IBudgetIncidentService {
    private db: {
        budgetIncidents: {
            toArray(): Promise<Record<string, unknown>[]>;
            put(v: Record<string, unknown>): Promise<string>;
        };
    };

    constructor(db: {
        budgetIncidents: {
            toArray(): Promise<Record<string, unknown>[]>;
            put(v: Record<string, unknown>): Promise<string>;
        };
    }) {
        this.db = db;
    }

    async logIncident(input: Omit<BudgetIncident, 'id' | 'createdAt'>): Promise<BudgetIncident> {
        const incident: BudgetIncident = {
            ...input,
            id: `incident-${Date.now()}-${++incidentCounter}`,
            createdAt: Date.now(),
        };
        await this.db.budgetIncidents.put(incident as unknown as Record<string, unknown>);
        LOGGER.info('logIncident', `${incident.type}: ${incident.message} ($${incident.spendUsd} / $${incident.limitUsd})`);
        return incident;
    }

    async listIncidents(limit = 100): Promise<BudgetIncident[]> {
        const all = await this.db.budgetIncidents.toArray() as unknown as BudgetIncident[];
        return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
    }

    async listIncidentsByAgent(agentId: string): Promise<BudgetIncident[]> {
        const all = await this.db.budgetIncidents.toArray() as unknown as BudgetIncident[];
        return all.filter(i => i.agentId === agentId).sort((a, b) => b.createdAt - a.createdAt);
    }

    async resolveIncident(id: string, resolvedBy: string): Promise<BudgetIncident> {
        const all = await this.db.budgetIncidents.toArray() as unknown as BudgetIncident[];
        const incident = all.find(i => i.id === id);
        if (!incident) throw new Error(`Incident not found: ${id}`);
        const updated: BudgetIncident = { ...incident, resolvedBy, resolvedAt: Date.now() };
        await this.db.budgetIncidents.put(updated as unknown as Record<string, unknown>);
        return updated;
    }

    async getIncidentStats(): Promise<{ softAlerts: number; hardStops: number; total: number }> {
        const all = await this.db.budgetIncidents.toArray() as unknown as BudgetIncident[];
        return {
            softAlerts: all.filter(i => i.type === 'soft_alert').length,
            hardStops: all.filter(i => i.type === 'hard_stop').length,
            total: all.length,
        };
    }
}
