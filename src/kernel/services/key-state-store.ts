import type { IEventBus } from '../types/interfaces';
import type { ILifecycle } from '../contracts/lifecycle';
import type {
    IKeyStateStore,
    KeyState,
    KeyStatus,
    KeyStateEvent,
    KeyProbeSnapshot,
    KeyHealthSnapshot,
    KeyQuotaSnapshot,
} from '../contracts/key-state';
import { RECOVERY_RATE_PER_MIN } from '../contracts/key-state';
import type { ProbeResult } from '../contracts/probe';
import type { ApiKey } from '../contracts/storage/storage-layer';
import { EVENTS } from '../events/event-names';
import type { QuotaExceededPayload } from '../events/provider-events';
import { rootLogger } from './logger-service';
const LOGGER = rootLogger.child('KeyStateStore');

const DEFAULT_HEALTH: KeyHealthSnapshot = { errorRate: 0, successRate: 1, consecutiveErrors: 0 };
const DEFAULT_QUOTA: KeyQuotaSnapshot = {
    usedTokens: 0,
    limitTokens: 0,
    usedRequests: 0,
    limitRequests: 0,
};

/**
 * STATE-M9: Authoritative key state store for routing decisions and UI display.
 * Single source of truth for key state — ingests probe results, health checks,
 * and events from the EventBus. Provides getForRouting() for router decisions
 * and getAll() for UI consumption.
 */
export class KeyStateStore implements IKeyStateStore, ILifecycle {
    private states = new Map<string, KeyState>();
    private listeners = new Set<
        (event: { type: KeyStateEvent; id: string; state?: KeyState }) => void
    >();
    private eventBus?: IEventBus;
    private unsubs: Array<() => void> = [];
    private database?: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    private persistPromise: Promise<void> | null = null;
    private _persistDirty = false;
    private _started = false;
    private _pendingSeedIds: string[] | null = null;

    constructor(
        eventBus?: IEventBus,
        database?: {
            getKv: <T>(id: string) => Promise<T | null>;
            setKv: <T>(id: string, value: T) => Promise<void>;
        },
        private _lazyGetKeyIds?: () => string[],
    ) {
        this.eventBus = eventBus;
        this.database = database;
    }

    async init(): Promise<void> {}

    private _persistedLoaded = false;

    private async loadPersisted(): Promise<void> {
        if (!this.database) return;
        const doLoad = async (): Promise<boolean> => {
            try {
                const data =
                    await this.database!.getKv<Array<{ id: string; state: KeyState }>>(
                        'keystore_store_states',
                    );
                if (data) {
                    for (const { id, state } of data) {
                        if (!this.states.has(id)) {
                            this.states.set(id, state);
                        }
                    }
                }
                return true;
            } catch (e) {
                rootLogger.warn('KeyStateStore', 'loadPersisted attempt failed', { error: e });
                return false;
            }
        };
        const ok = await doLoad();
        if (!ok) {
            // R-M-12: Retry once after 5s to handle transient DB unavailability
            await new Promise((resolve) => setTimeout(resolve, 5000));
            const retryOk = await doLoad();
            if (!retryOk) {
                rootLogger.warn(
                    'KeyStateStore',
                    'loadPersisted retry failed — starting with empty state',
                );
                this.states.clear();
            }
        }
        this._persistedLoaded = true;
        this._flushPendingSeeds();
    }

    /** Process seeds that were queued before loadPersisted() completed.
     * Only creates entries for IDs not yet in the map. The bootstrap
     * phase will call seedFromKeys() later with proper provider/label/status
     * data — but since states already exist (from this call), seedFromKeys()
     * skips them. So we must match seedFromKeys() defaults here:
     * active status → healthScore 100, unknown → 25.
     */
    private _flushPendingSeeds(): void {
        if (!this._pendingSeedIds) return;
        const ids = this._pendingSeedIds;
        this._pendingSeedIds = null;
        for (const id of ids) {
            if (!this.states.has(id)) {
                this.states.set(id, {
                    id,
                    provider: 'unknown',
                    label: id,
                    status: 'unknown',
                    healthScore: 100, // matches seedFromKeys default for active keys
                    lastProbe: { status: 'unknown', latency: 0, timestamp: Date.now() },
                    health: { ...DEFAULT_HEALTH },
                    quota: { ...DEFAULT_QUOTA },
                    routing: { weight: 0, blocked: true },
                    flags: { circuitOpen: false, rateLimited: false, authFailed: false },
                    lifecycleState: 'active',
                    updatedAt: Date.now(),
                });
            }
        }
    }

