import type { MemoryEntry } from '../types/memory-types';

export interface MemoryRepository {
    getAll(): Promise<MemoryEntry[]>;
    get(id: string): Promise<MemoryEntry | undefined>;
    store(entry: Omit<MemoryEntry, 'id'>): Promise<MemoryEntry>;
    upsert(entry: Omit<MemoryEntry, 'id'>): Promise<MemoryEntry>;
    delete(id: string): Promise<void>;
    search(query: string, options?: { limit?: number }): Promise<MemoryEntry[]>;
    prune(beforeTimestamp: number): Promise<number>;
    clear(): Promise<void>;
}

export interface KvRepository {
    get<T>(id: string): Promise<T | null>;
    set<T>(id: string, value: T): Promise<void>;
    delete(id: string): Promise<void>;
    list(prefix?: string): Promise<Array<{ id: string; value: unknown }>>;
    clear(): Promise<void>;
}
