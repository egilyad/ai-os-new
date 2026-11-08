import type { ApiKey } from '../../types/metrics-types';
import { EVENTS } from '../../events/event-names';
import { KeyVault } from './key-vault';
import { KeyMetricsHandler } from './key-metrics-handler';
import { KeyStatusManager } from './key-status';
import { KeyModels } from './key-models';
import { KeyRegistry } from './key-registry';
import { KeyHealth } from './key-health';
import { KeyQuotas } from './key-quotas';
import { KeyAnalytics } from './key-analytics';
import { KeyFingerprints } from './key-fingerprints';
import { KeyAlerts } from './key-alerts';
import { KeyLifecycle } from './key-lifecycle';
import { KeyPoolSelector } from './key-pool-selector';
import { KeyDiagnostics } from './key-diagnostics';
import type { IGroupManager } from '../../contracts/group-manager';
import { ensureExtendedStats } from './key-registry-utils';
import type { FreeTierLimit } from './key-types';
import type { KeyServiceDeps } from './key-service-deps';
import { DEFAULT_FREE_TIER_LIMITS } from './key-service-constants';

export interface KeyServiceSubsystems {
    vault: KeyVault;
    registry: KeyRegistry;
    alerts: KeyAlerts;
    quotas: KeyQuotas;
    health: KeyHealth;
    analytics: KeyAnalytics;
    fingerprints: KeyFingerprints;
    lifecycle: KeyLifecycle;
    poolSelector: KeyPoolSelector;
    diagnostics: KeyDiagnostics;
    metricsHandler: KeyMetricsHandler;
    statusManager: KeyStatusManager;
    modelsManager: KeyModels;
    freeTierLimits: Record<string, FreeTierLimit>;
}

export interface KeyServiceHost {
    notify: () => void;
    saveConfig: () => Promise<void>;
    recordUsage: (
        keyIdOrProvider: string,
        latency: number,
        tokens?: number,
        model?: string,
        extra?: Record<string, unknown>,
    ) => void;
    updateKeyStatus: (id: string, status: ApiKey['status'], latency?: number) => void;
    addTimer: (timer: ReturnType<typeof setTimeout>) => void;
}

export interface KeyPoolSelectorParams {
    deps: Pick<KeyServiceDeps, 'eventBus'>;
    registry: KeyRegistry;
    quotas: KeyQuotas;
    freeTierLimits: Record<string, FreeTierLimit>;
    groupManager?: IGroupManager;
    saveConfig: () => Promise<void>;
}

export function createKeyPoolSelector(params: KeyPoolSelectorParams): KeyPoolSelector {
    const { deps, registry, quotas, freeTierLimits, groupManager, saveConfig } = params;
    return new KeyPoolSelector({
        eventBus: deps.eventBus,
        getPoolKeys: (provider) => registry.getPoolKeys(provider),
        getKeysByProvider: (provider) => registry.getKeysByProvider(provider),
        canUseKey: (key) => quotas.canUseKey(key),
        isKeyQuotaExhausted: (key) => quotas.isKeyQuotaExhausted(key),
        saveConfig,
        freeTierLimits,
        getGroupKeys: groupManager
            ? (groupId) => {
                  if (!groupId) return undefined;
                  const group = groupManager.getGroup(groupId);
                  if (!group) return undefined;
                  return group.keyIds
                      .map((id) => registry.getKey(id))
                      .filter((k): k is ApiKey => !!k && typeof k === 'object');
              }
            : undefined,
        getKeyGroupId: groupManager ? (keyId) => groupManager.getPassport(keyId)?.groupId : undefined,
    });
}

/**
 * Собирает все под-сервисы KeyService (vault, registry, health, quotas,
 * analytics, lifecycle, pool selector, diagnostics, metrics, status, models)
 * и связывает их между собой. Выносится из конструктора KeyService, чтобы
 * держать класс-фасад лёгким, а резину зависимостей — в отдельном модуле.
 */
