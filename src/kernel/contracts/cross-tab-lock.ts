/**
 * Distributed mutual-exclusion lock via Dexie transactions.
 * Use for: protecting session-level writes (debate, chat) from concurrent tab access.
 * Do NOT use for: broadcasting state — see ICrossTabStateSync instead.
 */
export type LockResource =
    | `debate:${string}`
    | `chat:${string}`
    | `config:${string}`
    | `settings:${string}`
    | `keys:${string}`;

export interface LockAcquisition {
    readonly resourceId: LockResource;
    readonly ownerId: string;
    readonly acquiredAt: number;
    readonly ttl: number;
    readonly heartbeatAt: number;
}

export interface LockOptions {
    ttl?: number;
    retryMs?: number;
    maxRetries?: number;
}

export interface ILockAcquireResult {
    readonly lock: LockAcquisition | null;
    readonly error?: string;
}

export interface ILockEvent {
    readonly resourceId: string;
    readonly ownerId: string;
    readonly action: 'acquired' | 'released' | 'expired' | 'takeover';
}

export type LockListener = (event: ILockEvent) => void;

export interface IDistributedLock {
    acquire(resourceId: LockResource, options?: LockOptions): Promise<ILockAcquireResult>;
    release(lock: LockAcquisition): Promise<void>;
    heartbeat(lock: LockAcquisition): Promise<boolean>;
    isLocked(resourceId: LockResource): Promise<boolean>;
    getOwner(resourceId: LockResource): Promise<string | null>;
    onEvent(listener: LockListener): () => void;
    destroy(): void;
}
