import type { MemoryEntry, MemoryStats } from '../types/memory-types';

export enum MemoryStoreType {
    WORKING = 'working',
    EPISODIC = 'episodic',
    SEMANTIC = 'semantic',
    PROCEDURAL = 'procedural',
    EMOTIONAL = 'emotional',
    SOCIAL = 'social',
    SPATIAL = 'spatial',
}

export interface MemoryStoreQuery {
    query: string;
    limit?: number;
    minScore?: number;
    store?: MemoryStoreType;
    timeRange?: { from: number; to: number };
    importanceMin?: number;
    tags?: string[];
    agentId?: string;
    sessionId?: string;
}

export interface ConsolidationReport {
    timestamp: number;
    storesConsolidated: MemoryStoreType[];
    entriesForgotten: number;
    entriesConsolidated: number;
    newSemanticEntries: number;
    durationMs: number;
}

export interface MemoryStoreSnapshot {
    type: MemoryStoreType;
    entryCount: number;
    memoryUsage: number;
    oldestEntry: number;
    newestEntry: number;
}

export interface IMemoryStore {
    readonly type: MemoryStoreType;
    store(entry: Omit<MemoryEntry, 'id'>): Promise<string>;
    query(query: MemoryStoreQuery): Promise<MemoryEntry[]>;
    recall(context: string, limit?: number): Promise<MemoryEntry[]>;
    get(id: string): Promise<MemoryEntry | undefined>;
    delete(id: string): Promise<void>;
    clear(): Promise<void>;
    getStats(): Promise<MemoryStats>;
    snapshot(): Promise<MemoryStoreSnapshot>;
    consolidate(): Promise<ConsolidationReport>;
}

export function computeRetention(importance: number, ageHours: number): number {
    const T = 1 * Math.pow(2, Math.max(0, importance - 1));
    return Math.exp(-ageHours / T);
}

export function computeHalfLife(importance: number): number {
    return 1 * Math.pow(2, Math.max(0, importance - 1));
}
