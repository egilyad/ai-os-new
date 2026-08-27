import { lazyService } from '../service-helper';

export const database = lazyService<import('../types/interfaces').IDatabaseService>('database');

export const keyService = lazyService<import('../services/key-management/key-service').KeyService>(
    'keyService',
    {
        getKeys: () => [],
        getAlerts: () => [],
        getPools: () => [],
        getFreeTierLimits: () => ({}),
        getPoolStrategy: () => 'round-robin' as const,
        getPoolKeyDistribution: () => [],
        verifyKey: async () => false,
        detectProvider: () => null,
        getRoutingPolicy: () => ({ globalSLAMode: 'BALANCED' as const, latencyThreshold: 1500 }),
    },
);

export const adapterRegistry =
    lazyService<import('../contracts/provider-adapter').IAdapterRegistry>(
        'providerAdapterRegistry',
    );

export const eventBus = lazyService<import('../types/interfaces').IEventBus>('eventBus');
