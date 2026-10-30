import type {
    MemoryEntry,
    MemorySearchResult,
    MemoryStats,
    MemoryPruneOptions,
    MemoryPruneResult,
} from '../types/memory-types';

export interface MemoryCapability {
    readonly maxEntries: number;
    readonly maxStorageBytes: number;
    readonly supportedSearchModes: string[];
    readonly supportsBatchOperations: boolean;
    readonly supportsPruning: boolean;
    readonly ttlSeconds?: number;
}

export interface MemoryQuery {
    query: string;
    limit?: number;
    mode?: string;
    filter?: Record<string, unknown>;
    minScore?: number;
}

export interface IMemoryEngine {
    store(entry: Omit<MemoryEntry, 'id'>): Promise<void>;
    storeBatch(entries: Omit<MemoryEntry, 'id'>[]): Promise<void>;
    search(query: string, limit?: number, mode?: string): Promise<MemorySearchResult[]>;
    getMemories(limit?: number): MemoryEntry[];
    getMemory(id: string): MemoryEntry | undefined;
    deleteMemory(id: string): Promise<void>;
    updateMemory(id: string, content: string): Promise<string | undefined>;
    getStats(): MemoryStats;
    prune(options: MemoryPruneOptions): Promise<MemoryPruneResult>;
    clear(): Promise<void>;
    recall(context: string, limit?: number, filter?: Record<string, unknown>): MemoryEntry[];
    searchAdvanced?(query: MemoryQuery): Promise<MemorySearchResult[]>;
    getCapabilities(): MemoryCapability;
    /**
     * Re-embed existing entries with the active provider embedding model.
     * Returns how many entries were re-embedded and how many were skipped.
     */
    backfillProviderEmbeddings?(opts?: {
        batchSize?: number;
        limit?: number;
    }): Promise<{ embedded: number; skipped: number; failed: boolean }>;
    tryStore?(entry: Omit<MemoryEntry, 'id'>): Result<void, MemoryError>;
    tryDelete?(id: string): Result<void, MemoryError>;
}
