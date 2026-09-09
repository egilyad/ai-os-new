import { getDexieDb } from '../services/database-service';
import { rootLogger } from './logger-service';
import type {
    LockResource,
    LockAcquisition,
    LockOptions,
    ILockAcquireResult,
    ILockEvent,
    LockListener,
    IDistributedLock,
} from '../contracts/cross-tab-lock';

const LOGGER = rootLogger.child('DistributedLock');
const LOCK_PREFIX = 'distlock:';
const DEFAULT_TTL = 30_000;
const DEFAULT_RETRY_MS = 500;
const DEFAULT_MAX_RETRIES = 10;

function lockKey(resourceId: LockResource): string {
    return `${LOCK_PREFIX}${resourceId}`;
}

function parseLockRecord(
    raw: unknown,
): { ownerId: string; acquiredAt: number; ttl: number; heartbeatAt: number } | null {
    if (!raw || typeof raw !== 'string') return null;
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (
            typeof parsed.ownerId !== 'string' ||
            typeof parsed.acquiredAt !== 'number' ||
            typeof parsed.ttl !== 'number' ||
            typeof parsed.heartbeatAt !== 'number'
        ) {
            return null;
        }
        return {
            ownerId: parsed.ownerId,
            acquiredAt: parsed.acquiredAt,
            ttl: parsed.ttl,
            heartbeatAt: parsed.heartbeatAt,
        };
    } catch {
        return null;
    }
}

function makeRecord(
    ownerId: string,
    ttl: number,
): { ownerId: string; acquiredAt: number; ttl: number; heartbeatAt: number } {
    const now = Date.now();
    return { ownerId, acquiredAt: now, ttl, heartbeatAt: now };
}

export class DistributedLockService implements IDistributedLock {
    private _ownerId: string;
    private _listeners: LockListener[] = [];
    private _heldLocks = new Set<string>();
    private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    constructor(ownerId?: string) {
        this._ownerId = ownerId ?? `tab-${crypto.randomUUID().slice(0, 8)}`;
    }

    private _notify(event: ILockEvent): void {
        for (const l of this._listeners) {
            try {
                l(event);
            } catch {
                /* listener isolation */
            }
        }
    }

    private async _readLock(
        resourceId: LockResource,
    ): Promise<{ ownerId: string; acquiredAt: number; ttl: number; heartbeatAt: number } | null> {
        const raw = await getDexieDb().keyValue.get(lockKey(resourceId));
        return parseLockRecord(raw?.value);
    }

    private _isExpired(record: { heartbeatAt: number; ttl: number }): boolean {
        return Date.now() - record.heartbeatAt > record.ttl;
    }

    async acquire(resourceId: LockResource, options?: LockOptions): Promise<ILockAcquireResult> {
        const ttl = options?.ttl ?? DEFAULT_TTL;
        const retryMs = options?.retryMs ?? DEFAULT_RETRY_MS;
        const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const result = await this._tryAcquire(resourceId, ttl);
            if (result.lock) return result;
            if (attempt < maxRetries) {
                await new Promise((r) => setTimeout(r, retryMs * (1 + Math.random() * 0.5)));
            } else {
                return result;
            }
        }

