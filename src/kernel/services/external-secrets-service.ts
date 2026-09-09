import { EVENTS } from '../events/event-names';
import type { SecretStore, SecretRef, SecretStoreConfig } from '../contracts/secret-store';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ExternalSecretsService');

export type BackendType = 'local' | 'vault' | 'aws' | 'gcp';

export interface BackendStatus {
    type: BackendType;
    label: string;
    healthy: boolean;
    active: boolean;
}

export interface ExternalSecretsServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    storeFactories?: Partial<Record<BackendType, () => SecretStore>>;
}

const CONFIG_KEY = 'external_secrets_config';

export class ExternalSecretsService {
    private backends: Map<string, SecretStore> = new Map();
    private activeBackend: BackendType = 'local';
    private initialized = false;
    private deps: ExternalSecretsServiceDeps;

    constructor(deps: ExternalSecretsServiceDeps) {
        this.deps = deps;
    }

    register(type: BackendType, store: SecretStore) {
        this.backends.set(type, store);
    }

    async init(): Promise<boolean> {
        if (this.initialized) return true;

        if (this.deps.storeFactories?.local) {
            const local = this.deps.storeFactories.local();
            await local.init({ type: 'local', label: 'Local Encrypted Vault' });
            this.backends.set('local', local);
        }

        try {
            const saved = await this.deps.database.getKv<{
                type: BackendType;
                config: SecretStoreConfig;
            }>(CONFIG_KEY);
            if (saved && saved.type !== 'local') {
                await this.activateBackend(saved.type, saved.config);
            }
        } catch (e) {
            LOGGER.warn('ExternalSecretsService', 'Failed to load saved config', { error: e });
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: 'Secret store config load failed, using defaults',
                type: 'error',
            });
        }

        this.initialized = true;
        return true;
    }

    async activateBackend(type: BackendType, config: SecretStoreConfig): Promise<boolean> {
        const factory = this.deps.storeFactories?.[type];
        if (!factory) return false;

        const store = factory();
        const ok = await store.init(config);
        if (!ok) return false;

        this.backends.set(type, store);
        this.activeBackend = type;

        try {
            await this.deps.database.setKv(CONFIG_KEY, { type, config });
        } catch (e) {
            LOGGER.warn('ExternalSecretsService', 'Failed to persist config', { error: e });
        }

        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Secret store switched to ${config.label || type}`,
            type: 'success',
        });

        return true;
    }

    async getSecret(ref: SecretRef): Promise<string | null> {
        const store = this.backends.get(this.activeBackend);
        if (!store) return null;

        let threw = false;
        let value = await store.get(ref).catch((e) => {
            threw = true;
            LOGGER.warn('ExternalSecretsService', 'Active backend get failed:', { error: e });
            this.deps.eventBus.emit(EVENTS.SECRETS_LOOKUP_FAILED, {
                backend: this.activeBackend,
                path: ref.path,
                error: String(e),
            });
            return null;
        });
        // Only fallback to local when active backend is unreachable (threw),
        // not when the key genuinely doesn't exist (returns null)
        if (value == null && threw && this.activeBackend !== 'local') {
            const local = this.backends.get('local');
            if (local) {
                value = await local.get(ref).catch((e) => {
                    LOGGER.warn('ExternalSecretsService', 'Local fallback get failed:', {
                        error: e,
                    });
                    return null;
                });
            }
        }

        return value;
    }

    async setSecret(ref: SecretRef, value: string): Promise<boolean> {
        const store = this.backends.get(this.activeBackend);
        if (!store) return false;

        const ok = await store.set(ref, value);
        return ok;
    }

    async deleteSecret(ref: SecretRef): Promise<boolean> {
        let ok = false;
        for (const store of this.backends.values()) {
            if (
                await store.delete(ref).catch((e) => {
                    LOGGER.warn('ExternalSecretsService', 'Delete failed:', { error: e });
                    return false;
                })
            ) {
                ok = true;
            }
        }
        LOGGER.info('ExternalSecretsService', 'Secret deleted', { path: ref.path, ok });
        return ok;
    }

    async listSecrets(prefix = ''): Promise<string[]> {
        const store = this.backends.get(this.activeBackend);
        if (!store) return [];
        return store.list(prefix);
    }

    async migrateSecrets(
        from: BackendType,
        to: BackendType,
    ): Promise<{ migrated: number; failed: number }> {
        const source = this.backends.get(from);
        const target = this.backends.get(to);
        if (!source || !target) return { migrated: 0, failed: 0 };

        const paths = await source.list();
        let migrated = 0;
        let failed = 0;

        for (const path of paths) {
            try {
                const value = await source.get({ path });
                if (value != null) {
                    const ok = await target.set({ path }, value);
                    if (ok) migrated++;
                    else failed++;
                }
            } catch (e) {
                LOGGER.warn('ExternalSecrets', 'Migration entry failed', {
                    path,
                    error: String(e),
                });
                failed++;
            }
        }

        LOGGER.info('ExternalSecretsService', `Migration ${from} → ${to}`, { migrated, failed });
        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Migration ${from} → ${to}: ${migrated} migrated, ${failed} failed`,
            type: failed > 0 ? 'warning' : 'success',
        });

        return { migrated, failed };
    }

    async getStatus(): Promise<BackendStatus[]> {
        const results: BackendStatus[] = [];
        for (const [type, store] of this.backends) {
            const healthy = await store.health().catch(() => false);
            results.push({
                type: type as BackendType,
                label: store.label,
                healthy,
                active: type === this.activeBackend,
            });
        }
        return results;
    }

    getActiveBackend(): BackendType {
        return this.activeBackend;
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    destroy() {
        this.backends.clear();
        this.initialized = false;
        this.activeBackend = 'local';
    }
}
