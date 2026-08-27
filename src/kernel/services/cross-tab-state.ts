import { eventBus } from '../events/event-bus';
import type { IEventBus } from '../types/interfaces';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
import { safeJsonParse } from '../../kernel/utils/safe-json';
import { ssrSafeStorage } from '../utils/ssr-storage';
import { ApiKeySchema, SystemStateSchema } from '../types/schema-types';
import { EVENT_REGISTRY } from '../events/event-registry';
import { z } from 'zod';
import type {
    ICrossTabStateSync,
    CircuitBreakerState,
    RateLimitState,
} from '../contracts/cross-tab-state';

const CHANNEL_NAME = 'provider-state-sync';
const LOGGER = rootLogger.child('CrossTabStateSync');
const HEARTBEAT_MS = 30_000;
const TAB_TIMESTAMP_KEY = 'cross-tab:timestamps';

export interface CrossTabStateMessage {
    type:
        | 'invalidate-circuit-breaker'
        | 'invalidate-rate-limit'
        | 'invalidate-error'
        | 'sync-request'
        | 'sync-response'
        | 'heartbeat'
        | 'debate-update'
        | 'key-update'
        | 'kernel-state-update'
        | 'chat-session-update'
        | 'settings-update';
    timestamp: number;
    tabId: string;
    payload: unknown;
}

export interface DebateSyncPayload {
    sessionId: string;
    updatedAt: number;
    phase: string;
    round: number;
    seq: number;
}

export type ErrorEntry = {
    provider: string;
    keyId: string;
    error: string;
    timestamp: number;
    statusCode?: number;
};

class CrossTabStateSync implements ICrossTabStateSync {
    private channel: BroadcastChannel | null = null;
    private tabId: string;
    private tabTimestamp: number;
    private localCircuitBreakers: Map<string, CircuitBreakerState> = new Map();
    private localRateLimits: Map<string, RateLimitState> = new Map();
    private localErrors: ErrorEntry[] = [];
    private listeners: Map<string, Set<(data: CrossTabStateMessage) => void>> = new Map();
    private static readonly MAX_TABS = 50;
    private static readonly MAX_DEBATE_VERSIONS = 200;
    private knownTabTimestamps: Map<string, number> = new Map();
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private syncTimer: ReturnType<typeof setInterval> | null = null;
    private storageHandler: ((event: StorageEvent) => void) | null = null;
    private localDebateVersions: Map<
        string,
        { updatedAt: number; phase: string; round: number; seq: number }
    > = new Map();
    private debateSeqCounter = 0;
    private _eventBus: IEventBus;

    constructor(eventBus: IEventBus) {
        this._eventBus = eventBus;
        this.tabId = `${Date.now().toString(36)}-${crypto.randomUUID()}`;
        this.tabTimestamp = Date.now();
        this.knownTabTimestamps.set(this.tabId, this.tabTimestamp);
    }

    /** BR-05: Start must be called explicitly after bootstrap is ready — constructor
     *  no longer auto-initializes to prevent event subscriptions and timers
     *  from running before services are ready. */
    start(): void {
        this.init();
    }

    private unsubs: Array<() => void> = []; // H-35: track all EventBus subscriptions

