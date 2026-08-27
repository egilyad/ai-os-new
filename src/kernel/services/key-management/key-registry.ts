import { genId } from '../../../utils/gen-id';
import type { ApiKey, KeyHistoryEntry, KeyNote } from '../../types/metrics-types';
import { EVENTS } from '../../events/event-names';
import type { FreeTierLimit } from './key-types';
import type { KeyStore } from '../../contracts/storage/key-store';
import { getDexieDb } from '../database-service';
import { logDexieIdentityWithCount, verifyDexieInstance } from '../dexie-identity';
import { isBootstrapPhase, getBootstrapSnapshot } from '../../bootstrap-state';
import { rootLogger } from '../logger-service';
import {
    computeFingerprint as computeFingerprintUtil,
    initStats,
    initExtendedStats,
    buildImportKeys,
    buildExportData,
    getStats as getStatsUtil,
} from './key-registry-utils';

const LOGGER = rootLogger.child('KeyRegistry');

const readBootstrapSnapshot = (): readonly ApiKey[] | null => getBootstrapSnapshot();

/**
 * Tracks how many times the keys array has been overwritten. Used to detect
 * silent N > 0 → 0 transitions and to attribute them via console.trace.
 */
let _overwriteSeq = 0;

export interface KeyRegistryDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    keyStore: KeyStore;
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    vault: {
        encryptKey: (plaintext: string) => Promise<string | null>;
        isLocked: () => boolean;
        decryptAllKeys: (keys: ApiKey[]) => Promise<ApiKey[]>;
        encryptAllKeys: (keys: ApiKey[]) => Promise<ApiKey[]>;
        stripPlaintextKeys: (keys: ApiKey[]) => ApiKey[];
    };
    freeTierLimits: Record<string, FreeTierLimit>;
}

export class KeyRegistry {
    private keys: ApiKey[] = [];
    #keyMap = new Map<string, number>();
    /** @internal Cached frozen snapshot for getKeys() — invalidated on every mutation */
    #frozenSnapshot: readonly ApiKey[] | null = null;
    private invalidateSnapshot(): void {
        this.#frozenSnapshot = null;
    }
    private unsubs: Array<() => void> = [];
    private deps: KeyRegistryDeps;

    constructor(deps: KeyRegistryDeps) {
        this.deps = deps;
    }