    private persist(): void {
        if (!this.database) return;
        if (this.persistPromise) {
            this._persistDirty = true;
            return;
        }
        this.persistPromise = (async () => {
            try {
                this._persistDirty = false;
                const data = Array.from(this.states.entries()).map(([id, state]) => ({
                    id,
                    state,
                }));
                await this.database!.setKv('keystate_store_states', data);
            } catch (e) {
                rootLogger.warn('KeyStateStore', 'Failed to persist states', { error: e });
            } finally {
                this.persistPromise = null;
                if (this._persistDirty) this.persist();
            }
        })();
    }

    private async persistNow(): Promise<void> {
        if (!this.database) return;
        const data = Array.from(this.states.entries()).map(([id, state]) => ({
            id,
            state,
        }));
        await this.database!.setKv('keystate_store_states', data);
    }

    /**
     * Seed the store with all existing keys before the first probe runs.
     * Call this from bootstrap / after keyService is ready.
     */
    purgeOrphans(activeKeyIds: Set<string>): void {
        let removed = 0;
        for (const id of this.states.keys()) {
            if (!activeKeyIds.has(id)) {
                this.states.delete(id);
                removed++;
            }
        }
        if (removed > 0) {
            LOGGER.info('KeyStateStore', `Purged ${removed} orphan state entries`);
            this.persist();
        }
    }

    seedFromKeys(keys: ApiKey[]): void {
        const currentIds = new Set(keys.map((k) => k.id));
        // 1c M4: if loadPersisted hasn't run yet, queue seeds for later to avoid
        // overwriting persisted state with defaults
        if (!this._persistedLoaded) {
            this._pendingSeedIds = Array.from(currentIds);
            return;
        }
        // S-M-7: Don't purgeOrphans here — it wipes history for keys temporarily absent.
        // The periodic purge timer (start(), 5min interval) handles orphan cleanup.
        for (const key of keys) {
            if (!this.states.has(key.id)) {
                const status: KeyStatus =
                    key.status === 'active'
                        ? 'ready'
                        : key.status === 'error'
                          ? 'broken'
                          : 'unknown';
                this.states.set(key.id, {
                    id: key.id,
                    provider: key.provider,
                    label: key.label || key.provider,
                    status,
                    healthScore: status === 'ready' ? 100 : status === 'broken' ? 0 : 25,
                    lastProbe: { status, latency: 0, timestamp: Date.now() },
                    health: { ...DEFAULT_HEALTH },
                    quota: { ...DEFAULT_QUOTA },
                    routing: { weight: status === 'ready' ? 1 : 0, blocked: status !== 'ready' },
                    flags: { circuitOpen: false, rateLimited: false, authFailed: false },
                    lifecycleState: 'active',
                    updatedAt: Date.now(),
                });
            }
        }
        this.persist();
    }
    private _purgeTimer: ReturnType<typeof setInterval> | null = null;

