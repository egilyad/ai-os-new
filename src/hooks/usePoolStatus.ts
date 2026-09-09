import { useState, useEffect, useCallback } from 'react';
import { eventBus, EVENTS } from '../kernel/instances';
import { keyService } from '../kernel/instances';
import type { PoolStrategy } from '../kernel/contracts/index';
import type { ApiKey } from '../types/metrics';

export interface PoolStatusState {
    keys: ApiKey[];
    quotas: Record<string, { requestsPerDay: number; tokensPerDay: number }>;
}

export interface PoolStatusActions {
    setFreeTierLimit: (
        provider: string,
        limit: { requestsPerDay: number; tokensPerDay: number },
    ) => void;
    setPoolStrategy: (provider: string, strategy: PoolStrategy) => void;
    getPoolStrategy: (provider: string) => PoolStrategy;
    getPoolKeyDistribution: (provider: string) => Array<{
        id: string;
        label: string;
        used: number;
        limit: number;
        pct: number;
        status: string;
    }>;
}

export interface UsePoolStatusResult extends PoolStatusState {
    actions: PoolStatusActions;
}

export function usePoolStatus(): UsePoolStatusResult {
    const [state, setState] = useState<PoolStatusState>(() => ({
        keys: [...keyService.getKeys()],
        quotas: keyService.getFreeTierLimits?.() || {},
    }));

    useEffect(() => {
        const update = () => {
            const newKeys = [...keyService.getKeys()];
            const newQuotas = keyService.getFreeTierLimits?.() || {};
            setState((prev) => {
                const prevQ = prev.quotas;
                const newQ = newQuotas;
                const qKeys = Object.keys(prevQ);
                const quotasEqual =
                    qKeys.length === Object.keys(newQ).length &&
                    qKeys.every(
                        (k) =>
                            k in newQ &&
                            newQ[k]!.requestsPerDay === prevQ[k]!.requestsPerDay &&
                            newQ[k]!.tokensPerDay === prevQ[k]!.tokensPerDay,
                    );
                if (prev.keys.length === newKeys.length && quotasEqual) return prev;
                return { keys: newKeys, quotas: newQuotas };
            });
        };
        const unsubs: (() => void)[] = [
            eventBus.on(EVENTS.KEY_UPDATED, update),
            eventBus.on(EVENTS.KEY_ADDED, update),
            eventBus.on(EVENTS.KEY_REMOVED, update),
            eventBus.on(EVENTS.KEY_STATE_CHANGED, update),
        ];
        return () => {
            for (const u of unsubs) u();
        };
    }, []);

    const setFreeTierLimit = useCallback(
        (provider: string, limit: { requestsPerDay: number; tokensPerDay: number }) => {
            keyService.setFreeTierLimit(provider, limit);
            setState((prev) => ({ ...prev, quotas: keyService.getFreeTierLimits?.() || {} }));
        },
        [],
    );

    const setPoolStrategy = useCallback((provider: string, strategy: PoolStrategy) => {
        keyService.setPoolStrategy(provider, strategy);
    }, []);

    const getPoolStrategy = useCallback((provider: string): PoolStrategy => {
        return keyService.getPoolStrategy(provider);
    }, []);

    const getPoolKeyDistribution = useCallback(
        (
            provider: string,
        ): Array<{
            id: string;
            label: string;
            used: number;
            limit: number;
            pct: number;
            status: string;
        }> => {
            return keyService.getPoolKeyDistribution(provider);
        },
        [],
    );

    return {
        ...state,
        actions: { setFreeTierLimit, setPoolStrategy, getPoolStrategy, getPoolKeyDistribution },
    };
}
