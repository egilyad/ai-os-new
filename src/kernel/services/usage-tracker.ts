import { CONFIG } from './config-registry';
import { rootLogger } from './logger-service';
import { ok, fail } from '../contracts/results';
import type { IUsageTracker } from '../contracts/pricing';
import type { QuotaError } from '../contracts/errors';
import type { Result } from '../contracts/results';

export interface UsageStats {
    totalTokens: number;
    totalCost: number;
    byProvider: Record<string, { tokens: number; cost: number }>;
}

export interface UsageRecord {
    provider: string;
    model: string;
    tokens: number;
    cost: number;
    timestamp: number;
}

export interface UsageTrackerDeps {
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
}

const STORAGE_KEY = 'super_agents_usage_records';
function getMaxRecords(): number {
    return CONFIG?.services?.usageTracker?.maxRecords ?? 10000;
}
function getDebounceMs(): number {
    return CONFIG?.services?.usageTracker?.debounceMs ?? 2000;
}

export class UsageTracker implements IUsageTracker {
    private records: UsageRecord[] = [];
    private deps: UsageTrackerDeps;
    private dirty = false;
    private flushTimer: ReturnType<typeof setTimeout> | null = null;
    private persistPromise: Promise<void> | null = null;
    private _initialized = false;

    constructor(deps: UsageTrackerDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        try {
            const saved = await this.deps.database.getKv<UsageRecord[]>(STORAGE_KEY);
            if (saved) this.records = saved;
        } catch (e) {
            rootLogger.warn('UsageTracker', '[UsageTracker] Failed to load records', { error: e });
        }
    }

    private async persist() {
        try {
            await this.deps.database.setKv(STORAGE_KEY, this.records);
            this.dirty = false;
        } catch (e) {
            rootLogger.warn('UsageTracker', '[UsageTracker] Failed to persist records', {
                error: e,
            });
        }
    }

    private scheduleFlush() {
        this.dirty = true;
        if (this.flushTimer) return;
        this.flushTimer = setTimeout(() => {
            this.flushTimer = null;
            if (this.dirty) {
                this.persistPromise = this.persist();
            }
        }, getDebounceMs());
    }

    trackUsage(provider: string, model: string, tokens: number, cost: number): void {
        this.records.push({ provider, model, tokens, cost, timestamp: Date.now() });
        if (this.records.length > getMaxRecords()) {
            this.records = this.records.slice(-getMaxRecords());
        }
        this.scheduleFlush();
    }

    async destroy(): Promise<void> {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
        if (this.persistPromise) {
            await this.persistPromise;
        }
        if (this.dirty) {
            await this.persist();
        }
    }

    getUsageStats(): UsageStats {
        const byProvider: Record<string, { tokens: number; cost: number }> = {};
        let totalTokens = 0;
        let totalCost = 0;

        for (const r of this.records) {
            totalTokens += r.tokens;
            totalCost += r.cost;
            if (!byProvider[r.provider]) {
                byProvider[r.provider] = { tokens: 0, cost: 0 };
            }
            byProvider[r.provider]!.tokens += r.tokens;
            byProvider[r.provider]!.cost += r.cost;
        }

        return { totalTokens, totalCost, byProvider };
    }

    getProviderUsage(provider: string): { tokens: number; cost: number; requestCount: number } {
        const providerRecords = this.records.filter((r) => r.provider === provider);
        return {
            tokens: providerRecords.reduce((sum, r) => sum + r.tokens, 0),
            cost: providerRecords.reduce((sum, r) => sum + r.cost, 0),
            requestCount: providerRecords.length,
        };
    }

    checkQuota(provider: string): Result<void, QuotaError> {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentRecords = this.records.filter(
            (r) => r.provider === provider && r.timestamp >= thirtyDaysAgo,
        );
        const totalCost = recentRecords.reduce((sum, r) => sum + r.cost, 0);
        const totalRequests = recentRecords.length;
        const monthlyBudget = CONFIG?.pricing?.defaultMonthlyBudget ?? 50;
        const maxRequests = 10000;
        if (totalCost >= monthlyBudget) {
            return fail({
                type: 'quota',
                provider,
                limitType: 'cost',
                current: totalCost,
                limit: monthlyBudget,
            });
        }
        if (totalRequests >= maxRequests) {
            return fail({
                type: 'quota',
                provider,
                limitType: 'requests',
                current: totalRequests,
                limit: maxRequests,
            });
        }
        return ok(undefined);
    }

    getRecords(limit = 100): UsageRecord[] {
        return this.records.slice(-limit).reverse();
    }

    clear() {
        this.records = [];
        this.scheduleFlush();
    }
}
