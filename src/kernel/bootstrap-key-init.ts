import type { IEventBus, IDatabaseService, ISecurityService } from './types/interfaces';
import type { IContainer } from './container';
import type { StorageLayer } from './contracts/storage/storage-layer';
import type { ApiKey } from './types/metrics-types';
import type { LoggerService } from './services/logger-service';
import { getDexieDb } from './services/database-service';
import { logDexieIdentityWithCount, verifyDexieInstance } from './services/dexie-identity';
import { setBootstrapSnapshot } from './bootstrap-state';
import { safeJsonParse } from '../kernel/utils/safe-json';
import { ssrSafeStorage } from './utils/ssr-storage';
import { rootLogger } from './services/logger-service';

const LOGGER = rootLogger.child('BootstrapKeyInit');

export async function runKeyMigration(container: IContainer, logger: LoggerService): Promise<void> {
    try {
        const { runOnce } = await import('./dal/key-migration');
        const db = container.get<IDatabaseService>('database');
        const storageMig = container.get<StorageLayer>('storageLayer');
        const securityService = container.has('securityService')
            ? container.get<ISecurityService>('securityService')
            : undefined;
        await runOnce({ db, keyStore: storageMig.keys, securityService });
    } catch (e) {
        logger.warn('Bootstrap', 'Key migration failed (non-critical)', { error: e });
    }
}

export async function hydrateKeyStorage(
    container: IContainer,
    eventBus: IEventBus,
    logger: LoggerService,
): Promise<void> {
    try {
        const { hydrateKeyStorage } = await import('./services/key-storage-hydrator');
        const keyService =
            container.get<import('./services/key-management/key-service').KeyService>('keyService');
        const storageHyd = container.get<StorageLayer>('storageLayer');
        await hydrateKeyStorage({
            eventBus,
            keyService,
            keyStore: storageHyd.keys,
        });
    } catch (e) {
        logger.warn('Bootstrap', 'Key storage hydration failed (non-critical)', {
            error: e,
        });
    }
}

export async function loadBootstrapSnapshot(
    container: IContainer,
    logger: LoggerService,
): Promise<void> {
    const bootstrapDexie = verifyDexieInstance('bootstrap:step3', getDexieDb());
    await logDexieIdentityWithCount('bootstrap:step3', bootstrapDexie);

    const storage = container.get<StorageLayer>('storageLayer');
    const repoKeys = await storage.keys.listKeys();
    if (import.meta.env.DEV)
        logger.info('Bootstrap', 'Snapshot repo count', { count: repoKeys.length });

    let snapshotKeys: ApiKey[] = repoKeys;
    let snapshotSource = repoKeys.length > 0 ? 'keystore' : 'unknown';

    if (snapshotKeys.length === 0) {
        const dexieRaw = await getDexieDb().apiKeys.toArray();
        if (import.meta.env.DEV)
            LOGGER.info('BootstrapKeyInit', '[BOOTSTRAP_SNAPSHOT_RAW] dexie count', {
                value: dexieRaw.length,
            });

        if (dexieRaw.length > 0) {
            snapshotKeys = [...dexieRaw];
            snapshotSource = 'dexie';
        }

        if (snapshotKeys.length === 0) {
            try {
                const blob = await getDexieDb().keyValue.get('sqlite_db_blob');
                if (blob?.value && Array.isArray(blob.value)) {
                    const bytes = new Uint8Array(blob.value as number[]);
                    const SQLITE_MAGIC = new Uint8Array([
                        83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0,
                    ]);
                    let validMagic = bytes.length >= 100;
                    for (let i = 0; validMagic && i < 16; i++) {
                        if (bytes[i] !== SQLITE_MAGIC[i]) validMagic = false;
                    }
                    if (validMagic) {
                        // sql.js disabled — extraction requires WASM runtime
                    }
                }
            } catch {
                /* non-critical */
            }
        }

        if (snapshotKeys.length === 0) {
            try {
                const raw = ssrSafeStorage.getItem('super_agents_api_keys');
                if (raw) {
                    const parsed = safeJsonParse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        snapshotKeys = parsed;
                        snapshotSource = 'localStorage';
                    }
                }
            } catch {
                /* non-critical */
            }
        }
    }

    try {
        ssrSafeStorage.removeItem('super_agents_api_keys');
        ssrSafeStorage.removeItem('superagents:providers:super_agents_api_keys');
        ssrSafeStorage.removeItem('superagents:providers:super_agents_kernel_state');
    } catch (e) {
        logger.warn('Bootstrap', 'Failed to remove legacy state', { error: String(e) });
    }

    if (snapshotKeys.length === 0) {
        try {
            const dexieGuard = await getDexieDb().apiKeys.toArray();
            if (dexieGuard.length > 0) {
                logger.warn('Bootstrap', 'Snapshot guard: snapshot is 0 but dexie has entries', {
                    dexieCount: dexieGuard.length,
                });
                snapshotKeys = [...dexieGuard];
                snapshotSource = 'dexie';
            }
        } catch {
            /* non-critical */
        }
    }

    if (import.meta.env.DEV)
        LOGGER.info('BootstrapKeyInit', '[BOOTSTRAP_SNAPSHOT_FINAL] count', {
            value: snapshotKeys.length,
        });
    if (import.meta.env.DEV)
        LOGGER.info('BootstrapKeyInit', '[BOOTSTRAP_SNAPSHOT_SOURCE]', {
            value: snapshotSource,
        });

    interface BootstrapGlobals {
        __BOOTSTRAP_PHASE__?: boolean;
        __BOOTSTRAP_KEYS_SOURCE__?: string;
        __BOOTSTRAP_KEY_COUNT__?: number;
    }
    const g = globalThis as unknown as BootstrapGlobals;
    g.__BOOTSTRAP_PHASE__ = true;
    g.__BOOTSTRAP_KEYS_SOURCE__ = snapshotSource;
    g.__BOOTSTRAP_KEY_COUNT__ = snapshotKeys.length;

    setBootstrapSnapshot(snapshotKeys);
}
