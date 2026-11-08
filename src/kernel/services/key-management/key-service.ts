import type { ApiKey, KeyHistoryEntry, ProviderAlert, KeyNote } from '../../types/metrics-types';
import { EVENTS } from '../../events/event-names';
import { BucketStorageAdapter } from '../../storage-adapter-instance';
import { debounce } from '../../../utils/debounce';
import type { IKeyVaultService } from '../../contracts/key-vault';
import type { IHealthCheckService } from '../../contracts/health-check';
import type { IKeyAnalyticsService } from '../../contracts/key-analytics';
import type { PoolStrategy } from '../../contracts/pool-selector';
import type { IGroupManager } from '../../contracts/group-manager';
import type { IKeyRotationManager } from '../../contracts/key-rotation';
import { ensureExtendedStats, buildRestoreKeys } from './key-registry-utils';
import { CONFIG } from '../config-registry';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('KeyService');

import type { FreeTierLimit } from './key-types';

import { withTransaction } from '../../utils/with-transaction';

import type { KeyVault } from './key-vault';
import type { KeyMetricsHandler } from './key-metrics-handler';
import type { KeyStatusManager } from './key-status';
import type { KeyModels } from './key-models';
import type { KeyRegistry } from './key-registry';
import type { KeyHealth } from './key-health';
import type { KeyQuotas } from './key-quotas';
import type { KeyAnalytics } from './key-analytics';
import type { KeyFingerprints } from './key-fingerprints';
import type { KeyAlerts } from './key-alerts';
import type { KeyLifecycle } from './key-lifecycle';
import type { KeyPoolSelector } from './key-pool-selector';
import type { KeyDiagnostics } from './key-diagnostics';
import { createKeyServiceSubsystems, createKeyPoolSelector } from './key-service-subsystems';
import type { KeyServiceDeps } from './key-service-deps';
import { DEFAULT_FREE_TIER_LIMITS, STORAGE_KEY } from './key-service-constants';

export const FREE_TIER_LIMITS = DEFAULT_FREE_TIER_LIMITS;

export type { KeyServiceDeps };

export class KeyService implements IKeyRotationManager {
    private vault: KeyVault;
    private registry: KeyRegistry;
    private health: KeyHealth;
    private quotas: KeyQuotas;
    private analytics: KeyAnalytics;
    private fingerprints: KeyFingerprints;
    private alerts: KeyAlerts;
    private lifecycle: KeyLifecycle;
    private poolSelector: KeyPoolSelector;
    private groupManager?: IGroupManager;
    private diagnostics: KeyDiagnostics;
    private metricsHandler: KeyMetricsHandler;
    private statusManager: KeyStatusManager;
    private modelsManager: KeyModels;

    readonly vaultService: IKeyVaultService;
    readonly healthCheckService: IHealthCheckService;
    readonly analyticsService: IKeyAnalyticsService;

    private freeTierLimits: Record<string, FreeTierLimit> = { ...DEFAULT_FREE_TIER_LIMITS };
    private unsubs: Array<() => void> = [];
    private _timers: Set<ReturnType<typeof setTimeout>> = new Set();
    private _initialized = false;
    private deps: KeyServiceDeps;
    private _globalSLAMode: string = 'BALANCED';
    private _latencyThreshold: number = 1500;

    get globalSLAMode(): string {
        return this._globalSLAMode;
    }
    get latencyThreshold(): number {
        return this._latencyThreshold;
    }

    getRoutingPolicy(): { globalSLAMode: string; latencyThreshold: number } {
        return { globalSLAMode: this._globalSLAMode, latencyThreshold: this._latencyThreshold };
    }

