import type {
    MemoryEntry,
    MemorySearchResult,
    MemoryStats,
    MemoryPruneOptions,
    MemoryPruneResult,
} from '../types/memory-types';
import type { Result } from './results';
import type { MemoryError } from './errors';
import type { ITransaction } from './transaction';

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
    store(entry: Omit<MemoryEntry, 'id'>, tx?: ITransaction): Promise<void>;
    storeBatch(entries: Omit<MemoryEntry, 'id'>[], tx?: ITransaction): Promise<void>;
    search(query: string, limit?: number, mode?: string): Promise<MemorySearchResult[]>;
    getMemories(limit?: number): MemoryEntry[];
    getMemory(id: string): MemoryEntry | undefined;
    deleteMemory(id: string, tx?: ITransaction): Promise<void>;
    updateMemory(id: string, content: string, tx?: ITransaction): Promise<string | undefined>;
    getStats(): MemoryStats;
    prune(options: MemoryPruneOptions): Promise<MemoryPruneResult>;
    clear(tx?: ITransaction): Promise<void>;
    recall(context: string, limit?: number): MemoryEntry[];
    searchAdvanced?(query: MemoryQuery): Promise<MemorySearchResult[]>;
    tryStore?(entry: Omit<MemoryEntry, 'id'>): Result<void, MemoryError>;
    tryDelete?(id: string): Result<void, MemoryError>;
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
    recall(context: string, limit?: number): MemoryEntry[];
    searchAdvanced?(query: MemoryQuery): Promise<MemorySearchResult[]>;
    getCapabilities(): MemoryCapability;
    tryStore?(entry: Omit<MemoryEntry, 'id'>): Result<void, MemoryError>;
    tryDelete?(id: string): Result<void, MemoryError>;
}