export function createKeyServiceSubsystems(
    deps: KeyServiceDeps,
    host: KeyServiceHost,
): KeyServiceSubsystems {
    const freeTierLimits: Record<string, FreeTierLimit> = {
        ...DEFAULT_FREE_TIER_LIMITS,
    };

    const vault = new KeyVault();

    const registry = new KeyRegistry({
        eventBus: deps.eventBus,
        keyStore: deps.keyStore,
        database: deps.database,
        vault,
        freeTierLimits,
    });

    const alerts = new KeyAlerts({ eventBus: deps.eventBus });

    const quotas = new KeyQuotas(
        {
            eventBus: deps.eventBus,
            onQuotaExceeded: (id, provider, quotaType) => {
                deps.eventBus.emitOnce(
                    EVENTS.KEY_QUOTA_EXCEEDED,
                    `${id}:${provider}:${quotaType}`,
                    { id, provider, quotaType },
                );
                registry.pushHistory(id, 'quota_exceeded', `${quotaType} quota exceeded`);
            },
            onStateTransition: (id, newState) => {
                const key = registry.getKey(id);
                if (key) health.transitionState(key, newState);
            },
            addAlert: (keyId, alert) => {
                const key = registry.getKey(keyId);
                if (key) alerts.addAlert(key, alert);
            },
        },
        freeTierLimits,
    );

    const health = new KeyHealth({
        eventBus: deps.eventBus,
        onStateChanged: (id, provider, newState, previousState) => {
            deps.eventBus.emitOnce(EVENTS.KEY_STATE_CHANGED, `${id}:${provider}:${newState}`, {
                id,
                provider,
                state: newState,
                previousState,
            });
        },
        addAlert: (keyId, alert) => {
            const key = registry.getKey(keyId);
            if (key) alerts.addAlert(key, alert);
        },
        saveKeys: () => registry.saveKeys(),
        notify: () => host.notify(),
        getKey: (id) => registry.getKey(id),
        getActiveKeys: () => registry.getActiveKeys(),
        modifyKey: (id, fn) => registry.modifyKey(id, fn),
        providerAdapterRegistry: deps.providerAdapterRegistry,
    });

    const analytics = new KeyAnalytics({
        pricingService: deps.pricingService,
        eventBus: deps.eventBus,
        onLatencyBurst: (id, provider, latency) => {
            deps.eventBus.emit(EVENTS.KEY_LATENCY_BURST, { id, provider, latency });
        },
        onStateChanged: (id, provider, newState, previousState) => {
            deps.eventBus.emitOnce(EVENTS.KEY_STATE_CHANGED, `${id}:${provider}:${newState}`, {
                id,
                provider,
                state: newState,
                previousState,
            });
        },
        onReputationThresholdCrossed: (id, provider, score) => {
            deps.eventBus.emit(EVENTS.KEY_REPUTATION_THRESHOLD_CROSSED, {
                id,
                provider,
                score,
            });
        },
        ensureExtendedStats: (key) => ensureExtendedStats(key),
    });

    const fingerprints = new KeyFingerprints();
    const lifecycle = new KeyLifecycle({
        getKey: (id) => registry.getKey(id),
        saveKeys: () => registry.saveKeys(),
        notify: () => host.notify(),
        eventBus: deps.eventBus,
        keyHealth: health,
        keyStateStore: deps.keyStateStore,
        database: deps.database,
    });

    const poolSelector = createKeyPoolSelector({
        deps,
        registry,
        quotas,
        freeTierLimits,
        groupManager: undefined,
        saveConfig: () => host.saveConfig(),
    });

    const diagnostics = new KeyDiagnostics({
        eventBus: deps.eventBus,
        providerAdapterRegistry: deps.providerAdapterRegistry,
        get advisorService() {
            return deps.advisorService;
        },
        recordUsage: (id, latency, tokens, model, extra) =>
            host.recordUsage(id, latency, tokens, model, extra),
        getKey: (id) => registry.getKey(id),
        getKeys: () => registry.getKeys(),
    });

    const metricsHandler = new KeyMetricsHandler({
        eventBus: deps.eventBus,
        registry: {
            getKey: (id) => registry.getKey(id),
            getKeys: () => registry.getKeys(),
            modifyKey: (id, fn) => registry.modifyKey(id, fn),
            saveKeys: () => registry.saveKeys(),
        },
        health: {
            check429Spike: (keyId) => health.check429Spike(keyId),
            getBackoffMs: (keyId) => health.getBackoffMs(keyId),
        },
        alerts: {
            addAlert: (key, alert) => alerts.addAlert(key, alert),
        },
        analytics: {
            updateMetricsFromResponse: (key, res) =>
                analytics.updateMetricsFromResponse(key, res),
        },
        notify: () => host.notify(),
        addTimer: (timer) => host.addTimer(timer),
    });

    const statusManager = new KeyStatusManager({
        eventBus: deps.eventBus,
        registry: {
            getKey: (id) => registry.getKey(id),
            getKeys: () => registry.getKeys(),
            modifyKey: (id, fn) => registry.modifyKey(id, fn),
            saveKeys: () => registry.saveKeys(),
        },
        health: {
            quarantineKey: (key, source) => health.quarantineKey(key, source),
            compromiseKey: (key, source) => health.compromiseKey(key, source),
        },
        lifecycle: {
            onError: (id) => lifecycle.onError(id),
        },
        notify: () => host.notify(),
    });

    const modelsManager = new KeyModels({
        eventBus: deps.eventBus,
        registry: {
            getKey: (id) => registry.getKey(id),
            modifyKey: (id, fn) => registry.modifyKey(id, fn),
        },
        providerAdapterRegistry: deps.providerAdapterRegistry,
        updateKeyStatus: (id, status) => host.updateKeyStatus(id, status),
    });

    return {
        vault,
        registry,
        alerts,
        quotas,
        health,
        analytics,
        fingerprints,
        lifecycle,
        poolSelector,
        diagnostics,
        metricsHandler,
        statusManager,
        modelsManager,
        freeTierLimits,
    };
}
