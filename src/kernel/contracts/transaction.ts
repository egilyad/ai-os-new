export interface ITransaction {
    deferEmit(event: string, data?: unknown): void;
    deferPersist(fn: () => Promise<void>, compensate?: () => Promise<void>): void;
    onCommit(cb: () => void): void;
    onRollback(cb: () => void): void;
    /** CoW (Copy-on-Write): deep-freezes a structuredClone of state for rollback restoration */
    capture<T>(state: T): T;
}

/** Utility: restore a CoW snapshot back into a target object (used in onRollback) */
export function restoreSnapshot<T extends object>(snapshot: T, target: T): void {
    const snapshotKeys = new Set(Object.keys(snapshot) as (keyof T)[]);
    for (const key of Object.keys(target) as (keyof T)[]) {
        if (!snapshotKeys.has(key)) delete target[key];
    }
    Object.assign(target, snapshot);
}
