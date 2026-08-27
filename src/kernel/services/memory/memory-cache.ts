import type { MemoryEntry } from '../../types/memory-types';

/**
 * MemoryCache — thread-safe in-memory store for MemoryEntry with a hard cap.
 *
 * Owns the array + the mutual-exclusion lock so mutations (store/upsert/
 * delete/update/clear/prune) can be serialized without leaking the lock
 * implementation into the service layer.
 */
export class MemoryCache {
    private _entries: MemoryEntry[] = [];
    private _lock: Promise<void> = Promise.resolve();
    private readonly _maxEntries: number;

    constructor(maxEntries: number) {
        this._maxEntries = maxEntries;
    }

    get entries(): MemoryEntry[] {
        return this._entries;
    }

    get length(): number {
        return this._entries.length;
    }

    /** Serialize concurrent mutations: each fn runs after the previous settles. */
    async withLock<T>(fn: () => Promise<T>): Promise<T> {
        let release: () => void;
        const prev = this._lock;
        this._lock = new Promise<void>((resolve) => {
            release = resolve;
        });
        await prev;
        try {
            return await fn();
        } finally {
            release!();
        }
    }

    /** Replace the whole backing array. */
    setAll(entries: MemoryEntry[]): void {
        this._entries = entries;
    }

    clear(): void {
        this._entries = [];
    }

    slice(limit?: number): MemoryEntry[] {
        return limit ? this._entries.slice(0, limit) : this._entries;
    }

    get(id: string): MemoryEntry | undefined {
        return this._entries.find((m) => m.id === id);
    }

    findIndex(id: string): number {
        return this._entries.findIndex((m) => m.id === id);
    }

    /** Prepend a single entry, trimming to maxEntries. */
    unshift(entry: MemoryEntry): void {
        this._entries.unshift(entry);
        if (this._entries.length > this._maxEntries) this._entries.length = this._maxEntries;
    }

    /** Replace existing by id, otherwise prepend (trimmed to maxEntries). */
    upsert(entry: MemoryEntry): void {
        const existing = this._entries.findIndex((m) => m.id === entry.id);
        if (existing >= 0) {
            this._entries[existing] = entry;
        } else {
            this.unshift(entry);
        }
    }

    /** Prepend an array of entries (storeBatch), trimming to maxEntries. */
    prepend(entries: MemoryEntry[]): void {
        this._entries = [...entries, ...this._entries];
        if (this._entries.length > this._maxEntries) {
            this._entries = this._entries.slice(0, this._maxEntries);
        }
    }

    /** Replace element at a known index. */
    replaceAt(idx: number, entry: MemoryEntry): void {
        this._entries[idx] = entry;
    }

    /** Remove element at a known index. */
    spliceAt(idx: number): void {
        this._entries.splice(idx, 1);
    }

    /** In-place mutation of a single entry by id. */
    mutate(id: string, updater: (entry: MemoryEntry) => void): void {
        const mem = this._entries.find((m) => m.id === id);
        if (mem) updater(mem);
    }

    /**
     * Filter the array in place; returns the removed entries.
     * Used by prune paths where removed items need worker cleanup.
     */
    retain(predicate: (m: MemoryEntry) => boolean): MemoryEntry[] {
        const removed = this._entries.filter((m) => !predicate(m));
        this._entries = this._entries.filter(predicate);
        return removed;
    }
}
