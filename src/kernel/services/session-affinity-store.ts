import { PENDING_TTL } from '../contracts/session-affinity';
import { EVENTS } from '../events/event-names';
import type { ISessionAffinityStore, SessionBinding } from '../contracts/session-affinity';
import type { ILifecycle } from '../contracts/lifecycle';
import type { IEventBus } from '../types/interfaces';
import type { IKeyStateStore } from '../contracts/key-state';
import { getHealthBand } from '../contracts/key-state';
import { getDexieDb } from '../services/database-service';

export class SessionAffinityStore implements ISessionAffinityStore, ILifecycle {
    private bindings = new Map<string, SessionBinding>();
    private eventBus?: IEventBus;
    private keyStateStore?: IKeyStateStore;
    private _onStateChanged?: (data: unknown) => void;
    private _cleanupTimer?: ReturnType<typeof setInterval>;

    constructor(eventBus?: IEventBus, keyStateStore?: IKeyStateStore) {
        this.eventBus = eventBus;
        this.keyStateStore = keyStateStore;
    }

    async init(): Promise<void> {}
    private _started = false;
    private unsubs: Array<() => void> = [];
    async start(): Promise<void> {
        if (this._started) return;
        this._started = true;
        await this.loadPersisted();
        if (!this.eventBus) return;
        this._onStateChanged = (data: unknown) => {
            const id =
                typeof data === 'object' && data !== null && 'id' in data
                    ? String((data as { id?: unknown }).id ?? '')
                    : '';
            if (id) this.handleStateChange(id);
        };
        this.unsubs.push(this.eventBus.on(EVENTS.KEY_STATE_CHANGED, this._onStateChanged));
        this.unsubs.push(
            this.eventBus.on(EVENTS.DEBATE_SESSION_COMPLETED, (raw: unknown) => {
                const d = raw as { sessionId?: string } | undefined;
                if (d?.sessionId) this.unbind(d.sessionId);
            }),
        );
        this.unsubs.push(
            this.eventBus.on(EVENTS.DEBATE_SESSION_CANCELLED, (raw: unknown) => {
                const d = raw as { sessionId?: string } | undefined;
                if (d?.sessionId) this.unbind(d.sessionId);
            }),
        );
        this.unsubs.push(
            this.eventBus.on(EVENTS.DEBATE_SESSION_FAILED, (raw: unknown) => {
                const d = raw as { sessionId?: string } | undefined;
                if (d?.sessionId) this.unbind(d.sessionId);
            }),
        );
        this.unsubs.push(
            this.eventBus.onSafe<{ id: string }>(EVENTS.KEY_REMOVED, (data) => {
                this.removeKey(data.id);
            }),
        );
        this._cleanupTimer = setInterval(() => this.reapExpired(), 60_000);
    }
    destroy(): void {
        for (const u of this.unsubs) u();
        this.unsubs = [];
        if (this._cleanupTimer) clearInterval(this._cleanupTimer);
        this.bindings.clear();
        this._started = false;
    }

    private async loadPersisted(): Promise<void> {
        try {
            const db = getDexieDb();
            const record = await db.keyValue.get('session_affinity_bindings');
            if (record?.value) {
                const parsed: SessionBinding[] = JSON.parse(record.value as string);
                for (const b of parsed) {
                    this.bindings.set(this.key(b.sessionId, b.participantId), b);
                }
            }
        } catch {
            // Corrupt or missing data — start fresh
        }
    }

    private async persistBindings(): Promise<void> {
        try {
            const db = getDexieDb();
            await db.keyValue.put({
                id: 'session_affinity_bindings',
                value: JSON.stringify([...this.bindings.values()]),
            });
        } catch {
            // Non-critical — in-memory state is always current
        }
    }

    removeKey(keyId: string): void {
        for (const [k, b] of this.bindings) {
            if (b.keyId === keyId) this.bindings.delete(k);
        }
        this.persistBindings();
    }

    private reapExpired(): void {
        const now = Date.now();
        for (const [k, b] of this.bindings) {
            if (
                b.pendingEviction &&
                b.pendingEvictionAt &&
                now - b.pendingEvictionAt > PENDING_TTL
            ) {
                this.bindings.delete(k);
                this.eventBus?.emit(EVENTS.SESSION_BINDING_EXPIRED, {
                    sessionId: b.sessionId,
                    keyId: b.keyId,
                    provider: b.provider,
                    participantId: b.participantId,
                    boundAt: b.boundAt,
                    evictedAt: now,
                    reason: 'ttl',
                });
            }
        }
    }

    private key(sessionId: string, participantId?: string): string {
        return participantId ? `${sessionId}::${participantId}` : sessionId;
    }

    bind(sessionId: string, keyId: string, provider: string, participantId?: string): void {
        this.bindings.set(this.key(sessionId, participantId), {
            sessionId,
            keyId,
            participantId,
            provider,
            boundAt: Date.now(),
        });
        this.persistBindings();
    }

    getBoundKey(sessionId: string, participantId?: string): SessionBinding | undefined {
        return this.bindings.get(this.key(sessionId, participantId));
    }

    isSessionBound(sessionId: string): boolean {
        for (const b of this.bindings.values()) {
            if (b.sessionId === sessionId) return true;
        }
        return false;
    }

    unbind(sessionId: string, participantId?: string): void {
        if (participantId) {
            this.bindings.delete(this.key(sessionId, participantId));
        } else {
            for (const [k, b] of this.bindings) {
                if (b.sessionId === sessionId) this.bindings.delete(k);
            }
        }
        this.persistBindings();
    }

    unbindAll(): void {
        this.bindings.clear();
        this.persistBindings();
    }

    getAllBindings(): SessionBinding[] {
        this.reapExpired();
        return [...this.bindings.values()];
    }

    evictUnhealthy(isHealthy: (keyId: string) => boolean): string[] {
        this.reapExpired();
        const evicted: string[] = [];
        const now = Date.now();
        for (const [k, b] of this.bindings) {
            if (!isHealthy(b.keyId)) {
                this.bindings.delete(k);
                evicted.push(b.keyId);
                this.eventBus?.emit(EVENTS.SESSION_BINDING_EXPIRED, {
                    sessionId: b.sessionId,
                    keyId: b.keyId,
                    provider: b.provider,
                    participantId: b.participantId,
                    boundAt: b.boundAt,
                    evictedAt: now,
                    reason: 'unhealthy',
                });
            }
        }
        this.persistBindings();
        return evicted;
    }

    handleStateChange(keyId: string): void {
        this.reapExpired();
        const state = this.keyStateStore?.get(keyId);
        if (!state) return;

        const band = getHealthBand(state.healthScore);

        for (const [k, b] of this.bindings) {
            if (b.keyId !== keyId) continue;

            if (band === 'dead') {
                this.bindings.delete(k);
                this.eventBus?.emit(EVENTS.SESSION_BINDING_EXPIRED, {
                    sessionId: b.sessionId,
                    keyId: b.keyId,
                    provider: b.provider,
                    participantId: b.participantId,
                    boundAt: b.boundAt,
                    evictedAt: Date.now(),
                    reason: 'health_dead',
                });
                this.persistBindings();
            } else if (band === 'cooling' || band === 'degraded') {
                b.pendingEviction = true;
                b.pendingEvictionAt = Date.now();
            } else if (band === 'healthy' || band === 'warm') {
                b.pendingEviction = false;
                b.pendingEvictionAt = undefined;
            }
        }
    }
}
