/**
 * Phase 1 — Foundation.
 *
 * Services with no dependencies on other kernel services (other than
 * `database` and `eventBus`, which are pre-registered in bootstrap).
 * These are the base that every later phase consumes.
 *
 * A-04: All services now use registerFactory (lazy instantiation).
 * Factories receive the container `c` and resolve deps lazily on first get().
 * This makes services overridable for testing via container.override().
 */
import type { Phase } from './helpers';
import type { IEventBus, IDatabaseService, ISecurityService } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { StorageLayer, KeyStore } from '../contracts/storage/storage-layer';
import type { SettingsServiceDeps } from '../services/settings-service';
import { SettingsService } from '../services/settings-service';
import { PricingService } from '../services/pricing-service';
import { KeyStateStore } from '../services/key-state-store';
import { ProviderTracker } from '../services/provider-tracker';
import { SystemKernel } from '../kernel';
import { MetricsService } from '../services/metrics-service';
import { ProviderAdapterRegistry } from '../services/provider-adapter-registry';
import { KeyService } from '../services/key-management/key-service';
import { GroupManagerService } from '../services/group-manager';
import { SessionManagerService } from '../services/session-manager-service';
import { ExecutionGovernorService } from '../services/execution-governor';
import { KeyFingerprints } from '../services/key-management/key-fingerprints';
import { KeyIntelligencePipeline } from '../services/key-intelligence-pipeline';
import { initCostOptimization } from '../services/cost-optimization-service';
import { SessionLinkRepository } from '../dal/session-link-repository';
import { DebateTimelineRepository } from '../dal/debate-timeline-repository';
import { DebateOverrideRepository } from '../dal/debate-override-repository';
import type { AdvisorService } from '../services/advisor-service';

import { DeadLetterQueueService } from '../services/dead-letter-queue-service';
import type { IDeadLetterQueue } from '../contracts/dead-letter-queue';
import { DistributedLockService } from '../services/cross-tab-lock-service';
import type { IDistributedLock } from '../contracts/cross-tab-lock';
import { EVENTS } from '../events/event-names';
import { rootLogger } from '../services/logger-service';

const LOGGER = rootLogger.child('Phase1Foundation');