    getKeys(): ApiKey[] {
        // C-92: Use a lazily-built snapshot cache instead of cloning every call.
        // structuredClone is used ONCE between mutations; subsequent calls get a
        // cheap spread copy of the cached snapshot. Each key in the snapshot is
        // Object.freeze'd to prevent accidental mutation of canonical state.
        if (!this.#frozenSnapshot) {
            this.#frozenSnapshot = this.keys.map((k) => Object.freeze(structuredClone(k)));
        }
        return [...this.#frozenSnapshot];
    }

    getKey(id: string): ApiKey | undefined {
        const idx = this.#keyMap.get(id);
        if (idx === undefined) return undefined;
        // Return from frozen snapshot — cached clone, no per-call structuredClone.
        const key = this.#frozenSnapshot?.[idx];
        if (key) return { ...key };
        return structuredClone(this.keys[idx]);
    }

    getKeysByProvider(provider: string): ApiKey[] {
        return this.keys.filter((k) => k.provider.toLowerCase() === provider.toLowerCase());
    }

    getActiveKeys(): ApiKey[] {
        return this.keys.filter((k) => k.status === 'active');
    }

    getPoolKeys(provider: string): ApiKey[] {
        return this.keys.filter(
            (k) => k.provider.toLowerCase() === provider.toLowerCase() && k.status === 'active',
        );
    }

    getDefaultKeys(): ApiKey[] {
        return [];
    }

    setupListeners(handlers: {
        addKey: (data: Omit<ApiKey, 'id' | 'stats'>) => void;
        compromiseByFingerprint: (fingerprint: string, source: string) => void;
        updateMetricsFromResponse: (res: Record<string, unknown>) => void;
    }) {
        this.unsubs.push(
            // NOTE: KEY_ADDED listener removed — key is already added by the time
            // this event fires. Calling addKey() again causes a spurious
            // "Key already configured" error notification.
            // NOTE: KEY_REMOVED listener removed — it called handlers.removeKey(id)
            // which called keyService.removeKey(id) → emit KEY_REMOVED → infinite loop.
            // keyService.removeKey() already calls registry.removeKey() directly,
            // so this listener is redundant. External KEY_REMOVED emitters would
            // be handled by the same path: service removes from registry first,
            // then emits the event for downstream cleanup (KeyStateStore, etc.).
            this.deps.eventBus.on(EVENTS.MESSAGE_RESPONSE, (res: unknown) =>
                handlers.updateMetricsFromResponse(res as Record<string, unknown>),
            ),
            this.deps.eventBus.onSafe<{ id?: string; fingerprint?: string; source?: string }>(
                EVENTS.COMPROMISE_SIGNAL,
                (d) => {
                    if (d.fingerprint)
                        handlers.compromiseByFingerprint(
                            d.fingerprint,
                            d.source || 'external signal',
                        );
                },
            ),
        );
    }

    destroy() {
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
    }

    private loadingKeys = false;
    private saveQueue = Promise.resolve();
    private addKeyLock: Promise<ApiKey | null> = Promise.resolve(null);

    /** One-time migration: detect old vault-encrypted keys and clear them.
     *  Vault system was removed — encrypted keys cannot be decrypted. */
    private migrateEncryptedKeys(keys: ApiKey[]): { migrated: ApiKey[]; count: number } {
        const encrypted = keys.filter((k) => k.isEncrypted === true);
        if (encrypted.length === 0) return { migrated: keys, count: 0 };

        LOGGER.warn(
            'KeyRegistry',
            `[VAULT_MIGRATION] Found ${encrypted.length} old vault-encrypted key(s). Vault system was removed — clearing encrypted values. Please re-add your API keys.`,
        );

        const migrated: ApiKey[] = keys.map((k) => {
            if (!k.isEncrypted) return k;
            return {
                ...k,
                key: '',
                isEncrypted: false,
                status: 'error' as const,
                history: [
                    ...(k.history || []),
                    {
                        id: crypto.randomUUID(),
                        timestamp: Date.now(),
                        action: 'note_added' as const,
                        detail: 'MIGRATED: Vault removed — encrypted key cleared. Re-add your API key.',
                    },
                ],
            } as ApiKey;
        });

        return { migrated, count: encrypted.length };
    }

    async reload(): Promise<void> {
        const prevCount = this.keys.length;
        if (import.meta.env.DEV)
            console.trace('[KEY_REGISTRY_OVERWRITE]', {
                source: 'reload:enter',
                seq: ++_overwriteSeq,
                prevCount,
                nextCount: prevCount,
                force: false,
            });

        // During bootstrap phase, reload() is a no-op. The snapshot is already
        // committed to memory by loadKeys(); subsequent calls would risk
        // re-reading from storage layers that were intentionally excluded.
        if (isBootstrapPhase()) {
            if (import.meta.env.DEV)
                LOGGER.debug('KeyRegistry', 'reload() no-op during bootstrap phase');
            return;
        }

        // Post-bootstrap: if the registry already has keys, peek at dexieDb
        // BEFORE loadKeys() so we can refuse a no-op reload that would
        // overwrite valid state with whatever dexie currently returns.
        if (this.keys.length > 0) {
            try {
                // DEXIE_IDENTITY: log identity on every reload peek
                await logDexieIdentityWithCount('KeyRegistry.reload:peek', getDexieDb());
                const dexieKeys = await this.deps.keyStore.listKeys();
                if (dexieKeys.length === 0) {
                    LOGGER.warn(
                        'KeyRegistry',
                        `reload() BLOCKED: registry has ${this.keys.length} keys but dexie source is empty. Skipping reload to avoid overwrite.`,
                    );
                    return;
                }
            } catch (e) {
                LOGGER.warn('KeyRegistry', 'reload() precheck failed, proceeding with loadKeys()', {
                    error: e,
                });
            }
        }

        this.loadingKeys = false;
        await this.loadKeys();
    }

    async loadKeys(): Promise<void> {
        if (this.loadingKeys) return;
        this.loadingKeys = true;
        // ── KEY_DROP_TRACE: unique run id for this loadKeys() call ───
        const _dropRun = genId('run');
        try {
            // DEXIE_IDENTITY: verify KeyRegistry sees the same Dexie instance as
            // the hydration layer. Throws [DEXIE MISMATCH] on split.
            const verifiedInstance = verifyDexieInstance('KeyRegistry.loadKeys', getDexieDb());
            await logDexieIdentityWithCount('KeyRegistry.loadKeys', verifiedInstance);
            // ── Bootstrap snapshot fast path ─────────────────────────────
            // During bootstrap phase, the snapshot is the ONLY source. We do not
            // touch dexieDb, localStorage, or the sqlite blob. No fallbacks.
            if (isBootstrapPhase()) {
                const snapshotRaw = readBootstrapSnapshot();
                if (snapshotRaw && snapshotRaw.length > 0) {
                    const snapshot: ApiKey[] = [...snapshotRaw];
                    LOGGER.info(
                        'KeyRegistry',
                        `using bootstrap snapshot ONLY, count: ${snapshot.length}`,
                    );
                    // ── STAGE: normalize (map) ──────────────────────────────
                    const mapped: ApiKey[] = snapshot.map((k: ApiKey) => {
                        // Diagnostic: log first key structure
                        // Diagnostic removed — use traceKeyDrop below
                        const stats = k.stats || initStats();
                        if (!stats.extended) stats.extended = initExtendedStats();
                        return {
                            ...k,
                            history: k.history || [],
                            stats,
                            status: k.status || 'active',
                        };
                    });
                    this.traceKeyDrop(
                        _dropRun,
                        'bootstrap.normalize.map',
                        snapshot.length,
                        mapped.length,
                        mapped,
                    );
                    // ── STAGE: filter (structural validation only) ────────────
                    // Drop demo placeholders (empty key) and old placeholder- prefix.
                    const normalized: ApiKey[] = mapped.filter((k: ApiKey) => {
                        if (!k || typeof k !== 'object') return false;
                        if (!k.id) return false;
                        if (!k.provider) return false;
                        if (typeof k.key === 'string' && k.key.startsWith('placeholder-'))
                            return false;
                        return true;
                    });
                    this.traceKeyDrop(
                        _dropRun,
                        'bootstrap.filterValid',
                        mapped.length,
                        normalized.length,
                        normalized,
                    );
                    // ── STAGE: decrypt ──────────────────────────────────────
                    const decryptInput = normalized;
                    const decrypted = await this.deps.vault.decryptAllKeys(normalized);
                    this.traceKeyDrop(
                        _dropRun,
                        'bootstrap.decrypt',
                        decryptInput.length,
                        decrypted.length,
                        decrypted,
                    );
                    // ── STAGE: vault migration ──────────────────────────────
                    // Detect old vault-encrypted keys (isEncrypted === true) and clear them.
                    const { migrated: migrated, count: migratedCount } =
                        this.migrateEncryptedKeys(decrypted);
                    if (migratedCount > 0) {
                        LOGGER.warn(
                            'KeyRegistry',
                            `[VAULT_MIGRATION] Cleared ${migratedCount} encrypted key(s) from bootstrap snapshot.`,
                        );
                        try {
                            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                                message: `[VAULT MIGRATION] ${migratedCount} old vault-encrypted key(s) cleared. Please re-add your API keys.`,
                                type: 'warning',
                            });
                        } catch {
                            /* bootstrap — eventBus may not accept yet */
                        }
                    }
                    // ── STAGE: assign ───────────────────────────────────────
                    const before = this.keys.length;
                    this.setKeysInternal('loadKeys:bootstrap-snapshot', migrated, { force: true });
                    this.traceKeyDrop(
                        _dropRun,
                        'bootstrap.assign',
                        before,
                        this.keys.length,
                        this.keys,
                    );
                    if (import.meta.env.DEV)
                        LOGGER.debug('KeyRegistry', 'final committed count', {
                            count: this.keys.length,
                        });
                    return;
                }
            }

            // ── Normal path: read from KeyStore ─────────────────────
            const dexieKeys = await this.deps.keyStore.listKeys();
            this.traceKeyDrop(_dropRun, 'loadDexie', 0, dexieKeys.length, dexieKeys, {
                source: 'repo.getAll()',
            });

            // ── DIAGNOSTIC: print structure of the first 3 raw keys BEFORE filter
            // This reveals whether the field is `key`, `encryptedKey`, `value`, `apiKey`, etc.
            // No secret values logged — only property names + safe metadata.
            if (dexieKeys.length > 0) {
                // diagnostic: sample removed in favor of traceKeyDrop below
            }

            // ── STAGE: map (normalize stats) ────────────────────────────
            const loaded: ApiKey[] = dexieKeys.map((k) => {
                // Diagnostic: log first key structure for non-bootstrap
                // Diagnostic removed
                const stats = k.stats || initStats();
                if (!stats.extended) stats.extended = initExtendedStats();
                return {
                    ...k,
                    history: k.history || [],
                    stats,
                    status: k.status || 'active',
                };
            });
            this.traceKeyDrop(_dropRun, 'normalize.map', dexieKeys.length, loaded.length, loaded);

            // ── STAGE: filter (structural validation only) ────────────────
            // Drop only:
            //   - non-object entries
            //   - entries missing `id` or `provider` (cannot be addressed)
            //   - entries with literal 'placeholder-' prefix (old auto-seed marker)
            const real: ApiKey[] = [];
            for (const k of loaded) {
                let valid = true;
                if (!k || typeof k !== 'object') {
                    valid = false;
                    LOGGER.warn('KeyRegistry', 'Filter fail: not object', {
                        id: 'unknown',
                        provider: 'unknown',
                        hasKey: false,
                    });
                } else if (!k.id) {
                    valid = false;
                    LOGGER.warn('KeyRegistry', 'Filter fail: no id', {
                        id: 'unknown',
                        provider: 'unknown',
                        hasKey: false,
                    });
                } else if (!k.provider) {
                    valid = false;
                    LOGGER.warn('KeyRegistry', 'Filter fail: no provider', {
                        id: k.id,
                        provider: 'unknown',
                        hasKey: !!k.key,
                    });
                } else if (typeof k.key === 'string' && k.key.startsWith('placeholder-')) {
                    valid = false;
                    LOGGER.warn('KeyRegistry', 'Filter fail: placeholder key', {
                        id: k.id,
                        provider: k.provider,
                        hasKey: !!k.key,
                        keyLen: k.key.length,
                    });
                }
                if (valid) real.push(k);
            }
            LOGGER.info('KeyRegistry', 'Filtered keys count:', { count: real.length });
            // Per-key diagnostic: show WHY each key was kept/dropped (first 3 only).
            if (loaded.length > 0 && loaded.length !== real.length) {
                // diagnostic: decisions removed in favor of traceKeyDrop below
            }
            this.traceKeyDrop(_dropRun, 'filterValid', loaded.length, real.length, real);

            // ── STAGE: decrypt ─────────────────────────────────────────
            const final = real.length > 0 ? await this.deps.vault.decryptAllKeys(real) : real;
            this.traceKeyDrop(_dropRun, 'decrypt', real.length, final.length, final);

            // Post-bootstrap guard: if the registry already has keys and dexie
            // returned 0, this is the exact "N > 0 → 0" overwrite we must prevent.
            // Most likely a race during init where another service cleared dexie
            // before the snapshot was mirrored back.
            if (this.keys.length > 0 && final.length === 0) {
                LOGGER.warn(
                    'KeyRegistry',
                    'loadKeys() BLOCKED: registry has keys but dexie source is empty',
                    { current: this.keys.length, incoming: 0 },
                );
                if (import.meta.env.DEV)
                    LOGGER.debug('KeyRegistry', 'KEY_DROP_TRACE guard-blocked', {
                        run: _dropRun,
                        current: this.keys.length,
                        incoming: 0,
                    });
                return;
            }

            // ── STAGE: vault migration ─────────────────────────────────
            const { migrated, count: migratedCount } = this.migrateEncryptedKeys(final);
            if (migratedCount > 0) {
                LOGGER.warn(
                    'KeyRegistry',
                    `[VAULT_MIGRATION] Cleared ${migratedCount} encrypted key(s) from Dexie.`,
                );
                this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `[VAULT MIGRATION] ${migratedCount} old vault-encrypted key(s) cleared. Please re-add your API keys.`,
                    type: 'warning',
                });
            }

            // ── STAGE: assign ──────────────────────────────────────────
            const before = this.keys.length;
            this.setKeysInternal('loadKeys:dexie', migrated);
            this.traceKeyDrop(_dropRun, 'assign', before, this.keys.length, this.keys);
            if (import.meta.env.DEV)
                LOGGER.debug('KeyRegistry', 'final committed count (loadKeys)', {
                    count: this.keys.length,
                });
        } catch (e) {
            LOGGER.error('KeyRegistry', 'Failed to load API keys', { error: String(e) });
            if (import.meta.env.DEV)
                LOGGER.debug('KeyRegistry', 'KEY_DROP_TRACE EXCEPTION', {
                    run: _dropRun,
                    error: e instanceof Error ? e.message : String(e),
                });
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: 'Failed to load API keys, using defaults',
                type: 'error',
            });
            // Only fall back to defaults if registry is currently empty. If we
            // already have keys committed, prefer to keep them over a throw-time
            // reset to placeholder defaults.
            if (this.keys.length === 0) {
                const defaults = this.getDefaultKeys();
                this.setKeysInternal('loadKeys:defaults-fallback', defaults, { force: true });
                this.traceKeyDrop(_dropRun, 'assign-defaults', 0, this.keys.length, this.keys, {
                    error: true,
                });
            } else {
                LOGGER.warn(
                    'KeyRegistry',
                    'loadKeys() threw but registry non-empty — keeping existing state',
                );
                this.traceKeyDrop(
                    _dropRun,
                    'assign-keep-existing',
                    this.keys.length,
                    this.keys.length,
                    this.keys,
                    { error: true },
                );
            }
        } finally {
            this.loadingKeys = false;
        }
    }

    /**
     * KEY_DROP_TRACE helper — non-intrusive stage counter.
     * Emits a single console.log with stage, before/after counts, and a safe
     * 1–3 key sample (no `key` field — only id/provider/label/status).
     */
    private traceKeyDrop(
        _run: string,
        stage: string,
        beforeCount: number,
        afterCount: number,
        sample: ApiKey[] | undefined,
        extra?: Record<string, unknown>,
    ): void {
        if (!import.meta.env.DEV) return;
        const safeSample = (sample ?? []).slice(0, 3).map((k) => ({
            id: k.id,
            provider: k.provider,
            hasKey: !!k.key,
            keyLen: k.key?.length ?? 0,
            isEncrypted: k.isEncrypted,
        }));
        const arrow =
            beforeCount > 0 || afterCount > 0 ? `${beforeCount} -> ${afterCount}` : `${afterCount}`;
        const dropMarker = afterCount === 0 && beforeCount > 0 ? '  ❌ DROP HERE' : '';
        LOGGER.info('KeyRegistry', `[KEY_TRACE] ${stage}: ${arrow}${dropMarker}`, {
            sample: safeSample,
            ...extra,
        });
    }

    /**
     * Force-resync from getDexieDb().apiKeys. Used as a safety net when the registry
     * ends up empty but Dexie has data (e.g. race during init or stub keyStore).
     * Uses `force: true` because this is the explicit recovery path.
     */
    async forceResyncFromDexie(): Promise<number> {
        this.loadingKeys = false;
        const _dropRun = genId('forceResync');
        try {
            // DEXIE_IDENTITY: verify same instance.
            const verifiedInstance = verifyDexieInstance(
                'KeyRegistry.forceResyncFromDexie',
                getDexieDb(),
            );
            await logDexieIdentityWithCount('KeyRegistry.forceResyncFromDexie', verifiedInstance);

            const dexieKeys = await this.deps.keyStore.listKeys();
            this.traceKeyDrop(_dropRun, 'loadDexie', 0, dexieKeys.length, dexieKeys, {
                source: 'repo.getAll()',
            });
            if (dexieKeys.length === 0) {
                return 0;
            }
            const mapped = dexieKeys.map((k) => {
                const stats = k.stats || initStats();
                if (!stats.extended) stats.extended = initExtendedStats();
                return { ...k, history: k.history || [], stats };
            });
            this.traceKeyDrop(_dropRun, 'normalize.map', dexieKeys.length, mapped.length, mapped);
            const loaded = mapped.filter((k) => {
                if (!k || typeof k !== 'object') return false;
                if (!k.id) return false;
                if (!k.provider) return false;
                if (typeof k.key === 'string' && k.key.startsWith('placeholder-')) return false;
                return true;
            });
            this.traceKeyDrop(_dropRun, 'filterValid', mapped.length, loaded.length, loaded);
            const before = this.keys.length;
            this.setKeysInternal('forceResyncFromDexie', loaded, { force: true });
            this.traceKeyDrop(_dropRun, 'assign', before, this.keys.length, this.keys);
            if (import.meta.env.DEV)
                LOGGER.debug('KeyRegistry', 'force resync — committed count', {
                    count: this.keys.length,
                });
            return this.keys.length;
        } finally {
            if (import.meta.env.DEV)
                LOGGER.debug('KeyRegistry', 'KEY_DROP_TRACE end', {
                    run: _dropRun,
                    final: this.keys.length,
                });
        }
    }

    async saveKeys(): Promise<void> {
        const snapshot = [...this.keys];
        return new Promise<void>((resolve, reject) => {
            this.saveQueue = this.saveQueue
                .then(() => this.doSaveKeysWithSnapshot(snapshot))
                .then(resolve)
                .catch((err) => {
                    LOGGER.error('KeyRegistry', 'saveKeys failed, resetting queue:', {
                        error: err,
                    });
                    this.saveQueue = Promise.resolve();
                    reject(err);
                });
        });
    }

    private async doSaveKeysWithSnapshot(snapshot: ApiKey[]): Promise<void> {
        let keysToSave: ApiKey[];
        try {
            keysToSave = await this.deps.vault.encryptAllKeys(snapshot);
        } catch (e) {
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: 'Encryption failed — keys not saved',
                type: 'error',
            });
            throw e;
        }
        try {
            // Compute stale set BEFORE bulkPut to eliminate the async gap.
            // If we computed after bulkPut, a concurrent addKey could create
            // a new key that gets immediately deleted as "stale".
            const currentIds = new Set(snapshot.map((k) => k.id));
            let staleIds: string[] = [];
            if (
                typeof this.deps.keyStore?.listKeys === 'function' &&
                typeof this.deps.keyStore?.deleteKey === 'function'
            ) {
                const allStored = await this.deps.keyStore.listKeys();
                staleIds = allStored.filter((k) => !currentIds.has(k.id)).map((k) => k.id);
            }

            if (typeof this.deps.keyStore?.bulkPut === 'function') {
                await this.deps.keyStore.bulkPut(keysToSave);
            }
            // Delete stale records after bulkPut. If this fails, stale records
            // remain but the new snapshot is persisted — no data loss, only
            // garbage that will be cleaned on the next saveKeys().
            if (staleIds.length > 0) {
                await Promise.all(staleIds.map((id) => this.deps.keyStore.deleteKey(id)));
            }
        } catch (e) {
            LOGGER.error('KeyRegistry', 'IndexedDB save failed', { error: e });
            throw e;
        }
    }

    async addKey(data: Omit<ApiKey, 'id' | 'stats'>): Promise<ApiKey | null> {
        // HIGH-K3: Serialize via promise chain to prevent race conditions on duplicate check
        return (this.addKeyLock = this.addKeyLock.catch(() => null).then(() => this._addKey(data)));
    }

    private async _addKey(data: Omit<ApiKey, 'id' | 'stats'>): Promise<ApiKey | null> {
        // D-25: Validate non-empty, non-whitespace-only key before any processing
        const trimmedKey = data.key.trim();
        if (!trimmedKey) {
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: 'API key cannot be empty or whitespace.',
                type: 'error',
            });
            return null;
        }

        const fingerprint = await this.computeFingerprint(trimmedKey);
        const isDuplicate = this.keys.some((k) => k.fingerprint && k.fingerprint === fingerprint);
        if (isDuplicate) {
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Key already configured for provider ${data.provider}`,
                type: 'error',
            });
            return null;
        }

        // Stored in-memory as plaintext; encrypted at rest by vault.encryptAllKeys() on save.
        const storedKey = trimmedKey;

        // KD9-02: Second duplicate check after async gap prevents race condition
        const isDuplicateAfterAsync = this.keys.some(
            (k) => k.fingerprint && k.fingerprint === fingerprint,
        );
        if (isDuplicateAfterAsync) {
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Key already configured for provider ${data.provider}`,
                type: 'error',
            });
            return null;
        }
        const isEnc = false;
        const inferredTags: string[] = [];
        const labelLower = data.label.toLowerCase();
        if (/\b(prod|production)\b/.test(labelLower)) inferredTags.push('env:production');
        if (/\b(dev|development)\b/.test(labelLower)) inferredTags.push('env:development');
        if (/\b(staging|stage)\b/.test(labelLower)) inferredTags.push('env:staging');
        if (/\b(test|testing)\b/.test(labelLower)) inferredTags.push('env:test');
        if (/\bfree\b/i.test(labelLower)) inferredTags.push('tier:free');

        const now = Date.now();
        const newKey: ApiKey = {
            ...data,
            key: storedKey,
            isEncrypted: isEnc,
            fingerprint,
            tags: [...(data.tags || []), ...inferredTags],
            id: crypto.randomUUID(),
            stats: initStats(),
            history: [
                {
                    id: crypto.randomUUID(),
                    timestamp: now,
                    action: 'added',
                    detail: `Key added for ${data.provider}${data.group ? ` (${data.group})` : ''}${data.account ? ` [${data.account}]` : ''}`,
                },
            ],
        };

        const preAddSnapshot = [...this.keys];
        this.keys.push(newKey);
        this.#keyMap.set(newKey.id, this.keys.length - 1);
        this.invalidateSnapshot();
        try {
            await this.saveKeys();
        } catch (e) {
            // P0-11: rollback in-memory state on persist failure — prevent phantom key
            this.keys = preAddSnapshot;
            this.#keyMap = new Map(preAddSnapshot.map((k, i) => [k.id, i]));
            this.invalidateSnapshot();
            throw e;
        }
        return newKey;
    }

    async removeKey(id: string): Promise<void> {
        const preRemoveSnapshot = [...this.keys];
        const next = this.keys.filter((k) => k.id !== id);
        this.setKeysInternal('removeKey', next, { force: true });
        try {
            await this.saveKeys();
            // Delete from Dexie AFTER saveKeys succeeds to prevent ghost records.
            // saveKeys() upserts via bulkPut but doesn't delete stale keys if
            // stale computation was skipped. This direct delete is the final
            // guarantee that the key is gone from Dexie.
            await this.deps.keyStore
                .deleteKey(id)
                .catch((err) =>
                    LOGGER.error(
                        'KeyRegistry',
                        'deleteKey failed — stale key may remain in Dexie',
                        { id },
                        err,
                    ),
                );
        } catch (e) {
            // Rollback in-memory state on persist failure
            this.keys = preRemoveSnapshot;
            this.#keyMap = new Map(preRemoveSnapshot.map((k, i) => [k.id, i]));
            throw e;
        }
    }

    pushHistory(keyId: string, action: KeyHistoryEntry['action'], detail: string): void {
        this.modifyKey(keyId, (key) => {
            if (!key.history) key.history = [];
            key.history.push({
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                action,
                detail,
            });
            if (key.history.length > 100) key.history = key.history.slice(-99);
        });
    }

    replaceKeys(newKeys: ApiKey[]): void {
        this.setKeysInternal('replaceKeys', newKeys, { force: true });
    }

    /**
     * Wipe in-memory cache. Used by the canonical reset pipeline; the next
     * `loadKeys()` call re-hydrates from getDexieDb().apiKeys. This is the ONLY
     * way an empty overwrite is permitted.
     */
    clearKeys(): void {
        this.setKeysInternal('clearKeys', [], { force: true });
    }

    /**
     * Centralized mutation point for the keys array. ALL writes to this.keys
     * MUST go through this method.
     *
     * Invariants:
     *  1. Emits `[KEY_REGISTRY_OVERWRITE]` trace with source + count
     *  2. Rejects N > 0 → 0 transitions unless `opts.force === true`
     *  3. After bootstrap phase, refuses to replace non-empty state with empty
     *     data sourced from an unverified/empty storage layer
     *
     * The `force` flag is reserved for: `clearKeys` (explicit reset pipeline),
     * `replaceKeys` (vault unlock decrypt), and the bootstrap snapshot path.
     */
    private async computeFingerprint(key: string): Promise<string> {
        return computeFingerprintUtil(key);
    }

    private setKeysInternal(
        source: string,
        newKeys: ApiKey[],
        opts: { force?: boolean } = {},
    ): void {
        const prevCount = this.keys.length;
        const nextCount = Array.isArray(newKeys) ? newKeys.length : 0;
        const seq = ++_overwriteSeq;

        // Always emit a trace so silent overwrites are visible in DevTools.
        LOGGER.debug('KeyRegistry', 'Key registry overwrite', {
            source,
            seq,
            prevCount,
            nextCount,
            force: !!opts.force,
        });

        // Hard invariant: N > 0 → 0 is forbidden unless explicitly forced.
        if (prevCount > 0 && nextCount === 0 && !opts.force) {
            LOGGER.warn(
                'KeyRegistry',
                `[KEY_REGISTRY_OVERWRITE] BLOCKED: refusing to overwrite ${prevCount} keys with empty array. Source: ${source} — pass { force: true } if this is an explicit user reset.`,
            );
            return;
        }

        this.keys = Array.isArray(newKeys) ? [...newKeys] : [];
        this.#keyMap = new Map(this.keys.map((k, i) => [k.id, i]));
        this.invalidateSnapshot();
    }

    updateKey(id: string, updates: Partial<ApiKey>): void {
        const next = this.keys.map((k) => (k.id === id ? { ...k, ...updates } : k));
        this.setKeysInternal('updateKey', next);
    }

    modifyKey(id: string, fn: (key: ApiKey) => void): ApiKey | undefined {
        const idx = this.#keyMap.get(id);
        if (idx === undefined) return undefined;
        const clone = structuredClone(this.keys[idx]!);
        fn(clone);
        this.keys[idx] = clone!;
        this.setKeysInternal('modifyKey', [...this.keys]);
        return clone;
    }

    async importKeys(jsonData: string): Promise<number> {
        let result: unknown[];
        try {
            result = JSON.parse(jsonData);
            if (!Array.isArray(result)) throw new Error('Not an array');
            for (const entry of result) {
                if (
                    typeof entry !== 'object' ||
                    entry === null ||
                    typeof (entry as Record<string, unknown>).key !== 'string' ||
                    typeof (entry as Record<string, unknown>).provider !== 'string'
                ) {
                    throw new Error('Each entry must have string `key` and `provider` fields');
                }
            }
        } catch (e) {
            if (e instanceof Error) throw e;
            throw new Error('Invalid JSON data', { cause: e });
        }
        const { newKeys, count } = buildImportKeys(result, this.keys);
        if (count > 0) {
            this.setKeysInternal('importKeys', newKeys);
            await this.saveKeys();
        }
        return count;
    }

    async exportKeys(encryptFn: (plaintext: string) => Promise<string | null>): Promise<string> {
        return buildExportData(this.keys, encryptFn);
    }

    async addNote(
        keyId: string,
        text: string,
        type: KeyNote['type'] = 'admin',
        author?: string,
    ): Promise<KeyNote> {
        const note: KeyNote = {
            id: crypto.randomUUID(),
            keyId,
            text,
            timestamp: Date.now(),
            type,
            author,
        };
        this.modifyKey(keyId, (key) => {
            key.notes = [...(key.notes || []), note];
        });
        await this.saveKeys();
        return note;
    }

    async removeNote(keyId: string, noteId: string): Promise<void> {
        this.modifyKey(keyId, (key) => {
            if (key.notes) {
                key.notes = key.notes.filter((n) => n.id !== noteId);
            }
        });
        await this.saveKeys();
    }

    getStats() {
        return getStatsUtil(this.keys);
    }

    getTotalTokens(): number {
        return this.keys.reduce((sum, k) => sum + (k.stats?.totalTokens || 0), 0);
    }

    getTotalRequests(): number {
        return this.keys.reduce(
            (sum, k) => sum + (k.stats?.successCount || 0) + (k.stats?.errorCount || 0),
            0,
        );
    }

    getUniqueProviders(): string[] {
        return [...new Set(this.keys.map((k) => k.provider))];
    }

    async replaceAllKeys(keys: ApiKey[]): Promise<void> {
        this.keys = keys;
        this.#keyMap.clear();
        for (let i = 0; i < keys.length; i++) {
            this.#keyMap.set(keys[i]!.id, i);
        }
        this.#frozenSnapshot = null;
        this.setKeysInternal('replaceAll', [...this.keys]);
        await this.saveKeys();
    }
}
