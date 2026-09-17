import { getDexieDb } from './dexie-schema';
import type { PlatformBudget, BudgetIncident } from '../types/agems-budget';

export class AgemsBudgetService {
    async getPlatform(orgId = 'default'): Promise<PlatformBudget | undefined> {
        return (await getDexieDb().platformBudgets.where('orgId').equals(orgId).first()) as unknown as PlatformBudget | undefined;
    }

    async upsertPlatform(input: Omit<PlatformBudget, 'id' | 'currentSpendUsd' | 'periodStart' | 'periodEnd'> & { currentSpendUsd?: number }): Promise<PlatformBudget> {
        const existing = await this.getPlatform(input.orgId ?? 'default');
        const now = Date.now();
        if (existing?.id) {
            const upd: Partial<PlatformBudget> = { ...input, updatedAt: now } as unknown as Partial<PlatformBudget>;
            await getDexieDb().platformBudgets.update(existing.id as number, upd as never);
            return { ...existing, ...input, updatedAt: now } as PlatformBudget;
        }
        const row: PlatformBudget = {
            orgId: input.orgId ?? 'default',
            hourlyLimitUsd: input.hourlyLimitUsd,
            dailyLimitUsd: input.dailyLimitUsd,
            monthlyLimitUsd: input.monthlyLimitUsd,
            currentSpendUsd: input.currentSpendUsd ?? 0,
            softAlertPercent: 80,
            hardStopEnabled: true,
            periodStart: now,
            periodEnd: now + 30 * 86400000,
        };
        const id = (await getDexieDb().platformBudgets.add(row as never)) as unknown as number;
        return { ...row, id } as PlatformBudget;
    }

    async checkPlatformBudget(orgId = 'default'): Promise<{ blocked: boolean; reason?: string }> {
        const b = await this.getPlatform(orgId);
        if (!b) return { blocked: false };
        if (b.hardStopEnabled && b.monthlyLimitUsd && b.currentSpendUsd >= b.monthlyLimitUsd) {
            return { blocked: true, reason: `Platform monthly limit $${b.monthlyLimitUsd} exceeded` };
        }
        return { blocked: false };
    }

    async recordIncident(budgetId: number, type: BudgetIncident['type'], spend: number, limit: number, msg: string): Promise<void> {
        await getDexieDb().budgetIncidents.add({ budgetId, type, spendUsd: spend, limitUsd: limit, message: msg, createdAt: Date.now() } as never);
    }

    async incidents(budgetId?: number): Promise<BudgetIncident[]> {
        if (budgetId) return (await getDexieDb().budgetIncidents.where('budgetId').equals(budgetId).toArray()) as unknown as BudgetIncident[];
        return (await getDexieDb().budgetIncidents.toArray()) as unknown as BudgetIncident[];
    }
}

export const agemsBudgetService = new AgemsBudgetService();