    async start(): Promise<void> {
        if (this._started) return;
        this._started = true;
        try {
            await this.loadPersisted();
        } catch (e) {
            LOGGER.warn('KeyStateStore', 'loadPersisted failed during start — continuing', {
                error: e,
            });
        }
        if (!this.eventBus) return;

        // Periodic orphan cleanup every 5min — reconciles against live key IDs
        this._purgeTimer = setInterval(() => {
            const liveIds = this._lazyGetKeyIds?.();
            if (liveIds && liveIds.length > 0) {
                this.purgeOrphans(new Set(liveIds));
            }
        }, 300000);

        this.unsubs.push(
            this.eventBus.onSafe<{ id: string }>(EVENTS.KEY_REMOVED, (data) => {
                this.remove(data.id);
            }),
        );

        this.unsubs.push(
            this.eventBus.onSafe<import('../types/metrics-types').ApiKey[]>(
                EVENTS.KEY_UPDATED,
                (keys) => {
                    if (!Array.isArray(keys)) return;
                    for (const key of keys) {
                        const s = this.states.get(key.id);
                        if (s) {
                            const status: KeyStatus =
                                key.status === 'active'
                                    ? 'ready'
                                    : key.status === 'error'
                                      ? 'broken'
                                      : 'unknown';
                            // PRESERVE authFailed across KEY_UPDATED: a key marked authFailed
                            // by a 402/401 probe must stay excluded until a real success
                            // clears it — otherwise dead keys get re-probed and re-tried
                            // every cycle (openrouter 402 spam in debate logs).
                            const flags =
                                status === 'ready'
                                    ? {
                                          circuitOpen: false,
                                          rateLimited: false,
                                          authFailed: s.flags.authFailed,
                                      }
                                    : s.flags;
                            this.update(key.id, {
                                status,
                                provider: key.provider,
                                label: key.label || key.provider,
                                flags,
                            });
                            this.recomputeRouting(key.id);
                        }
                    }
                },
            ),
        );

        this.unsubs.push(
            this.eventBus.onSafe<QuotaExceededPayload>(EVENTS.KEY_QUOTA_EXCEEDED, (payload) => {
                const prev = this.states.get(payload.id);
                const quotaUsed = payload.current ?? 0;
                const quotaLimit = payload.limit ?? 0;
                this.update(payload.id, {
                    quota: {
                        ...(prev?.quota ?? DEFAULT_QUOTA),
                        usedTokens:
                            payload.quotaType === 'tokens'
                                ? quotaUsed
                                : (prev?.quota.usedTokens ?? 0),
                        limitTokens:
                            payload.quotaType === 'tokens'
                                ? quotaLimit
                                : (prev?.quota.limitTokens ?? 0),
                        usedRequests:
                            payload.quotaType === 'requests'
                                ? quotaUsed
                                : (prev?.quota.usedRequests ?? 0),
                        limitRequests:
                            payload.quotaType === 'requests'
                                ? quotaLimit
                                : (prev?.quota.limitRequests ?? 0),
                        resetAt: payload.resetAt ?? prev?.quota.resetAt,
                    },
                    flags: {
                        ...(prev?.flags ?? {
                            circuitOpen: false,
                            rateLimited: false,
                            authFailed: false,
                        }),
                        rateLimited: true,
                    },
                });
                this.recomputeRouting(payload.id);
            }),
        );

        this.unsubs.push(
            this.eventBus.onSafe<{ id: string; provider: string; error: string }>(
                EVENTS.KEY_HEALTH_CHECK_FAILED,
                (payload) => {
                    const prev = this.states.get(payload.id);
                    const ce = (prev?.health.consecutiveErrors ?? 0) + 1;
                    const err = payload.error || '';
                    const isAuthError =
                        err.includes('401') ||
                        err.includes('403') ||
                        err.includes('402') ||
                        err.includes('Authentication failed') ||
                        err.includes('Invalid API Key') ||
                        err.includes('Unauthorized') ||
                        err.includes('Forbidden') ||
                        err.includes('Payment Required') ||
                        err.includes('User not found');
                    const isRateLimited =
                        err.includes('429') ||
                        err.includes('Too Many Requests') ||
                        err.includes('Rate limit');
                    this.update(payload.id, {
                        health: {
                            ...(prev?.health ?? DEFAULT_HEALTH),
                            consecutiveErrors: ce,
                            errorRate: Math.min(1, ce / 10),
                        },
                        flags: {
                            ...(prev?.flags ?? {
                                circuitOpen: false,
                                rateLimited: false,
                                authFailed: false,
                            }),
                            authFailed: prev?.flags.authFailed || isAuthError,
                            rateLimited: prev?.flags.rateLimited || isRateLimited,
                        },
                    });
                    this.recomputeRouting(payload.id);
                },
            ),
        );

        this.unsubs.push(
            this.eventBus.onSafe<{ id: string; provider: string; status: string; latency: number }>(
                EVENTS.KEY_HEALTH_CHECK_COMPLETED,
                (payload) => {
                    const prev = this.states.get(payload.id);
                    const status: KeyStatus = payload.status === 'active' ? 'ready' : 'unknown';
                    this.update(payload.id, {
                        status,
                        health: {
                            ...(prev?.health ?? DEFAULT_HEALTH),
                            consecutiveErrors:
                                status === 'ready' ? 0 : (prev?.health.consecutiveErrors ?? 0),
                            errorRate: status === 'ready' ? 0 : (prev?.health.errorRate ?? 0),
                            successRate: status === 'ready' ? 1 : (prev?.health.successRate ?? 0),
                            lastSuccessAt:
                                status === 'ready' ? Date.now() : prev?.health.lastSuccessAt,
                        },
                        lastProbe: {
                            status,
                            latency: payload.latency,
                            timestamp: Date.now(),
                        },
                    });
                    this.recomputeRouting(payload.id);
                },
            ),
        );

        this.unsubs.push(
            this.eventBus.onSafe<{
                id: string;
                provider: string;
                state: string;
                previousState: string;
            }>(EVENTS.KEY_STATE_CHANGED, (payload) => {
                const flags = {
                    ...(this.states.get(payload.id)?.flags ?? {
                        circuitOpen: false,
                        rateLimited: false,
                        authFailed: false,
                    }),
                };
                if (payload.state === 'broken' || payload.state === 'error')
                    flags.authFailed = true;
                if (payload.state === 'limited') flags.rateLimited = true;
                this.update(payload.id, { flags });
                this.recomputeRouting(payload.id);
            }),
        );

        this.unsubs.push(
            this.eventBus.onSafe<{
                provider: string;
                keyId: string;
                status: string;
                failureCount: number;
                lastFailure: number;
            }>(EVENTS.PROVIDER_CIRCUIT_BREAKER_SYNCED, (payload) => {
                for (const [id, state] of this.states) {
                    if (state.provider.toLowerCase() === payload.provider.toLowerCase()) {
                        this.update(id, {
                            flags: { ...state.flags, circuitOpen: payload.status === 'open' },
                        });
                        this.recomputeRouting(id);
                    }
                }
            }),
        );

        this.unsubs.push(
            this.eventBus.onSafe<{
                provider: string;
                keyId: string;
                remaining: number;
                resetAt: number;
            }>(EVENTS.PROVIDER_RATE_LIMIT_SYNCED, (payload) => {
                for (const [id, state] of this.states) {
                    if (state.provider.toLowerCase() === payload.provider.toLowerCase()) {
                        this.update(id, {
                            flags: { ...state.flags, rateLimited: payload.remaining <= 0 },
                        });
                        this.recomputeRouting(id);
                    }
                }
            }),
        );

        this.unsubs.push(
            this.eventBus.onSafe<{
                provider: string;
                keyId: string;
                error: string;
                timestamp: number;
                statusCode?: number;
            }>(EVENTS.PROVIDER_ERROR_SYNCED, (payload) => {
                for (const [id, state] of this.states) {
                    if (state.provider.toLowerCase() === payload.provider.toLowerCase()) {
                        const ce = (state.health.consecutiveErrors ?? 0) + 1;
                        this.update(id, {
                            health: {
                                ...state.health,
                                consecutiveErrors: ce,
                                errorRate: Math.min(1, ce / 10),
                            },
                        });
                        this.recomputeRouting(id);
                    }
                }
            }),
        );
    }
    async destroy(): Promise<void> {
        this._started = false;
        if (this._purgeTimer) {
            clearInterval(this._purgeTimer);
            this._purgeTimer = null;
        }
        if (this.persistPromise) await this.persistPromise;
        for (const unsub of this.unsubs) unsub();
        this.unsubs = [];
        this.listeners.clear();
        this.states.clear();
    }