    private init(): void {
        // STATE-C4: Clean up circuit-breaker / rate-limit state when a key is removed.
        // Without this, deleted keys leave orphaned entries keyed by `${provider}:${keyId}`
        // that block new keys with the same ID on re-add, and leak memory.
        this.unsubs.push(
            this._eventBus.onSafe<{ id: string }>(EVENTS.KEY_REMOVED, (data) => {
                const keyId = data.id;
                for (const key of this.localCircuitBreakers.keys()) {
                    if (key.endsWith(`:${keyId}`)) this.localCircuitBreakers.delete(key);
                }
                for (const key of this.localRateLimits.keys()) {
                    if (key.endsWith(`:${keyId}`)) this.localRateLimits.delete(key);
                }
                this.localErrors = this.localErrors.filter((e) => !e.keyId.endsWith(`:${keyId}`));
                LOGGER.debug('CrossTabStateSync', 'key removed', {
                    keyId,
                    cleanedCircuitBreakers: true,
                    cleanedRateLimits: true,
                });
            }),
        );

        this.unsubs.push(
            this._eventBus.on(EVENTS.DEBATE_UPDATED, (raw: unknown) => {
                const data = raw as { id: string; phase: string; round: number };
                const seq = ++this.debateSeqCounter;
                this.localDebateVersions.set(data.id, {
                    updatedAt: Date.now(),
                    phase: data.phase,
                    round: data.round,
                    seq,
                });
                this.broadcast({
                    type: 'debate-update',
                    timestamp: Date.now(),
                    tabId: this.tabId,
                    payload: {
                        sessionId: data.id,
                        updatedAt: Date.now(),
                        phase: data.phase,
                        round: data.round,
                        seq,
                    },
                });
            }),
        );

        this.unsubs.push(
            this._eventBus.on(EVENTS.KEY_UPDATED, () => {
                this.broadcast({
                    type: 'key-update',
                    timestamp: Date.now(),
                    tabId: this.tabId,
                    payload: null,
                });
            }),
        );

        this.unsubs.push(
            this._eventBus.on(EVENTS.SETTINGS_UPDATED, () => {
                this.broadcast({
                    type: 'settings-update',
                    timestamp: Date.now(),
                    tabId: this.tabId,
                    payload: null,
                });
            }),
        );

        this.unsubs.push(
            this._eventBus.on(EVENTS.KERNEL_UPDATED, () => {
                this.broadcast({
                    type: 'kernel-state-update',
                    timestamp: Date.now(),
                    tabId: this.tabId,
                    payload: null,
                });
            }),
        );

        this.unsubs.push(
            this._eventBus.on(EVENTS.CHAT_FORKED, () => {
                this.broadcast({
                    type: 'chat-session-update',
                    timestamp: Date.now(),
                    tabId: this.tabId,
                    payload: null,
                });
            }),
        );

        if (typeof BroadcastChannel !== 'undefined') {
            try {
                this.channel = new BroadcastChannel(CHANNEL_NAME);
                this.channel.onmessage = (event: MessageEvent<CrossTabStateMessage>) => {
                    this.handleMessage(event.data);
                };
                LOGGER.info('CrossTabStateSync', 'Initialized with BroadcastChannel', {
                    tabId: this.tabId,
                });
            } catch (e) {
                LOGGER.warn(
                    'CrossTabStateSync',
                    'BroadcastChannel not available, using localStorage fallback',
                    { error: e },
                );
                this.initLocalStorageFallback();
            }
        } else {
            this.initLocalStorageFallback();
        }

        this.broadcast({
            type: 'sync-request',
            timestamp: Date.now(),
            tabId: this.tabId,
            payload: null,
        });

        this.heartbeatTimer = setInterval(() => {
            this.broadcast({
                type: 'heartbeat',
                timestamp: Date.now(),
                tabId: this.tabId,
                payload: null,
            });
            this.pruneStaleTabs();
            this.pruneLocalStorage();
        }, HEARTBEAT_MS);

        this.syncTimer = setInterval(() => {
            this.broadcast({
                type: 'sync-request',
                timestamp: Date.now(),
                tabId: this.tabId,
                payload: null,
            });
            LOGGER.debug('CrossTabStateSync', 'Periodic full-sync requested', {
                tabId: this.tabId,
            });
        }, HEARTBEAT_MS * 4);
    }

    private initLocalStorageFallback(): void {
        this.storageHandler = (event: StorageEvent) => {
            if (event.key?.startsWith('provider-state-sync:')) {
                try {
                    const data = safeJsonParse(event.newValue || '{}') as CrossTabStateMessage;
                    this.handleMessage(data);
                } catch (e) {
                    LOGGER.warn('CrossTabStateSync', 'Failed to parse localStorage sync message', {
                        error: e,
                    });
                }
            }
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', this.storageHandler);
        }
    }