    constructor(deps: KeyServiceDeps) {
        this.deps = deps;

        const subs = createKeyServiceSubsystems(deps, {
            notify: () => this.notify(),
            saveConfig: () => this.saveConfig(),
            recordUsage: (id, latency, tokens, model, extra) =>
                this.recordUsage(id, latency, tokens, model, extra),
            updateKeyStatus: (id, status, latency) => this.updateKeyStatus(id, status, latency),
            addTimer: (timer) => this._timers.add(timer),
        });

        this.freeTierLimits = subs.freeTierLimits;
        this.vault = subs.vault;
        this.registry = subs.registry;
        this.alerts = subs.alerts;
        this.quotas = subs.quotas;
        this.health = subs.health;
        this.analytics = subs.analytics;
        this.fingerprints = subs.fingerprints;
        this.lifecycle = subs.lifecycle;
        this.poolSelector = subs.poolSelector;
        this.diagnostics = subs.diagnostics;
        this.metricsHandler = subs.metricsHandler;
        this.statusManager = subs.statusManager;
        this.modelsManager = subs.modelsManager;

        this.vaultService = this.vault;
        this.healthCheckService = this.health;
        this.analyticsService = this.analytics;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        await this.loadConfig();
        await this.unlockVault();
        await this.registry.loadKeys();
        const keysAfterLoad = this.registry.getKeys();
        if (import.meta.env.DEV)
            LOGGER.debug('KeyService', 'KeyService final keys count', {
                count: keysAfterLoad.length,
                providers: [...new Set(keysAfterLoad.map((k) => k.provider))],
                activeCount: keysAfterLoad.filter((k) => k.status === 'active').length,
            });
        this.notify();

        await this.lifecycle.init();
        this.lifecycle.startAutoRecovery();

        // NOTE: beforeunload cannot synchronously flush IndexedDB writes.
        // The `await` in groupManager.deleteKey() + `throw e` in key-registry
        // ensure that if the caller awaits the result, the Dexie write completes
        // before the function returns. The only vulnerability window is during
        // the async gap between in-memory mutation and Dexie write completion,
        // which is bounded by the event loop microtask queue.
        // For HMR scenarios, see main.tsx __cleanupKeyStore.

        this.registry.setupListeners({
            addKey: (data) => this.addKey(data),
            compromiseByFingerprint: (fingerprint, source) => {
                // CRIT-K5: Exact match only — id or SHA-256 fingerprint, no substring
                const matches = this.registry
                    .getKeys()
                    .filter((k) => k.id === fingerprint || k.fingerprint === fingerprint);
                for (const key of matches) {
                    this.compromiseKey(key.id, source);
                }
            },
            updateMetricsFromResponse: (res) => this.metricsHandler.handleMetricsFromResponse(res),
        });

        this.unsubs.push(
            this.deps.eventBus.onSafe<{ id: string }>(EVENTS.KEY_REMOVED, async (data) => {
                try {
                    const { getDexieDb } = await import('../database-service');
                    const db = getDexieDb();
                    const notes = await db.notes.where('keyId').equals(data.id).toArray();
                    if (notes.length > 0) {
                        await db.notes.bulkDelete(notes.map((n) => n.id!));
                    }
                } catch {
                    /* note cleanup is best-effort */
                }
            }),
        );

        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.CHECK_HEALTH, (id: unknown) => {
                if (typeof id === 'string') {
                    this.health.checkHealth(id);
                }
            }),
        );

        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.CHECK_ALL_HEALTH, () => {
                this.health.checkAllHealth();
            }),
        );
    }

    destroy() {
        this._initialized = false;
        this._timers.forEach(clearTimeout);
        this._timers.clear();
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        this.registry.destroy();
        this.lifecycle.destroy();
        this.poolSelector.destroy();
    }

    async reload(): Promise<void> {
        await this.registry.reload();
        this.notify();
    }

    async loadKeys(): Promise<void> {
        await this.registry.loadKeys();
        this.notify();
    }

    /**
     * Wipe the in-memory KeyRegistry cache. Used by the canonical reset
     * pipeline; the next reload() re-hydrates from dexieDb.apiKeys.
     */
    clearKeys(): void {
        this.registry.clearKeys();
    }

    /**
     * Force-resync from dexieDb.apiKeys. Safety net for when the registry
     * ends up empty despite Dexie holding data (race, stub keyStore, etc.).
     */
    async forceResyncFromDexie(): Promise<number> {
        const restored = await this.registry.forceResyncFromDexie();
        if (restored > 0) {
            this.notify();
            this.deps.eventBus.emit(EVENTS.KEYS_LOADED, this.registry.getKeys());
        }
        return restored;
    }

    // -- Vault (SPEC_01) -----------------------------------------------

    /**
     * Разблокировка vault при старте.
     *
     * SPEC_01: больше НЕ используем deviceKey (он хранился в localStorage рядом
     * с данными и делал шифрование косметическим). Вместо этого:
     *  - если vault уже создан (есть верификатор пароля) — он остаётся
     *    заблокированным, пока пользователь не введёт passphrase;
     *  - если vault ещё не создан — данные остаются в открытом виде
     *    (однопользовательский режим) до явного создания passphrase.
     */
    private async unlockVault(): Promise<void> {
        if (!this.vault.isLocked()) return;
        if (this.vault.hasVault()) {
            LOGGER.info('KeyService', 'vault locked — awaiting passphrase');
            return;
        }
        // Первый вход: vault ещё не создан — остаёмся в plaintext-режиме
        // до тех пор, пока пользователь не создаст vault через createVault().
    }

    async createVault(passphrase: string): Promise<boolean> {
        const ok = await this.vault.createVault(passphrase);
        if (ok) {
            // Создание оставляет vault locked; разблокируем перед миграцией ключей.
            await this.unlockVaultWithPassphrase(passphrase);
            // Миграция (SPEC_01): после создания vault перешифровать существующие
            // plaintext-ключи (registry.saveKeys → vault.encryptAllKeys).
            try {
                await this.registry.saveKeys();
            } catch (e) {
                rootLogger.warn('KeyService', 'vault created but key re-encrypt failed', {
                    error: e,
                });
            }
            this.deps.eventBus.emit(EVENTS.KEY_VAULT_CREATED, {});
            this.notify();
        }
        return ok;
    }

    async unlockVaultWithPassphrase(passphrase: string): Promise<boolean> {
        const ok = await this.vault.unlockWithPassphrase(passphrase);
        if (ok) {
            this.deps.eventBus.emit(EVENTS.KEY_VAULT_UNLOCKED, {});
            this.notify();
        }
        return ok;
    }

    lockVault(): void {
        if (this.vault.isLocked()) return;
        this.vault.lock();
        this.deps.eventBus.emit(EVENTS.KEY_VAULT_LOCKED, {});
        this.notify();
    }

    hasVault(): boolean {
        return this.vault.hasVault();
    }

    isVaultLocked(): boolean {
        return this.vault.isLocked();
    }

    async verifyPassphrase(passphrase: string): Promise<boolean> {
        return this.vault.verifyPassphrase(passphrase);
    }

    // -- Config Persistence ---------------------------------------------

    private async loadConfig() {
        try {
            const saved =
                await this.deps.database.getKv<Record<string, FreeTierLimit>>(
                    'global_free_tier_limits',
                );
            if (saved) this.freeTierLimits = saved;
            this.quotas.syncFreeTierLimits(this.freeTierLimits);
            const savedStrategies =
                await this.deps.database.getKv<Record<string, PoolStrategy>>('pool_strategies');
            if (savedStrategies) this.poolSelector.setStrategies(savedStrategies);
            const savedSLA = await this.deps.database.getKv<string>('global_sla_mode');
            if (savedSLA) this._globalSLAMode = savedSLA;
            const savedLat = await this.deps.database.getKv<number>('latency_threshold');
            if (savedLat) this._latencyThreshold = savedLat;
            // KM-17: Recreate poolSelector with fresh freeTierLimits reference
            this.poolSelector = this.createPoolSelector();
        } catch (e) {
            rootLogger.warn('KeyService', '[KeyService] Failed to load global limits', {
                error: e,
            });
        }
    }

    private async saveConfig() {
        try {
            const oldFreeTier = await this.deps.database.getKv('global_free_tier_limits');
            const oldStrategies = await this.deps.database.getKv('pool_strategies');
            const oldSlaMode = await this.deps.database.getKv('global_sla_mode');
            const oldLatency = await this.deps.database.getKv('latency_threshold');

            await withTransaction('KeyService.saveConfig', async (tx) => {
                tx.deferPersist(
                    () =>
                        this.deps.database.batchSetKv({
                            global_free_tier_limits: this.freeTierLimits,
                            pool_strategies: this.poolSelector.getStrategies(),
                            global_sla_mode: this._globalSLAMode,
                            latency_threshold: this._latencyThreshold,
                        }),
                    () =>
                        this.deps.database.batchSetKv({
                            global_free_tier_limits: oldFreeTier,
                            pool_strategies: oldStrategies,
                            global_sla_mode: oldSlaMode,
                            latency_threshold: oldLatency,
                        }),
                );
            });
        } catch (e) {
            rootLogger.error('KeyService', '[KeyService] Failed to save global limits', {
                error: e,
            });
        }
    }

    // -- Notification ---------------------------------------------------

    private emitKeyUpdate = () => {
        const keys = [...this.registry.getKeys()];
        this.deps.eventBus.emit(EVENTS.KEY_UPDATED, keys);
        this.deps.eventBus.emit(EVENTS.KEYS_LOADED, keys);
    };

    // C-07: leading=true fires first update immediately, coalesces rapid subsequent calls
    private notify = debounce(this.emitKeyUpdate, 100, true);

    // -- Vault (removed) ------------------------------------------------

    // -- Registry -------------------------------------------------------

    getKeys() {
        return this.registry.getKeys();
    }
    getKey(id: string) {
        return this.registry.getKey(id);
    }
    getKeysByProvider(provider: string) {
        return this.registry.getKeysByProvider(provider);
    }
    getActiveKeys() {
        return this.registry.getActiveKeys();
    }
    getPoolKeys(provider: string) {
        return this.registry.getPoolKeys(provider);
    }
    getDefaultKeys() {
        return this.registry.getDefaultKeys();
    }
    getStats() {
        return this.registry.getStats();
    }
    getTotalTokens() {
        return this.registry.getTotalTokens();
    }
    getTotalRequests() {
        return this.registry.getTotalRequests();
    }
    getUniqueProviders() {
        return this.registry.getUniqueProviders();
    }

    async addKey(data: Omit<ApiKey, 'id' | 'stats'>) {
        const newKey = await this.registry.addKey(data);
        if (!newKey) return undefined;
        this.quotas.applyFreeTierQuota(newKey);
        await this.registry.saveKeys();
        this.notify();
        this.deps.eventBus.emitOnce(EVENTS.KEY_ADDED, newKey.id, newKey);
        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Key for ${data.provider} added`,
            type: 'success',
        });
        const t = setTimeout(() => {
            this.deps.eventBus.emit(EVENTS.CHECK_HEALTH, newKey.id);
        }, 1000);
        this._timers.add(t);
        return newKey;
    }

    async removeKey(id: string) {
        // P-MED-7: capture provider first — after removal we drop cached
        // adapter/circuit state only when no keys remain for it, so deleted
        // keys stop accumulating stale circuit-breaker entries while live
        // providers keep theirs.
        const provider = this.registry.getKey(id)?.provider;
        try {
            await this.registry.removeKey(id);
        } finally {
            // Always cleanup health/lifecycle even if registry fails,
            // to prevent ghost state from accumulating.
            try {
                this.health.cleanupKey(id);
            } catch {
                /* best-effort */
            }
            try {
                this.lifecycle.cleanupKey(id);
            } catch {
                /* best-effort */
            }
            try {
                if (
                    provider &&
                    !this.registry.getKeys().some((k) => k.provider === provider)
                ) {
                    this.deps.providerAdapterRegistry?.invalidateCache(provider);
                }
            } catch {
                /* best-effort */
            }
        }
        this.notify();
        this.deps.eventBus.emitOnce(EVENTS.KEY_REMOVED, id, { id });
        this.deps.eventBus.emit(EVENTS.NOTIFICATION, { message: 'Key removed', type: 'info' });
    }

    pushHistory(keyId: string, action: KeyHistoryEntry['action'], detail: string): void {
        this.registry.pushHistory(keyId, action, detail);
    }

    async updateKey(id: string, data: Partial<ApiKey>): Promise<void> {
        this.registry.updateKey(id, data);
        await this.registry.saveKeys();
        this.notify();
    }

    async importKeys(jsonData: string): Promise<number> {
        const count = await this.registry.importKeys(jsonData);
        await this.registry.saveKeys();
        this.notify();
        return count;
    }

    async exportKeys(): Promise<string> {
        return this.registry.exportKeys((plaintext) => this.vault.encryptKey(plaintext));
    }

    getAllKeys(): ApiKey[] {
        return this.registry.getKeys();
    }

    async restoreKeys(
        keysData: Array<{
            id: string;
            provider: string;
            key?: string;
            model?: string;
            status?: string;
            label?: string;
        }>,
    ): Promise<void> {
        const entries = buildRestoreKeys(keysData);
        await this.registry.replaceAllKeys(entries);
        this.notify();
    }

    async addNote(keyId: string, text: string, type: KeyNote['type'] = 'admin', author?: string) {
        return this.registry.addNote(keyId, text, type, author);
    }

    async removeNote(keyId: string, noteId: string) {
        await this.registry.removeNote(keyId, noteId);
        this.notify();
    }

    async loadNotes(keyId: string) {
        try {
            const saved = await this.deps.keyStore.where('id', keyId);
            if (saved && 'notes' in saved && Array.isArray((saved as { notes?: unknown }).notes)) {
                const notes = (saved as { notes: KeyNote[] }).notes;
                this.registry.modifyKey(keyId, (key) => {
                    key.notes = notes;
                });
            }
        } catch (e) {
            rootLogger.warn('KeyService', `[KeyService] Failed to load notes for key ${keyId}`, {
                error: e,
            });
        }
        this.notify();
    }

    async refreshModels(id: string) {
        return this.modelsManager.refreshModels(id);
    }

    // -- Health ---------------------------------------------------------

    updateKeyStatus(id: string, status: ApiKey['status'], latency?: number) {
        this.statusManager.updateKeyStatus(id, status, latency);
    }

    updateAvailableModels(id: string, models: string[]) {
        this.statusManager.updateAvailableModels(id, models);
    }

    async checkHealth(keyId?: string) {
        if (keyId) return this.health.checkHealth(keyId);
        const first = this.registry.getKeys()[0];
        if (first) return this.health.checkHealth(first.id);
        return { id: 'none', provider: 'none', status: 'error', latency: 0 };
    }

    async checkAllHealth() {
        return this.health.checkAllHealth();
    }

    async toggleKeyStatus(id: string) {
        return this.statusManager.toggleKeyStatus(id);
    }

    async enableAllKeys() {
        return this.statusManager.enableAllKeys();
    }

    async disableAllKeys() {
        return this.statusManager.disableAllKeys();
    }

    quarantineKey(idOrFingerprint: string, source: string = 'manual'): boolean {
        return this.statusManager.quarantineKey(idOrFingerprint, source);
    }

    compromiseKey(id: string, source: string = 'webhook'): boolean {
        return this.statusManager.compromiseKey(id, source);
    }

    // -- Quotas ---------------------------------------------------------

    getFreeTierLimits() {
        return this.quotas.getFreeTierLimits();
    }

    async setFreeTierLimit(provider: string, limit: FreeTierLimit) {
        this.freeTierLimits[provider.toLowerCase()] = limit;
        this.quotas.setFreeTierLimit(provider, limit);
        await this.saveConfig();
    }

    canUseKey(id: string): { can: boolean; reason?: string } {
        const key = this.registry.getKey(id);
        if (!key) return { can: false, reason: 'Key not found' };
        return this.quotas.canUseKey(key);
    }

    isKeyInBackoff(keyId: string): { backoff: boolean; remainingMs: number } {
        const remaining = this.health.getBackoffRemaining(keyId);
        if (remaining === null || remaining <= 0) return { backoff: false, remainingMs: 0 };
        return { backoff: true, remainingMs: remaining };
    }

    isProviderCircuitOpen(provider: string): boolean {
        return (
            this.deps.providerAdapterRegistry?.getProviderRuntimeStatus(provider).circuitOpen ??
            false
        );
    }

    isProviderRateLimited(provider: string): boolean {
        return (
            this.deps.providerAdapterRegistry?.getProviderRuntimeStatus(provider).rateLimited ??
            false
        );
    }

    // -- Pool Selection -------------------------------------------------

    getPoolStrategy(provider: string): PoolStrategy {
        return this.poolSelector.getPoolStrategy(provider);
    }

    async setPoolStrategy(provider: string, strategy: PoolStrategy) {
        try {
            await this.poolSelector.setPoolStrategy(provider, strategy);
        } catch (e) {
            rootLogger.error('KeyService', '[KeyService] Failed to set pool strategy', {
                error: e,
            });
        }
    }

    attachGroupManager(groupManager: IGroupManager): void {
        this.groupManager = groupManager;
        this.poolSelector = this.createPoolSelector();
        // STATE-C4: Start KEY_REMOVED listener so pool selector cleans up stale entries.
        this.poolSelector.start();
    }

    private createPoolSelector(): KeyPoolSelector {
        return createKeyPoolSelector({
            deps: this.deps,
            registry: this.registry,
            quotas: this.quotas,
            freeTierLimits: this.freeTierLimits,
            groupManager: this.groupManager,
            saveConfig: () => this.saveConfig(),
        });
    }

    selectFromPool(provider: string, strategy?: PoolStrategy): ApiKey | null {
        return this.poolSelector.selectFromPool(provider, strategy);
    }

    selectWithBurst(provider: string, strategy?: PoolStrategy): ApiKey | null {
        return this.poolSelector.selectWithBurst(provider, strategy);
    }

    getBurstCapacity(provider: string): {
        totalQuota: number;
        usedQuota: number;
        availableBurst: number;
        keys: number;
    } {
        return this.poolSelector.getBurstCapacity(provider);
    }

    getQuotaShare(provider: string): {
        total: number;
        used: number;
        available: number;
        sharedPool: number;
    } {
        return this.poolSelector.getQuotaShare(provider);
    }

    getPoolStatus(provider: string): {
        total: number;
        active: number;
        used: number;
        limit: number;
    } {
        return this.poolSelector.getPoolStatus(provider);
    }

    getPoolKeyDistribution(provider: string): Array<{
        id: string;
        label: string;
        used: number;
        limit: number;
        pct: number;
        status: string;
    }> {
        return this.poolSelector.getPoolKeyDistribution(provider);
    }

    // -- Analytics ------------------------------------------------------

    recordUsage(
        keyIdOrProvider: string,
        latency: number,
        tokens: number = 0,
        model?: string,
        extra?: Record<string, unknown>,
    ) {
        const keyEntry = this.registry
            .getKeys()
            .find(
                (k) =>
                    (k.id === keyIdOrProvider ||
                        k.provider.toLowerCase() === keyIdOrProvider.toLowerCase()) &&
                    k.status === 'active',
            );
        if (!keyEntry) return;
        const keyId = keyEntry.id;

        this.registry.modifyKey(keyId, (key) => {
            ensureExtendedStats(key);
            this.analytics.recordUsage(key, latency, tokens, model, extra);
            this.quotas.checkQuotas(key);
            if (extra?.failed) {
                if (!key.history) key.history = [];
                key.history.push({
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    action: 'error',
                    detail: `${extra.error || 'Unknown error'} (${model || 'auto'})`,
                });
                if (key.history.length > 100) key.history = key.history.slice(-99);
                this.lifecycle.onError(keyId);
            } else {
                this.lifecycle.onSuccess(keyId);
            }
        });
        this.registry.saveKeys();
        this.notify();
    }

    incrementConcurrency(id: string) {
        this.registry.modifyKey(id, (key) => {
            if (key.stats?.extended) {
                key.stats.extended.currentConcurrentRequests++;
            }
        });
        this.notify();
    }

    decrementConcurrency(id: string) {
        this.registry.modifyKey(id, (key) => {
            if (key.stats?.extended) {
                key.stats.extended.currentConcurrentRequests = Math.max(
                    0,
                    key.stats.extended.currentConcurrentRequests - 1,
                );
            }
        });
        this.notify();
    }

    async recalculateAllReputations() {
        const keys = this.registry.getKeys();
        for (const k of keys) {
            this.registry.modifyKey(k.id, (key) => {
                this.analytics.calculateReputation(key);
            });
        }
        await this.registry.saveKeys();
        this.notify();
    }

    async resetKeyStats(keyId: string) {
        let label = '';
        this.registry.modifyKey(keyId, (key) => {
            label = key.label || '';
            this.analytics.resetKeyStats(key);
        });
        if (!label) return;
        await this.registry.saveKeys();
        this.notify();
        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Statistics reset for ${label}`,
            type: 'info',
        });
    }

    // -- Alerts ---------------------------------------------------------

    getAlerts(): ProviderAlert[] {
        return this.alerts.getAlerts(this.registry.getKeys());
    }

    resolveAlert(alertId: string) {
        this.alerts.resolveAlert(this.registry.getKeys(), alertId);
        this.registry.saveKeys();
    }

    getAlertSummary() {
        return this.alerts.getAlertSummary(this.registry.getKeys());
    }

    // -- Fingerprints ---------------------------------------------------

    async fingerprintKey(apiKey: string): Promise<string> {
        return this.fingerprints.fingerprintKey(apiKey);
    }

    async findDuplicateFingerprints(keys: string[]): Promise<Map<string, string[]>> {
        return this.fingerprints.findDuplicateFingerprints(this.registry.getKeys(), keys);
    }

    detectProvider(apiKey: string): string | null {
        return this.fingerprints.detectProvider(apiKey);
    }

    async verifyKey(provider: string, apiKey: string): Promise<boolean> {
        return this.fingerprints.verifyKey(provider, apiKey);
    }

    extractAccountId(provider: string, apiKey: string): string {
        return this.fingerprints.extractAccountId(provider, apiKey);
    }

    extractAccountLabel(provider: string, apiKey: string): string {
        return this.fingerprints.extractAccountLabel(provider, apiKey);
    }

    suggestModel(provider: string): string | null {
        return this.fingerprints.suggestModel(provider);
    }

    // -- Lifecycle / SLA / Rotation -------------------------------------

    setKeyTTL(id: string, ttlHours: number, autoRotate = false) {
        this.lifecycle.setKeyTTL(id, ttlHours, autoRotate);
    }

    clearKeyTTL(id: string) {
        this.lifecycle.clearKeyTTL(id);
    }

    async requestKeyRotation(id: string): Promise<boolean> {
        return this.lifecycle.requestKeyRotation(id);
    }

    async setGlobalSLA(mode: string) {
        const keys = this.registry.getKeys();
        for (const k of keys) {
            this.registry.modifyKey(k.id, (key) => {
                if (!key.stats?.extended) return;
                key.stats.extended.activeSLA = mode as NonNullable<
                    ApiKey['stats']['extended']
                >['activeSLA'];
                const profile = CONFIG.keys.slaProfiles[mode] ?? CONFIG.keys.slaProfiles.DEFAULT;
                key.stats.extended.rules!.timeoutMs = profile!.timeoutMs;
                key.stats.extended.rules!.slaThresholds.latencyP95 = profile!.latencyP95;
            });
        }
        this._globalSLAMode = mode;
        await this.saveConfig();
        await this.registry.saveKeys();
        this.notify();
        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Global SLA set to ${mode}`,
            type: 'success',
        });
    }

    async setSLA(id: string, mode: string) {
        let provider = '';
        this.registry.modifyKey(id, (key) => {
            provider = key.provider;
            if (!key.stats?.extended) return;
            key.stats.extended.activeSLA = mode as NonNullable<
                ApiKey['stats']['extended']
            >['activeSLA'];
            const profile = CONFIG.keys.slaProfiles[mode] ?? CONFIG.keys.slaProfiles.DEFAULT;
            key.stats.extended.rules!.timeoutMs = profile!.timeoutMs;
            key.stats.extended.rules!.slaThresholds.latencyP95 = profile!.latencyP95;
        });
        if (!provider) return;
        await this.registry.saveKeys();
        this.notify();
        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            message: `${provider} SLA set to ${mode}`,
            type: 'info',
        });
    }

    // -- Misc -----------------------------------------------------------

    transitionState(id: string, newState: string) {
        this.statusManager.transitionState(id, newState);
    }

    resetStats(keyId: string) {
        return this.resetKeyStats(keyId);
    }

    async setLatencyThreshold(threshold: number) {
        this._latencyThreshold = threshold;
        await this.saveConfig();
        await this.deps.database.setKv('latency_threshold', threshold);
        this.deps.eventBus.emit(EVENTS.SETTINGS_LATENCY_THRESHOLD, { threshold });
    }

    async clearAllData(): Promise<void> {
        try {
            const { getDexieDb } = await import('../database-service');
            const db = getDexieDb();
            await db.transaction('rw', db.tables, async () => {
                await Promise.all([
                    db.keyValue.clear(),
                    db.apiKeys.clear(),
                    db.memories.clear(),
                    db.sessions.clear(),
                    db.roles.clear(),
                    db.cognitiveTraces.clear(),
                    db.traces.clear(),
                    db.skills.clear(),
                    db.connectors.clear(),
                    db.debateSessions.clear(),
                    db.debateVerdicts.clear(),
                    db.debateTimeline.clear(),
                    db.debateOverrides.clear(),
                    db.sessionLinks.clear(),
                    db.eventLog.clear(),
                    db.notes.clear(),
                ]);
            });
        } catch (e) {
            LOGGER.error('KeyService', 'clearAllData: Dexie clear failed', { error: e });
        }
        BucketStorageAdapter.removeItem(STORAGE_KEY);
        this.deps.eventBus.emit(EVENTS.CLEAR_DATA, undefined);
    }

    async handleProviderError(keyId: string, error: string) {
        return this.statusManager.handleProviderError(keyId, error);
    }

    // -- Diagnostics -----------------------------------------------------

    async getProviderIntrospection(
        provider: string,
        apiKey: string,
    ): Promise<Record<string, unknown>> {
        return this.diagnostics.getProviderIntrospection(provider, apiKey);
    }

    async runBenchmark(id: string) {
        return this.diagnostics.runBenchmark(id);
    }

    async runAdvisor(id: string) {
        return this.diagnostics.runAdvisor(id);
    }

    compromiseByFingerprint(fingerprint: string, source: string = 'webhook'): boolean {
        const matches = this.registry
            .getKeys()
            .filter((k) => k.id === fingerprint || k.fingerprint === fingerprint);
        if (matches.length === 0) return false;
        for (const key of matches) {
            this.compromiseKey(key.id, source);
        }
        return true;
    }

    quarantineByFingerprint(fingerprint: string, source: string = 'manual'): boolean {
        const matches = this.registry
            .getKeys()
            .filter((k) => k.id === fingerprint || k.fingerprint === fingerprint);
        if (matches.length === 0) return false;
        for (const key of matches) {
            this.quarantineKey(key.id, source);
        }
        return true;
    }
}