export const registerPhase1: Phase = (helpers, ctx) => {
    const { register, asDeps } = helpers;

    // A-04: Pull storageLayer/keyStore/configStore once for use in factories.
    // These are cheap (synchronous get() of pre-registered singletons).
    const storageLayer = ctx.container.get<StorageLayer>('storageLayer');
    const keyStore = storageLayer?.keys;
    const configStore = storageLayer?.config;

    if (import.meta.env.DEV) {
        LOGGER.debug('Phase1Foundation', '[KEY_FLOW] keyStore implementation type', {
            storageLayerExists: !!storageLayer,
            keyStoreExists: !!keyStore,
            isStub: !storageLayer,
            hasListKeys: typeof keyStore?.listKeys === 'function',
            hasBulkPut: typeof keyStore?.bulkPut === 'function',
        });
    }

    // A-04: Defensive keyStore stub — if storageLayer is missing in dev,
    // downstream services still boot with a safe no-op implementation.
    const safeKeyStore: KeyStore =
        keyStore && typeof keyStore.listKeys === 'function'
            ? keyStore
            : (() => {
                  LOGGER.warn(
                      'Phase1Foundation',
                      'keyStore missing or incomplete — using safe stub',
                  );
                  return {
                      saveKey: async () => {},
                      getKey: async () => null,
                      listKeys: async () => [],
                      deleteKey: async () => {},
                      bulkPut: async () => {},
                      bulkAdd: async () => {},
                      where: async () => undefined,
                      exportAll: async () => '[]',
                      importAll: async () => {},
                      clear: async () => {},
                  } satisfies KeyStore;
              })();

    register(
        'settingsService',
        (c) =>
            new SettingsService({
                database: c.get<IDatabaseService>('database'),
                eventBus: c.get<IEventBus>('eventBus'),
                get routerService() {
                    return c.get<SettingsServiceDeps['routerService']>('routerService');
                },
                get kernel() {
                    return c.get<SettingsServiceDeps['kernel']>('kernel');
                },
            }),
    );

    register(
        'pricingService',
        (c) =>
            new PricingService({
                database: c.get<IDatabaseService>('database'),
                eventBus: c.get<IEventBus>('eventBus'),
            }),
    );

    register(
        'keyStateStore',
        (c) =>
            new KeyStateStore(
                c.get<IEventBus>('eventBus'),
                c.get<IDatabaseService>('database'),
                () => {
                    try {
                        return (
                            c
                                .get<KeyService>('keyService')
                                ?.getKeys()
                                .map((k) => k.id) ?? []
                        );
                    } catch {
                        return [];
                    }
                },
            ),
    );

    // A-04: tracker.start() called inside factory — instance exists at that point.
    register('providerTracker', (c) => {
        const tracker = new ProviderTracker({
            costCalculator: c.get<PricingService>('pricingService'),
            keyStateStore: c.get<KeyStateStore>('keyStateStore'),
            database: c.get<IDatabaseService>('database'),
        });
        tracker.start(c.get<IEventBus>('eventBus'));
        return tracker;
    });

    register(
        'kernel',
        (c) =>
            new SystemKernel({
                database: c.get<IDatabaseService>('database'),
                eventBus: c.get<IEventBus>('eventBus'),
                providerTracker: c.get<ProviderTracker>('providerTracker'),
            }),
    );

    register(
        'metricsService',
        (c) =>
            new MetricsService({
                database: c.get<IDatabaseService>('database'),
                eventBus: c.get<IEventBus>('eventBus'),
                kernel: c.get<SystemKernel>('kernel'),
            }),
    );

    // A-04: Registry is created inside factory so we can subscribe to events.
    register('providerAdapterRegistry', (c) => {
        const registry = new ProviderAdapterRegistry();
        const eventBus = c.get<IEventBus>('eventBus');
        const unsubCb = eventBus.onSafe<{ provider: string; status: string }>(
            EVENTS.PROVIDER_CIRCUIT_BREAKER_SYNCED,
            (payload) => {
                registry.syncCircuitBreakerState(payload.provider, payload.status);
            },
        );
        const unsubRl = eventBus.onSafe<{ provider: string; remaining: number }>(
            EVENTS.PROVIDER_RATE_LIMIT_SYNCED,
            (payload) => {
                registry.syncRateLimitState(payload.provider, payload.remaining);
            },
        );
        // Store unsubs on the registry for cleanup in destroy()
        (registry as unknown as { _unsubs?: Array<() => void> })._unsubs = [unsubCb, unsubRl];
        return registry;
    });

    register(
        'keyService',
        (c) =>
            new KeyService(
                asDeps<ConstructorParameters<typeof KeyService>[0]>({
                    database: c.get<IDatabaseService>('database'),
                    keyStore: safeKeyStore,
                    eventBus: c.get<IEventBus>('eventBus'),
                    securityService: c.get<ISecurityService>('securityService'),
                    pricingService: c.get<PricingService>('pricingService'),
                    providerAdapterRegistry:
                        c.get<ProviderAdapterRegistry>('providerAdapterRegistry'),
                    keyStateStore: c.get<KeyStateStore>('keyStateStore'),
                    get advisorService() {
                        return c.get<AdvisorService>('advisorService');
                    },
                }),
            ),
    );

    register(
        'groupManagerService',
        (c) =>
            new GroupManagerService(
                asDeps<ConstructorParameters<typeof GroupManagerService>[0]>({
                    keyService: c.get<KeyService>('keyService'),
                    eventBus: c.get<IEventBus>('eventBus'),
                    storage: {
                        getKv: async <T>(id: string) =>
                            configStore ? configStore.get<T>(id) : null,
                        setKv: async <T>(id: string, value: T) => {
                            if (configStore) await configStore.set(id, value);
                        },
                    },
                }),
            ),
    );

    register('sessionManagerService', (c) => {
        const db = c.get<DatabaseService>('database');
        return new SessionManagerService(
            storageLayer.sessions,
            storageLayer.debates,
            c.get<IEventBus>('eventBus'),
            new DebateTimelineRepository(db),
            new DebateOverrideRepository(db),
            new SessionLinkRepository(db),
        );
    });

    register('executionGovernor', (_c) => new ExecutionGovernorService());

    // ── Key Fingerprints ─────────────────────────────────────
    register('fingerprints', (_c) => new KeyFingerprints());

    // ── Key Intelligence Pipeline ────────────────────────────
    register('keyIntelligencePipeline', (c) => {
        const fps = c.get<KeyFingerprints>('fingerprints');
        return new KeyIntelligencePipeline({
            fingerprints: fps,
            getExistingKeys: () => c.get<KeyService>('keyService').getKeys(),
            verifyKey: async (provider, apiKey) => {
                const adapter = c
                    .get<ProviderAdapterRegistry>('providerAdapterRegistry')
                    .getAdapter(provider);
                if (!adapter)
                    return {
                        valid: false,
                        latency: 0,
                        models: [],
                        error: `No adapter for ${provider}`,
                    };
                const start = performance.now();
                try {
                    const models = await adapter.getAvailableModels(apiKey);
                    return { valid: true, latency: Math.round(performance.now() - start), models };
                } catch (err: unknown) {
                    return {
                        valid: false,
                        latency: Math.round(performance.now() - start),
                        models: [],
                        error: err instanceof Error ? err.message : String(err),
                    };
                }
            },
        });
    });

    // Dead Letter Queue — persistent storage for failed events that exceeded retries.
    register('deadLetterQueue', (c) => {
        const db = c.get<IDatabaseService>('database');
        const dlq = new DeadLetterQueueService({
            getKv: (id) => db.getKv(id),
            setKv: (id, value) => db.setKv(id, value),
        });
        dlq.init().catch((e) =>
            LOGGER.warn('DeadLetterQueue', 'init failed', { error: String(e) }),
        );
        return dlq as IDeadLetterQueue;
    });

    // Distributed Lock — Dexie-backed cross-tab lock for debate/chat session protection.
    register('distributedLock', () => {
        const svc = new DistributedLockService();
        return svc as IDistributedLock;
    });

    // A-04: initCostOptimization() called after all its deps are registered.
    // It only registers adapters in providerTracker; no circular dependency.
    initCostOptimization(
        ctx.container.get<ProviderTracker>('providerTracker'),
        ctx.container.get<PricingService>('pricingService'),
    );
};
