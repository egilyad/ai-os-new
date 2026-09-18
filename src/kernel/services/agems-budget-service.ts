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

    /** Increment spend; auto-records SOFT_ALERT on first crossing softAlertPercent, HARD_STOP at monthly limit */
    async addSpend(orgId = 'default', amountUsd: number): Promise<{ spent: number; blocked: boolean }> {
        const b = await this.getPlatform(orgId);
        if (!b?.id || amountUsd <= 0) return { spent: b?.currentSpendUsd ?? 0, blocked: false };
        const prev = b.currentSpendUsd;
        const spent = prev + amountUsd;
        await getDexieDb().platformBudgets.update(b.id as number, { currentSpendUsd: spent, updatedAt: Date.now() } as never);
        const limit = b.monthlyLimitUsd ?? 0;
        if (limit > 0) {
            const softAt = (limit * (b.softAlertPercent ?? 80)) / 100;
            if (prev < softAt && spent >= softAt) {
                await this.recordIncident(b.id as number, 'SOFT_ALERT', spent, limit, `Spend crossed ${b.softAlertPercent}% of $${limit} monthly limit`);
            }
            if (b.hardStopEnabled && prev < limit && spent >= limit) {
                await this.recordIncident(b.id as number, 'HARD_STOP', spent, limit, `Spend hit $${limit} monthly hard stop`);
            }
        }
        const check = await this.checkPlatformBudget(orgId);
        return { spent, blocked: check.blocked };
    }

    async resetSpend(orgId = 'default'): Promise<void> {
        const b = await this.getPlatform(orgId);
        if (!b?.id) return;
        await getDexieDb().platformBudgets.update(b.id as number, { currentSpendUsd: 0, periodStart: Date.now(), periodEnd: Date.now() + 30 * 86400000, updatedAt: Date.now() } as never);
        await this.recordIncident(b.id as number, 'BUDGET_RESET', 0, b.monthlyLimitUsd ?? 0, 'Spend reset for new period');
    }

    async incidents(budgetId?: number): Promise<BudgetIncident[]> {
        if (budgetId) return (await getDexieDb().budgetIncidents.where('budgetId').equals(budgetId).toArray()) as unknown as BudgetIncident[];
        return (await getDexieDb().budgetIncidents.toArray()) as unknown as BudgetIncident[];
    }
}

export const agemsBudgetService = new AgemsBudgetService();