    private handleMessage(message: CrossTabStateMessage): void {
        if (message.tabId === this.tabId) return;

        if (message.timestamp > 0) {
            this.knownTabTimestamps.set(message.tabId, message.timestamp);
            if (this.knownTabTimestamps.size > CrossTabStateSync.MAX_TABS) {
                const oldest = this.knownTabTimestamps.keys().next().value;
                if (oldest !== undefined) this.knownTabTimestamps.delete(oldest);
            }
            this.persistTabTimestamps();
        }

        switch (message.type) {
            case 'heartbeat':
                break;
            case 'invalidate-circuit-breaker': {
                const cbState = message.payload as CircuitBreakerState;
                const cbKey = `${cbState.provider}:${cbState.keyId}`;
                this.localCircuitBreakers.set(cbKey, cbState); // H-36: Set, not delete
                LOGGER.debug('CrossTabStateSync', 'Circuit breaker synced from another tab', {
                    key: cbKey,
                    status: cbState.status,
                });
                break;
            }
            case 'invalidate-rate-limit': {
                const rlState = message.payload as RateLimitState;
                const rlKey = `${rlState.provider}:${rlState.keyId}`;
                this.localRateLimits.set(rlKey, rlState); // H-36: Set, not delete
                LOGGER.debug('CrossTabStateSync', 'Rate limit synced from another tab', {
                    key: rlKey,
                });
                break;
            }
            case 'invalidate-error': {
                const errPayload = message.payload as ErrorEntry;
                this.localErrors = this.localErrors.filter(
                    (e) =>
                        !(
                            e.provider === errPayload.provider &&
                            e.keyId === errPayload.keyId &&
                            e.timestamp === errPayload.timestamp
                        ),
                );
                break;
            }
            case 'sync-request':
                this.broadcast({
                    type: 'sync-response',
                    timestamp: Date.now(),
                    tabId: this.tabId,
                    payload: null,
                });
                break;
            case 'sync-response':
                break;
            case 'debate-update':
                this.handleDebateUpdate(message.payload as DebateSyncPayload);
                break;
            case 'key-update': {
                LOGGER.debug('CrossTabStateSync', 'Cross-tab key update, refreshing local state');
                if (message.payload == null) {
                    this._eventBus.emitOnce(EVENTS.KEY_UPDATED, 'cross-tab:key-update', []);
                } else {
                    const keyPayload = z.array(ApiKeySchema).safeParse(message.payload);
                    if (keyPayload.success)
                        this._eventBus.emitOnce(
                            EVENTS.KEY_UPDATED,
                            'cross-tab:key-update',
                            keyPayload.data,
                        );
                    else
                        LOGGER.warn('CrossTabStateSync', 'malformed key-update payload', {
                            issues: keyPayload.error.issues,
                        });
                }
                break;
            }
            case 'kernel-state-update': {
                LOGGER.debug(
                    'CrossTabStateSync',
                    'Cross-tab kernel update, refreshing local state',
                );
                if (message.payload == null) {
                    this._eventBus.emitOnce(EVENTS.KERNEL_UPDATED, 'cross-tab:kernel-update', {});
                } else {
                    const kernelPayload = SystemStateSchema.safeParse(message.payload);
                    if (kernelPayload.success)
                        this._eventBus.emitOnce(
                            EVENTS.KERNEL_UPDATED,
                            'cross-tab:kernel-update',
                            kernelPayload.data,
                        );
                    else
                        LOGGER.warn('CrossTabStateSync', 'malformed kernel-state-update payload', {
                            issues: kernelPayload.error.issues,
                        });
                }
                break;
            }
            case 'chat-session-update':
                LOGGER.debug(
                    'CrossTabStateSync',
                    'Cross-tab chat session update, refreshing local state',
                );
                this._eventBus.emitOnce(
                    EVENTS.CHAT_FORKED,
                    'cross-tab:chat-forked',
                    message.payload,
                );
                break;
            case 'settings-update': {
                LOGGER.debug(
                    'CrossTabStateSync',
                    'Cross-tab settings update, refreshing local state',
                );
                if (message.payload == null) {
                    this._eventBus.emitOnce(EVENTS.SETTINGS_UPDATED, 'cross-tab:settings-update', {
                        settings: {},
                        changes: {},
                    });
                } else {
                    const settingsSchema = EVENT_REGISTRY.SETTINGS_UPDATED.schema;
                    const settingsPayload = settingsSchema.safeParse(message.payload);
                    if (settingsPayload.success)
                        this._eventBus.emitOnce(
                            EVENTS.SETTINGS_UPDATED,
                            'cross-tab:settings-update',
                            settingsPayload.data,
                        );
                    else
                        LOGGER.warn('CrossTabStateSync', 'malformed settings-update payload', {
                            issues: settingsPayload.error.issues,
                        });
                }
                break;
            }
        }

        const listeners = this.listeners.get(message.type);
        if (listeners) {
            listeners.forEach((listener) => listener(message));
        }
    }

