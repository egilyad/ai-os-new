/**
 * key-storage-hydrator.ts
 *
 * Single-source-of-truth hydration. After `resetKeyStorageToCanonical()` runs
 * in bootstrap, `getDexieDb().apiKeys` is a clean mirror of localStorage (the
 * canonical store). This function:
 *
 *   1. Reads `getDexieDb().apiKeys` (mirror only — NOT a source of truth)
 *   2. NO merge logic — no fallback to keyStore, no SQLite blob extraction
 *   3. NO cross-storage combinations of any kind
 *   4. Pushes the result to KeyRegistry via `keyService.reload()`
 *   5. Emits EVENTS.KEYS_LOADED with the committed count
 *
 * Idempotent: running multiple times is safe (the same N keys are read).
 */

import { getDexieDb } from './database-service';
import { logDexieIdentityWithCount, verifyDexieInstance } from './dexie-identity';
import { EVENTS } from '../events/event-names';
import type { IEventBus } from '../types/interfaces';
import type { KeyService } from './key-management/key-service';
import type { KeyStore } from '../contracts/storage/key-store';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('KeyStorageHydrator');

interface HydrationDeps {
    eventBus: IEventBus;
    keyService: KeyService;
    keyStore: KeyStore;
}

let _hydrationPromise: Promise<number> | null = null;

export async function hydrateKeyStorage(deps: HydrationDeps): Promise<number> {
    if (_hydrationPromise) return _hydrationPromise;

    _hydrationPromise = (async () => {
        // beforeCount intentionally omitted — diagnostic not needed

        // DEXIE_IDENTITY: verify the hydration instance is the same as the
        // globalThis anchor. Throws [DEXIE MISMATCH] on split.
        const verifiedInstance = verifyDexieInstance('key-storage-hydrator:start', getDexieDb());
        await logDexieIdentityWithCount('key-storage-hydrator:start', verifiedInstance);

        // Mirror only — single source. No merge, no fallback, no SQLite blob.
        const dexieKeys = await deps.keyStore.listKeys();
        LOGGER.info(
            'KeyStorageHydrator',
            `dexieKeys.length = ${dexieKeys.length} from instance ${verifiedInstance}`,
        );

        // Reload the registry (reads getDexieDb().apiKeys via loadKeys()).
        await deps.keyService.reload();
        let finalCount = deps.keyService.getKeys().length;

        // Safety net: if registry is empty but mirror has data, force resync.
        if (finalCount === 0 && dexieKeys.length > 0) {
            await deps.keyService.forceResyncFromDexie();
            finalCount = deps.keyService.getKeys().length;
        }

        // OBS-69: always emit KEYS_LOADED so monitors can detect 'hydrated but empty'
        deps.eventBus.emit(EVENTS.KEYS_LOADED, deps.keyService.getKeys());
        if (finalCount === 0) {
            // hydrated but empty — monitors already notified via KEYS_LOADED
        }

        return finalCount;
    })()
        .catch((err) => {
            LOGGER.error('KeyStorageHydrator', 'Hydration failed', { error: err });
            return 0;
        })
        .finally(() => {
            // Allow re-hydration after reset or failure
            _hydrationPromise = null;
        });

    return _hydrationPromise;
}
