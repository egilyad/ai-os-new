import type { ApiKey } from '../../types/metrics-types';
import { EVENTS } from '../../events/event-names';
import { initStats } from './key-registry-utils';

type MetricsResponse = {
    keyId?: string;
    provider: string;
    status: string;
    error?: string;
    latency?: number;
    ttft?: number;
    tokens?: number | { total?: number };
    tps?: number;
};

export interface KeyMetricsHandlerDeps {
    eventBus: {
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    registry: {
        getKey: (id: string) => ApiKey | undefined;
        getKeys: () => ApiKey[];
        modifyKey: (id: string, fn: (key: ApiKey) => void) => void;
        saveKeys: () => Promise<void>;
    };
    health: {
        check429Spike: (keyId: string) => void;
        getBackoffMs: (keyId: string) => number;
    };
    alerts: {
        addAlert: (key: ApiKey, alert: { type: string; severity: string; message: string }) => void;
    };
    analytics: {
        updateMetricsFromResponse: (key: ApiKey, res: MetricsResponse) => void;
    };
    notify: () => void;
    addTimer: (timer: ReturnType<typeof setTimeout>) => void;
}

/**
 * Processes MESSAGE_RESPONSE events against the key registry:
 * - locates the key entry by id or provider
 * - handles 429/rate-limit spikes (backoff, alerts, KEY_QUOTA_EXCEEDED)
 * - records error state + lastError
 * - delegates metric recording to KeyAnalytics
 */
export class KeyMetricsHandler {
    constructor(private deps: KeyMetricsHandlerDeps) {}

    /** Timers are owned by the parent KeyService via addTimer; nothing to clean up. */
    destroy(): void {
        // no-op — scheduled backoff timers are registered on the parent's timer set
    }

    handleMetricsFromResponse(res: Record<string, unknown>): void {
        const r = res as MetricsResponse;
        const keyEntry = r.keyId
            ? this.deps.registry.getKey(r.keyId)
            : this.deps.registry
                  .getKeys()
                  .find((k) => k.provider.toLowerCase() === r.provider.toLowerCase());
        if (!keyEntry) return;
        const keyId = keyEntry.id;

        if (r.status === 'error' && r.error) {
            const isRateLimit =
                r.error.includes('429') ||
                r.error.toLowerCase().includes('quota') ||
                r.error.toLowerCase().includes('rate limit');
            if (isRateLimit) {
                this.deps.health.check429Spike(keyId);
                const backoffMs = this.deps.health.getBackoffMs(keyId);
                this.deps.registry.modifyKey(keyId, (key) => {
                    this.deps.alerts.addAlert(key, {
                        type: 'rate_limit',
                        severity: 'medium',
                        message: `Provider ${key.provider} quota exhausted (429)`,
                    });
                    if (key.stats?.extended) {
                        key.stats.extended.state = 'DEGRADED' as NonNullable<
                            ApiKey['stats']['extended']
                        >['state'];
                    }
                    key.status = 'inactive';
                });
                this.deps.eventBus.emitOnce(
                    EVENTS.KEY_QUOTA_EXCEEDED,
                    `${keyId}:${keyEntry.provider}:requests`,
                    {
                        id: keyId,
                        provider: keyEntry.provider,
                        quotaType: 'requests',
                    },
                );
                this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `${keyEntry.provider} hit 429 — retrying in ${Math.round(backoffMs / 1000)}s (exponential backoff)`,
                    type: 'warning',
                });
                const t = setTimeout(() => {
                    this.deps.eventBus.emit(EVENTS.CHECK_HEALTH, keyId);
                }, backoffMs);
                this.deps.addTimer(t);
            }
            this.deps.registry.modifyKey(keyId, (key) => {
                const previousState = key.status;
                key.status = 'error';
                if (!key.stats) {
                    key.stats = initStats();
                }
                key.stats.lastError = {
                    message: r.error || 'Unknown error',
                    timestamp: new Date().toISOString(),
                };
                this.deps.eventBus.emitOnce(
                    EVENTS.KEY_STATE_CHANGED,
                    `${keyId}:${key.provider}:error`,
                    {
                        id: keyId,
                        provider: key.provider,
                        state: 'error',
                        previousState,
                    },
                );
            });
        }

        this.deps.registry.modifyKey(keyId, (key) => {
            this.deps.analytics.updateMetricsFromResponse(key, r);
        });
        this.deps.registry.saveKeys();
        this.deps.notify();
    }
}