    private handleDebateUpdate(payload: DebateSyncPayload): void {
        if (!payload?.sessionId) return;
        const existing = this.localDebateVersions.get(payload.sessionId);
        if (existing && existing.seq >= payload.seq) return;
        if (existing && existing.seq < payload.seq) {
            LOGGER.warn('CrossTabStateSync', 'Debate session conflict detected', {
                sessionId: payload.sessionId,
                local: existing,
                remote: payload,
            });
            if (typeof existing.round === 'number' && typeof payload.round === 'number') {
                this._eventBus.emit(EVENTS.DEBATE_SESSION_CONFLICT, {
                    sessionId: payload.sessionId,
                    currentVersion: existing.round,
                    attemptedVersion: payload.round,
                });
            }
        }
        this.localDebateVersions.set(payload.sessionId, {
            updatedAt: payload.updatedAt,
            phase: payload.phase,
            round: payload.round,
            seq: payload.seq,
        });
        if (this.localDebateVersions.size > CrossTabStateSync.MAX_DEBATE_VERSIONS) {
            const oldest = this.localDebateVersions.keys().next().value;
            if (oldest !== undefined) this.localDebateVersions.delete(oldest);
        }
    }

    private pruneStaleTabs(): void {
        const now = Date.now();
        const stale: string[] = [];
        for (const [tabId, ts] of this.knownTabTimestamps) {
            if (tabId !== this.tabId && now - ts > HEARTBEAT_MS * 3) {
                stale.push(tabId);
            }
        }
        for (const id of stale) {
            this.knownTabTimestamps.delete(id);
        }
    }

    private persistTabTimestamps(): void {
        try {
            const data: Record<string, number> = {};
            for (const [tabId, ts] of this.knownTabTimestamps) {
                data[tabId] = ts;
            }
            ssrSafeStorage.setItem(TAB_TIMESTAMP_KEY, JSON.stringify(data));
        } catch (e) {
            LOGGER.warn('CrossTabStateSync', 'Failed to persist tab timestamps', {
                error: (e as Error).message,
            });
        }
    }

    private readonly STORAGE_PREFIX = 'provider-state-sync:';
    private readonly MAX_STORAGE_KEYS = 50;

    private pruneLocalStorage(): void {
        const keys: string[] = [];
        const len = ssrSafeStorage.length;
        for (let i = len - 1; i >= 0; i--) {
            const key = ssrSafeStorage.key(i);
            if (key?.startsWith(this.STORAGE_PREFIX)) {
                keys.push(key);
            }
        }
        if (keys.length > this.MAX_STORAGE_KEYS) {
            // STATE-L6: Deduplicate by removing oldest entries (lowest timestamp suffix)
            keys.sort((a, b) => {
                const ta = parseInt(a.slice(a.lastIndexOf(':') + 1) || '0', 10);
                const tb = parseInt(b.slice(b.lastIndexOf(':') + 1) || '0', 10);
                return ta - tb;
            });
            keys.slice(0, keys.length - this.MAX_STORAGE_KEYS).forEach((k) =>
                ssrSafeStorage.removeItem(k),
            );
        }
    }

