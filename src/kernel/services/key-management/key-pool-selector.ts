import type { ApiKey } from '../../types/metrics-types';
import type { PoolStrategy, IPoolSelectorService } from '../../contracts/pool-selector';
import type { FreeTierLimit } from './key-types';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
import { SeededRng } from '../../utils/seedable-rng';

const LOGGER = rootLogger.child('KeyPoolSelector');

export interface KeyPoolSelectorDeps {
    eventBus: {
        emit: (event: string, data?: unknown) => void;
        on: (event: string, handler: (id: unknown) => void) => () => void;
        onSafe: <T>(event: string, handler: (data: T) => void) => () => void;
    };
    getPoolKeys: (provider: string) => ApiKey[];
    getKeysByProvider: (provider: string) => ApiKey[];
    canUseKey: (key: ApiKey) => { can: boolean; reason?: string };
    isKeyQuotaExhausted: (key: ApiKey) => boolean;
    saveConfig: () => Promise<void>;
    freeTierLimits: Record<string, FreeTierLimit>;
    getGroupKeys?: (groupId: string) => ApiKey[] | undefined;
    getKeyGroupId?: (keyId: string) => string | undefined;
}

export class KeyPoolSelector implements IPoolSelectorService {
    private strategies: Record<string, PoolStrategy> = {};
    private index: Record<string, number> = {};
    private unsubs: Array<() => void> = [];
    private _rng = new SeededRng();

    constructor(private deps: KeyPoolSelectorDeps) {}

    /**
     * STATE-C4: Clean up pool state when keys are removed from the registry.
     * Without this listener, stale entries in `strategies` and `index` Maps
     * cause "skip first N keys" round-robin behavior after deletes.
     */
    start(): void {
        this.unsubs.push(
            this.deps.eventBus.onSafe<{ id: string }>(EVENTS.KEY_REMOVED, (data) => {
                LOGGER.debug('KeyPoolSelector', 'key removed', { keyId: data.id });
                this.index = {};
            }),
        );
    }

    destroy(): void {
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        this.strategies = {};
        this.index = {};
    }

    getPoolStrategy(provider: string): PoolStrategy {
        return this.strategies[provider.toLowerCase()] || 'round-robin';
    }

    async setPoolStrategy(provider: string, strategy: PoolStrategy) {
        this.strategies[provider.toLowerCase()] = strategy;
        await this.deps.saveConfig();
        this.deps.eventBus.emit(EVENTS.KEY_UPDATED, this.deps.getPoolKeys(provider));
    }

    selectFromPool(provider: string, strategy?: PoolStrategy): ApiKey | null {
        const strat = strategy || this.getPoolStrategy(provider);
        const pool = this.deps
            .getPoolKeys(provider)
            .filter((k) => this.deps.canUseKey(k).can && !this.deps.isKeyQuotaExhausted(k));
        if (pool.length === 0) return null;

        switch (strat) {
            case 'round-robin': {
                const key = provider.toLowerCase();
                const startIdx = (this.index[key] ?? 0) % pool.length;
                this.index[key] = (startIdx + 1) % pool.length;
                return pool[startIdx]!;
            }
            case 'least-usage':
                return pool.reduce(
                    (min, k) =>
                        (k.stats?.extended?.usageToday?.requests || 0) <
                        (min!.stats?.extended?.usageToday?.requests || 0)
                            ? k
                            : min,
                    pool[0]!,
                );
            case 'random':
                return this._rng.pick(pool);
        }
    }

    getPoolStatus(provider: string): {
        total: number;
        active: number;
        used: number;
        limit: number;
    } {
        const normalized = provider.toLowerCase();
        const pool = this.deps.getPoolKeys(normalized);
        const limit = this.deps.freeTierLimits[normalized]?.requestsPerDay || 0;
        const used = pool.reduce(
            (sum, k) => sum + (k.stats?.extended?.usageToday?.requests || 0),
            0,
        );
        return {
            total: this.deps.getKeysByProvider(normalized).length,
            active: pool.length,
            used,
            limit,
        };
    }