    get(id: string): KeyState | undefined {
        const state = this.states.get(id);
        if (!state) return undefined;
        return this.applyRecovery(state);
    }

    private applyRecovery(state: KeyState): KeyState {
        const elapsedMin = (Date.now() - state.updatedAt) / 60000;
        if (elapsedMin <= 0 || state.healthScore >= 100) return state;
        const recovered = Math.min(100, state.healthScore + RECOVERY_RATE_PER_MIN * elapsedMin);
        const hs = recovered;
        let weight = hs >= 75 ? 1 : hs >= 50 ? 0.5 : hs >= 25 ? 0.25 : hs >= 10 ? 0.1 : 0;
        if (state.health.consecutiveErrors > 3) weight *= 0.5;
        if (state.flags.authFailed) weight = 0;

        const lifecycleMultiplier =
            state.lifecycleState === 'active'
                ? 1
                : state.lifecycleState === 'probation'
                  ? 0.7
                  : state.lifecycleState === 'degraded'
                    ? 0.4
                    : state.lifecycleState === 'recovering'
                      ? 0.5
                      : state.lifecycleState === 'quarantined'
                        ? 0
                        : 1;
        weight *= lifecycleMultiplier;

        // Clear rateLimited flag after 30min (must outlast probe interval 300s to avoid
        // probing rate-limited keys every cycle). Rate limits typically reset in seconds;
        // after 30min a fresh probe will correctly re-evaluate status.
        const flags =
            state.flags.rateLimited && elapsedMin >= 30
                ? { ...state.flags, rateLimited: false }
                : state.flags;
        const hasWorkingModel =
            state.modelHealth && Object.values(state.modelHealth).some((v) => v === 'ok');
        if (hs < 25 && hasWorkingModel) weight = Math.max(weight, 0.25);
        return {
            ...state,
            healthScore: recovered,
            flags,
            routing: { weight, blocked: weight === 0 },
        };
    }