    private broadcast(message: CrossTabStateMessage): void {
        if (this.channel) {
            this.channel.postMessage(message);
        } else {
            this.pruneLocalStorage();
            ssrSafeStorage.setItem(
                `${this.STORAGE_PREFIX}${message.type}:${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
                JSON.stringify(message),
            );
        }
    }

    updateCircuitBreaker(state: CircuitBreakerState): void {
        const key = `${state.provider}:${state.keyId}`;
        this.localCircuitBreakers.set(key, state);
        this.broadcast({
            type: 'invalidate-circuit-breaker',
            timestamp: Date.now(),
            tabId: this.tabId,
            payload: state, // H-36: Send full state so receiver sets, not deletes
        });
        this._eventBus.emit(EVENTS.PROVIDER_STATE_CHANGED, {
            provider: state.provider,
            status: state.status,
        });
    }

    updateRateLimit(state: RateLimitState): void {
        const key = `${state.provider}:${state.keyId}`;
        this.localRateLimits.set(key, state);
        this.broadcast({
            type: 'invalidate-rate-limit',
            timestamp: Date.now(),
            tabId: this.tabId,
            payload: state, // H-36: Send full state so receiver sets, not deletes
        });
        this._eventBus.emit(EVENTS.PROVIDER_RATE_LIMIT_SYNCED, {
            provider: state.provider,
            keyId: state.keyId,
            remaining: state.remaining,
            resetAt: state.resetAt,
        });
    }

    reportError(entry: ErrorEntry): void {
        this.localErrors.push(entry);
        if (this.localErrors.length > 100) {
            this.localErrors = this.localErrors.slice(-100);
        }
        this.broadcast({
            type: 'invalidate-error',
            timestamp: Date.now(),
            tabId: this.tabId,
            payload: {
                provider: entry.provider,
                keyId: entry.keyId,
                timestamp: entry.timestamp,
                error: entry.error,
                statusCode: entry.statusCode,
            },
        });
        this._eventBus.emit(EVENTS.PROVIDER_ERROR_SYNCED, {
            provider: entry.provider,
            keyId: entry.keyId,
            error: entry.error,
            statusCode: entry.statusCode ?? 0,
            timestamp: entry.timestamp,
        });
    }

    updateDebate(sessionId: string, phase: string, round: number): void {
        const seq = ++this.debateSeqCounter;
        this.localDebateVersions.set(sessionId, { updatedAt: Date.now(), phase, round, seq });
        if (this.localDebateVersions.size > CrossTabStateSync.MAX_DEBATE_VERSIONS) {
            const oldest = this.localDebateVersions.keys().next().value;
            if (oldest !== undefined) this.localDebateVersions.delete(oldest);
        }
        this.broadcast({
            type: 'debate-update',
            timestamp: Date.now(),
            tabId: this.tabId,
            payload: { sessionId, updatedAt: Date.now(), phase, round, seq },
        });
    }

    getCircuitBreaker(provider: string, keyId: string): CircuitBreakerState | undefined {
        return this.localCircuitBreakers.get(`${provider}:${keyId}`);
    }

    getRateLimit(provider: string, keyId: string): RateLimitState | undefined {
        return this.localRateLimits.get(`${provider}:${keyId}`);
    }

    getRecentErrors(limit = 50): ErrorEntry[] {
        return this.localErrors.slice(-limit);
    }

    subscribe(
        type: CrossTabStateMessage['type'],
        callback: (data: CrossTabStateMessage) => void,
    ): () => void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(callback);

        return () => {
            this.listeners.get(type)?.delete(callback);
        };
    }

    getAllCircuitBreakers(): CircuitBreakerState[] {
        return Array.from(this.localCircuitBreakers.values());
    }

    getAllRateLimits(): RateLimitState[] {
        return Array.from(this.localRateLimits.values());
    }

    requestFullSync(): void {
        this.broadcast({
            type: 'sync-request',
            timestamp: Date.now(),
            tabId: this.tabId,
            payload: null,
        });
    }

    isPrimary(): boolean {
        const localTs = this.tabTimestamp;
        for (const [, ts] of this.knownTabTimestamps) {
            if (ts > localTs) {
                return false;
            }
        }
        return true;
    }

    destroy(): void {
        // H-35: Unsubscribe ALL EventBus listeners
        for (const unsub of this.unsubs) unsub();
        this.unsubs = [];
        this.channel?.close();
        this.channel = null;

        if (this.storageHandler && typeof window !== 'undefined') {
            window.removeEventListener('storage', this.storageHandler);
            this.storageHandler = null;
        }

        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }

        this.listeners.clear();
        this.localCircuitBreakers.clear();
        this.localRateLimits.clear();
        this.localErrors = [];
        this.localDebateVersions.clear();
        LOGGER.info('CrossTabStateSync', 'Destroyed', { tabId: this.tabId });
    }
}

export const crossTabStateSync = new CrossTabStateSync(eventBus);

// H-18: Clean up event listeners on HMR
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        crossTabStateSync.destroy();
    });
}