        return { lock: null, error: 'Max retries exceeded' };
    }

    private async _tryAcquire(resourceId: LockResource, ttl: number): Promise<ILockAcquireResult> {
        const db = getDexieDb();
        const key = lockKey(resourceId);

        try {
            return await db.transaction('rw', db.keyValue, async () => {
                const raw = await db.keyValue.get(key);
                const existing = parseLockRecord(raw?.value);

                if (existing) {
                    if (existing.ownerId === this._ownerId) {
                        const updated = {
                            ...existing,
                            heartbeatAt: Date.now(),
                        };
                        await db.keyValue.put({ id: key, value: JSON.stringify(updated) });
                        const lock: LockAcquisition = {
                            resourceId,
                            ownerId: this._ownerId,
                            acquiredAt: existing.acquiredAt,
                            ttl: existing.ttl,
                            heartbeatAt: updated.heartbeatAt,
                        };
                        this._heldLocks.add(key);
                        return { lock };
                    }

                    if (!this._isExpired(existing)) {
                        return { lock: null, error: 'Resource locked by another tab' };
                    }

                    // Expired — takeover
                    LOGGER.warn('DistributedLock', 'Lock expired, taking over', {
                        resource: resourceId,
                        prevOwner: existing.ownerId,
                    });
                }

                const record = makeRecord(this._ownerId, ttl);
                await db.keyValue.put({ id: key, value: JSON.stringify(record) });
                const lock: LockAcquisition = {
                    resourceId,
                    ownerId: this._ownerId,
                    acquiredAt: record.acquiredAt,
                    ttl: record.ttl,
                    heartbeatAt: record.heartbeatAt,
                };
                this._heldLocks.add(key);
                this._notify({
                    resourceId,
                    ownerId: this._ownerId,
                    action: existing ? 'takeover' : 'acquired',
                });
                return { lock };
            });
        } catch (e) {
            return {
                lock: null,
                error: `Lock acquisition failed: ${e instanceof Error ? e.message : String(e)}`,
            };
        }
    }

    async release(lock: LockAcquisition): Promise<void> {
        if (lock.ownerId !== this._ownerId) {
            LOGGER.warn('DistributedLock', 'Cannot release lock owned by another tab', {
                resource: lock.resourceId,
                owner: lock.ownerId,
            });
            return;
        }

        const db = getDexieDb();
        const key = lockKey(lock.resourceId);

        try {
            await db.transaction('rw', db.keyValue, async () => {
                const raw = await db.keyValue.get(key);
                const existing = parseLockRecord(raw?.value);
                if (existing && existing.ownerId === this._ownerId) {
                    await db.keyValue.delete(key);
                }
            });
        } catch (e) {
            LOGGER.warn('DistributedLock', 'Release failed', {
                resource: lock.resourceId,
                error: e,
            });
        }

        this._heldLocks.delete(key);
        this._notify({
            resourceId: lock.resourceId,
            ownerId: this._ownerId,
            action: 'released',
        });
    }

    async heartbeat(lock: LockAcquisition): Promise<boolean> {
        if (lock.ownerId !== this._ownerId) return false;
        const db = getDexieDb();
        const key = lockKey(lock.resourceId);

        try {
            return await db.transaction('rw', db.keyValue, async () => {
                const raw = await db.keyValue.get(key);
                const existing = parseLockRecord(raw?.value);
                if (!existing || existing.ownerId !== this._ownerId) {
                    this._heldLocks.delete(key);
                    this._notify({
                        resourceId: lock.resourceId,
                        ownerId: this._ownerId,
                        action: 'expired',
                    });
                    return false;
                }
                const updated = { ...existing, heartbeatAt: Date.now() };
                await db.keyValue.put({ id: key, value: JSON.stringify(updated) });
                return true;
            });
        } catch {
            return false;
        }
    }

    async isLocked(resourceId: LockResource): Promise<boolean> {
        const record = await this._readLock(resourceId);
        if (!record) return false;
        if (this._isExpired(record)) return false;
        return true;
    }

    async getOwner(resourceId: LockResource): Promise<string | null> {
        const record = await this._readLock(resourceId);
        if (!record || this._isExpired(record)) return null;
        return record.ownerId;
    }

    onEvent(listener: LockListener): () => void {
        this._listeners.push(listener);
        return () => {
            this._listeners = this._listeners.filter((l) => l !== listener);
        };
    }

    destroy(): void {
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }
        // Release all held locks
        for (const key of this._heldLocks) {
            const resourceId = key.slice(LOCK_PREFIX.length) as LockResource;
            this._notify({
                resourceId,
                ownerId: this._ownerId,
                action: 'released',
            });
        }
        this._heldLocks.clear();
        this._listeners = [];
    }
}

let _instance: DistributedLockService | null = null;

export function getDistributedLock(ownerId?: string): DistributedLockService {
    if (!_instance) {
        _instance = new DistributedLockService(ownerId);
    }
    return _instance;
}