    getAll(): KeyState[] {
        return [...this.states.values()].map((s) => this.applyRecovery(s));
    }

    getReady(): KeyState[] {
        return this.getAll().filter((k) => k.healthScore >= 75);
    }

    getForRouting(): KeyState[] {
        return this.getAll()
            .filter((k) => !k.routing.blocked)
            .sort((a, b) => b.routing.weight - a.routing.weight);
    }

    getWorkingModels(keyId: string, availableModels: string[]): string[] {
        const state = this.states.get(keyId);
        if (!state?.modelHealth || Object.keys(state.modelHealth).length === 0) {
            return availableModels;
        }
        return availableModels.filter((m) => state.modelHealth![m] !== 'failed');
    }

    async update(id: string, patch: Partial<KeyState>): Promise<void> {
        const prev = this.states.get(id);
        const next: KeyState = prev
            ? { ...prev, ...patch, updatedAt: Date.now() }
            : {
                  id,
                  status: 'unknown',
                  provider: '',
                  label: '',
                  healthScore: 100,
                  lastProbe: { status: 'unknown', latency: 0, timestamp: Date.now() },
                  health: { ...DEFAULT_HEALTH },
                  quota: { ...DEFAULT_QUOTA },
                  routing: { weight: 0, blocked: false },
                  flags: { circuitOpen: false, rateLimited: false, authFailed: false },
                  lifecycleState: 'active',
                  updatedAt: Date.now(),
                  ...patch,
              };

        // Preserve healthScore from prev if patch omitted it
        if (patch.healthScore === undefined && prev?.healthScore !== undefined) {
            next.healthScore = prev.healthScore;
        }

        // Preserve routing default if patch omitted it
        if (!patch.routing) {
            next.routing = prev?.routing ?? { weight: 0, blocked: false };
        }
        this.states.set(id, next);
        await this.persistNow();
        this.emit(EVENTS.KEYSTATE_UPDATED, id, next);
    }

