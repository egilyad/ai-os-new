import type { ApiKey } from '../../types/metrics-types';
import { EVENTS } from '../../events/event-names';
import { initStats } from './key-registry-utils';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('KeyStatusManager');

export interface KeyStatusManagerDeps {
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
        quarantineKey: (key: ApiKey, source: string) => boolean;
        compromiseKey: (key: ApiKey, source: string) => void;
    };
    lifecycle: {
        onError: (id: string) => void;
    };
    notify: () => void;
}

/**
 * Owns all key status mutations on top of the registry:
 * - manual status flips (updateKeyStatus/toggleKeyStatus/enableAllKeys/disableAllKeys)
 * - security transitions (quarantineKey/compromiseKey)
 * - provider error handling (handleProviderError)
 * - extended state transitions (transitionState)
 */
export class KeyStatusManager {
    constructor(private deps: KeyStatusManagerDeps) {}

    updateKeyStatus(id: string, status: ApiKey['status'], latency?: number) {
        let prev: ApiKey['status'] | undefined;
        let provider = '';
        this.deps.registry.modifyKey(id, (key) => {
            prev = key.status;
            provider = key.provider;
            key.statusVersion = (key.statusVersion ?? 0) + 1;
            key.status = status;
            if (latency !== undefined) key.latency = latency;
            if (!key.history) key.history = [];
            key.history.push({
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                action: 'status_changed',
                detail: `${prev} > ${status}`,
            });
            if (key.history.length > 100) key.history = key.history.slice(-99);
        });
        if (prev === undefined) return;
        this.deps.registry
            .saveKeys()
            .catch((err) =>
                LOGGER.error(
                    'KeyStatusManager',
                    'updateKeyStatus saveKeys failed',
                    { id, status },
                    err,
                ),
            );
        this.deps.notify();
        this.deps.eventBus.emitOnce(EVENTS.KEY_STATE_CHANGED, `${id}:${provider}:${status}`, {
            id,
            provider,
            state: status,
            previousState: prev,
        });
    }

    updateAvailableModels(id: string, models: string[]) {
        this.deps.registry.modifyKey(id, (key) => {
            key.availableModels = models;
        });
        this.deps.registry
            .saveKeys()
            .catch((err) =>
                LOGGER.error(
                    'KeyStatusManager',
                    'updateAvailableModels saveKeys failed',
                    { id },
                    err,
                ),
            );
        this.deps.notify();
    }

    async toggleKeyStatus(id: string) {
        let prev: ApiKey['status'] | undefined;
        this.deps.registry.modifyKey(id, (key) => {
            prev = key.status;
            key.statusVersion = (key.statusVersion ?? 0) + 1;
            if (key.status === 'active') {
                key.status = 'inactive';
            } else if (key.status === 'inactive' || key.status === 'error') {
                key.status = 'active';
            }
            if (!key.history) key.history = [];
            key.history.push({
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                action: 'status_changed',
                detail: `${prev} > ${key.status}`,
            });
            if (key.history.length > 100) key.history = key.history.slice(-99);
        });
        if (prev !== undefined) {
            await this.deps.registry.saveKeys();
            this.deps.notify();
        }
    }

    async enableAllKeys() {
        const keys = this.deps.registry.getKeys();
        for (const k of keys) {
            this.deps.registry.modifyKey(k.id, (key) => {
                key.status = 'active';
            });
        }
        await this.deps.registry.saveKeys();
        this.deps.notify();
    }

    async disableAllKeys() {
        const keys = this.deps.registry.getKeys();
        for (const k of keys) {
            this.deps.registry.modifyKey(k.id, (key) => {
                key.status = 'inactive';
            });
        }
        await this.deps.registry.saveKeys();
        this.deps.notify();
    }

    quarantineKey(idOrFingerprint: string, source: string = 'manual'): boolean {
        let found = false;
        this.deps.registry.modifyKey(idOrFingerprint, (key) => {
            this.deps.health.quarantineKey(key, source);
            found = true;
        });
        if (!found) return false;
        this.deps.registry
            .saveKeys()
            .catch((err) =>
                LOGGER.error(
                    'KeyStatusManager',
                    'quarantineKey saveKeys failed',
                    { idOrFingerprint, source },
                    err,
                ),
            );
        this.deps.notify();
        return true;
    }

    compromiseKey(id: string, source: string = 'webhook'): boolean {
        let provider = '';
        let found = false;
        this.deps.registry.modifyKey(id, (key) => {
            provider = key.provider;
            this.deps.health.compromiseKey(key, source);
            found = true;
        });
        if (!found) return false;
        this.deps.registry.saveKeys();
        this.deps.notify();

        this.deps.eventBus.emitOnce(EVENTS.KEY_COMPROMISED, `${id}:${provider}`, {
            id,
            provider,
            source,
        });

        return true;
    }

    transitionState(id: string, newState: string) {
        this.deps.registry.modifyKey(id, (key) => {
            if (!key.stats?.extended) return;
            const oldState = key.stats.extended.state;
            if (oldState === newState) return;
            key.stats.extended.state = newState as NonNullable<
                ApiKey['stats']['extended']
            >['state'];
        });
        this.deps.notify();
    }

    async handleProviderError(keyId: string, error: string) {
        const isRateLimit = /\b429\b/.test(error) || /\brate.limit\b/i.test(error);
        const prev = this.deps.registry.getKey(keyId);
        const previousState = prev?.status;
        const provider = prev?.provider ?? 'unknown';
        this.deps.registry.modifyKey(keyId, (key) => {
            if (!isRateLimit) {
                key.status = 'error';
            }
            if (!key.stats) {
                key.stats = initStats();
            }
            key.stats.lastError = { message: error, timestamp: new Date().toISOString() };
        });
        await this.deps.registry.saveKeys();
        this.deps.eventBus.emitOnce(
            EVENTS.KEY_STATE_CHANGED,
            `${keyId}:${provider}:${isRateLimit ? 'rate_limited' : 'error'}`,
            {
                id: keyId,
                provider,
                state: isRateLimit ? 'rate_limited' : 'error',
                previousState,
            },
        );
        if (!isRateLimit) {
            this.deps.lifecycle.onError(keyId);
        }
    }
}
