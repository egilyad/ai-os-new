import type { ApiKey } from '../../types/metrics-types';
import type { FreeTierLimit } from './key-types';

export interface KeyQuotasDeps {
    eventBus: {
        emit: (event: string, data?: unknown) => void;
    };
    onQuotaExceeded: (
        id: string,
        provider: string,
        quotaType: 'tokens' | 'requests' | 'cost',
    ) => void;
    onStateTransition: (id: string, newState: string) => void;
    addAlert: (keyId: string, alert: { type: string; severity: string; message: string }) => void;
}

export class KeyQuotas {
    private freeTierLimits: Record<string, FreeTierLimit>;

    constructor(
        private deps: KeyQuotasDeps,
        freeTierLimits: Record<string, FreeTierLimit>,
    ) {
        this.freeTierLimits = { ...freeTierLimits };
    }

    getFreeTierLimits(): Record<string, FreeTierLimit> {
        return { ...this.freeTierLimits };
    }

    setFreeTierLimit(provider: string, limit: FreeTierLimit): void {
        this.freeTierLimits[provider.toLowerCase()] = limit;
    }

    syncFreeTierLimits(limits: Record<string, FreeTierLimit>): void {
        this.freeTierLimits = { ...limits };
    }

    applyFreeTierQuota(key: ApiKey): void {
        const limits = this.freeTierLimits[key.provider.toLowerCase()];
        if (!limits || limits.requestsPerDay === 0) return;
        if (!key.stats?.extended) return;
        const tags = key.tags ?? [];
        const isFree = tags.some((t) => t === 'tier:free');
        if (isFree) {
            key.stats.extended.rules.quota.requestsPerDay = limits.requestsPerDay;
            key.stats.extended.rules.quota.tokensPerDay = limits.tokensPerDay;
        }
    }

    checkQuotas(key: ApiKey): void {
        if (!key.stats?.extended) return;
        const ext = key.stats.extended;
        const rules = ext.rules.quota;
        const usage = ext.usageToday;

        // Daily Token Quota
        if (rules.tokensPerDay > 0 && usage.tokens >= rules.tokensPerDay) {
            this.deps.addAlert(key.id, {
                type: 'quota_exceeded',
                severity: 'critical',
                message: `Daily token quota exceeded (${usage.tokens}/${rules.tokensPerDay})`,
            });
            this.deps.onStateTransition(key.id, 'UNSTABLE');
            this.deps.onQuotaExceeded(key.id, key.provider, 'tokens');
        } else if (rules.tokensPerDay > 0 && usage.tokens > rules.tokensPerDay * 0.9) {
            this.deps.addAlert(key.id, {
                type: 'quota_warning',
                severity: 'high',
                message: `Daily token quota at 90% (${usage.tokens}/${rules.tokensPerDay})`,
            });
        } else if (rules.tokensPerDay > 0 && usage.tokens > rules.tokensPerDay * 0.8) {
            this.deps.addAlert(key.id, {
                type: 'quota_warning',
                severity: 'medium',
                message: `Daily token quota at 80% (${usage.tokens}/${rules.tokensPerDay})`,
            });
        }

        // Daily Request Quota
        if (rules.requestsPerDay > 0 && usage.requests >= rules.requestsPerDay) {
            this.deps.addAlert(key.id, {
                type: 'quota_exceeded',
                severity: 'critical',
                message: `Daily request quota exceeded (${usage.requests}/${rules.requestsPerDay})`,
            });
            this.deps.onStateTransition(key.id, 'UNSTABLE');
        } else if (rules.requestsPerDay > 0 && usage.requests > rules.requestsPerDay * 0.9) {
            this.deps.addAlert(key.id, {
                type: 'quota_warning',
                severity: 'high',
                message: `Daily request quota at 90% (${usage.requests}/${rules.requestsPerDay})`,
            });
        } else if (rules.requestsPerDay > 0 && usage.requests > rules.requestsPerDay * 0.8) {
            this.deps.addAlert(key.id, {
                type: 'quota_warning',
                severity: 'medium',
                message: `Daily request quota at 80% (${usage.requests}/${rules.requestsPerDay})`,
            });
        }

        // Monthly Budget
        if (rules.monthlyBudget && ext.usageMonthly.estimatedCost > rules.monthlyBudget) {
            this.deps.addAlert(key.id, {
                type: 'quota_exceeded',
                severity: 'critical',
                message: `Monthly budget exceeded ($${ext.usageMonthly.estimatedCost.toFixed(2)}/$${rules.monthlyBudget})`,
            });
            this.deps.onQuotaExceeded(key.id, key.provider, 'cost');
        }
    }

    isKeyQuotaExhausted(key: ApiKey): boolean {
        const ext = key.stats?.extended;
        if (!ext) return false;
        const quota = ext.rules?.quota;
        if (!quota) return false;
        const usage = ext.usageToday;
        if (!usage) return false;
        if (quota.requestsPerDay > 0 && usage.requests >= quota.requestsPerDay) return true;
        if (quota.tokensPerDay > 0 && usage.tokens >= quota.tokensPerDay) return true;
        return false;
    }

    canUseKey(key: ApiKey): { can: boolean; reason?: string } {
        if (!key || key.status !== 'active') return { can: false, reason: 'Key inactive' };
        const ext = key.stats?.extended;
        if (!ext) return { can: true };
        if (ext.currentConcurrentRequests >= ext.rules.maxConcurrentRequests)
            return { can: false, reason: 'Max concurrency' };
        if (this.isKeyQuotaExhausted(key)) return { can: false, reason: 'Daily quota exceeded' };
        return { can: true };
    }
}