    getPoolKeyDistribution(provider: string): Array<{
        id: string;
        label: string;
        used: number;
        limit: number;
        pct: number;
        status: string;
        isUnlimited: boolean;
    }> {
        const normalized = provider.toLowerCase();
        return this.deps.getKeysByProvider(normalized).map((k) => {
            const used = k.stats?.extended?.usageToday?.requests || 0;
            const limit = k.stats?.extended?.rules?.quota?.requestsPerDay || 0;
            const isUnlimited =
                k.stats?.extended?.rules?.quota?.requestsPerDay === undefined || limit === 0;
            return {
                id: k.id,
                label: k.label,
                used,
                limit,
                pct: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
                status: k.status,
                isUnlimited,
            };
        });
    }

    setStrategies(strategies: Record<string, PoolStrategy>) {
        this.strategies = strategies;
    }

    getStrategies(): Record<string, PoolStrategy> {
        return this.strategies;
    }

    selectWithBurst(provider: string, strategy?: PoolStrategy): ApiKey | null {
        const primary = this.selectFromPool(provider, strategy);
        if (primary) return primary;

        if (this.deps.getGroupKeys) {
            const allPool = this.deps.getPoolKeys(provider);
            if (allPool.length === 0) return null;
            const exhausted = allPool.filter((k) => this.deps.isKeyQuotaExhausted(k));
            if (exhausted.length === 0) return null;

            const groupKeys = allPool.flatMap((k) => {
                const gid = this.deps.getKeyGroupId?.(k.id);
                return gid ? this.deps.getGroupKeys?.(gid) || [] : [];
            });
            const burst = groupKeys
                .filter(
                    (k) =>
                        k.provider.toLowerCase() === provider.toLowerCase() &&
                        this.deps.canUseKey(k).can &&
                        !this.deps.isKeyQuotaExhausted(k),
                )
                .sort((a, b) => (b.stats?.successCount || 0) - (a.stats?.successCount || 0));
            return burst[0] || null;
        }
        return null;
    }

    getBurstCapacity(provider: string): {
        totalQuota: number;
        usedQuota: number;
        availableBurst: number;
        keys: number;
    } {
        const pool = this.deps.getPoolKeys(provider.toLowerCase());
        let totalQuota = 0;
        let usedQuota = 0;
        for (const k of pool) {
            const limit = k.stats?.extended?.rules?.quota?.requestsPerDay || 0;
            const used = k.stats?.extended?.usageToday?.requests || 0;
            totalQuota += limit;
            usedQuota += used;
        }

        let availableBurst = totalQuota - usedQuota;
        if (availableBurst <= 0 && this.deps.getGroupKeys) {
            const seenGroups = new Set<string>();
            for (const k of pool) {
                const gid = this.deps.getKeyGroupId?.(k.id);
                if (gid && !seenGroups.has(gid)) {
                    seenGroups.add(gid);
                    const gk = this.deps.getGroupKeys?.(gid) || [];
                    for (const g of gk) {
                        const gl = g.stats?.extended?.rules?.quota?.requestsPerDay || 0;
                        const gu = g.stats?.extended?.usageToday?.requests || 0;
                        availableBurst += gl - gu;
                    }
                }
            }
        }

        return {
            totalQuota,
            usedQuota,
            availableBurst: Math.max(0, availableBurst),
            keys: pool.length,
        };
    }

    getQuotaShare(provider: string): {
        total: number;
        used: number;
        available: number;
        sharedPool: number;
    } {
        const pool = this.deps.getPoolKeys(provider.toLowerCase());
        let total = 0;
        let used = 0;
        for (const k of pool) {
            total += k.stats?.extended?.rules?.quota?.requestsPerDay || 0;
            used += k.stats?.extended?.usageToday?.requests || 0;
        }
        const sharedPool = total * 1.2;
        return {
            total,
            used,
            available: Math.max(0, total - used),
            sharedPool: Math.max(0, sharedPool - used),
        };
    }
}