    async remove(id: string): Promise<void> {
        this.states.delete(id);
        await this.persistNow();
        this.emit(EVENTS.KEYSTATE_REMOVED, id);
    }

    on(cb: (event: { type: KeyStateEvent; id: string; state?: KeyState }) => void): () => void {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    private emit(type: KeyStateEvent, id: string, state?: KeyState): void {
        for (const cb of this.listeners) cb({ type, id, state });
        this.eventBus?.emit(type, { id, state });
    }

    private computeHealthScore(status: KeyStatus, prevHealth?: number): number {
        const base: Record<KeyStatus, number> = {
            ready: 100,
            limited: 75,
            degraded: 50,
            broken: 0,
            unknown: 25,
        };
        const score = base[status] ?? 25;
        // Never increase above previous health without recovery time
        const prev = prevHealth ?? score;
        return status === 'ready' ? 100 : Math.min(prev, score);
    }

    ingestProbe(id: string, result: ProbeResult): void {
        const probeSnapshot: KeyProbeSnapshot = {
            status: result.status,
            latency: result.latency,
            error: result.error,
            errorCode: result.statusCode,
            timestamp: result.timestamp,
        };

        const status: KeyStatus = result.status;
        const prev = this.states.get(id);
        const healthScore = this.computeHealthScore(status, prev?.healthScore);
        const now = Date.now();
        const lastHealthyAt = healthScore >= 75 ? now : prev?.lastHealthyAt;
        const degradedSince = healthScore < 75 ? (prev?.degradedSince ?? now) : undefined;

        const sc = result.statusCode;
        const err = result.error || '';
        const isAuthError =
            sc === 401 ||
            sc === 403 ||
            sc === 402 ||
            err.includes('401') ||
            err.includes('403') ||
            err.includes('402') ||
            err.includes('Authentication failed') ||
            err.includes('Invalid API Key') ||
            err.includes('Unauthorized') ||
            err.includes('Forbidden') ||
            err.includes('Payment Required') ||
            err.includes('Insufficient credits') ||
            err.includes('User not found');

        const isRateLimited =
            sc === 429 ||
            result.rateLimited ||
            err.includes('429') ||
            err.includes('Too Many Requests') ||
            err.includes('Rate limit');
        const flags = {
            circuitOpen: result.circuitOpen,
            rateLimited: isRateLimited,
            authFailed: isAuthError,
        };

        this.update(id, {
            provider: result.provider,
            label: result.keyLabel,
            model: result.model,
            modelHealth: result.modelHealth,
            healthScore,
            lastHealthyAt,
            degradedSince,
            lastProbe: probeSnapshot,
            status,
            flags,
        });
        this.recomputeRouting(id);
    }

    private recomputeRouting(id: string): void {
        const state = this.states.get(id);
        if (!state) return;

        const hs = state.healthScore;
        let weight = hs >= 75 ? 1 : hs >= 50 ? 0.5 : hs >= 25 ? 0.25 : hs >= 10 ? 0.1 : 0;

        if (state.health.consecutiveErrors > 3) weight *= 0.5;
        if (state.flags.authFailed) weight = 0;

        // Lifecycle state weight multiplier
        const lifecycleMultiplier =
            state.lifecycleState === 'active'
                ? 1
                : state.lifecycleState === 'probation'
                  ? 0.7
                  : state.lifecycleState === 'degraded'
                    ? 0.4
                    : state.lifecycleState === 'recovering'
                      ? 0.5
                      : state.lifecycleState === 'quarantined'
                        ? 0
                        : 1;
        weight *= lifecycleMultiplier;

        // If key has at least one working model, don't block it entirely
        const hasWorkingModel =
            state.modelHealth && Object.values(state.modelHealth).some((v) => v === 'ok');
        if (hs < 25 && hasWorkingModel) {
            // Key has some working models but low healthScore due to probe failures on other models
            // Allow reduced weight for fallback use
            weight = Math.max(weight, 0.25);
        }

        this.states.set(id, {
            ...state,
            routing: { weight, blocked: weight === 0 },
            updatedAt: Date.now(),
        });
    }
}
