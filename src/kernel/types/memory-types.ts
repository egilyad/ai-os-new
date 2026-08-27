export type MemorySource =
    | 'decision'
    | 'observation'
    | 'fact'
    | 'chat_response'
    | 'chat_query'
    | 'system'
    | 'agent'
    | 'tool'
    | 'user_input'
    | 'embedding'
    | 'summary';
export type MemoryImportance = 'low' | 'medium' | 'high' | 'critical';

export interface MemoryTags {
    labels: string[];
    category?: string;
    domain?: string;
}

export interface MemoryRelation {
    targetId: string;
    type: 'similar' | 'causal' | 'sequential' | 'derived' | 'reference';
    weight: number;
}

export type MemoryCollection = 'long_term' | 'ephemeral' | 'rag_sources';

export interface MemoryEntry {
    id: string;
    content: string;
    vector?: number[];
    metadata: {
        source: MemorySource | string;
        type: string;
        collection?: MemoryCollection;
        timestamp: number;
        importance: number;
        chatId?: string;
        requestId?: string;
        agentId?: string;
        roleId?: string;
        finishReason?: string;
        status?: string;
        tags?: MemoryTags;
        vectorData?: {
            dimensions?: number;
        };
        relations?: MemoryRelation[];
        importanceLabel?: MemoryImportance;
        tokenCount?: number;
        ttl?: number;
        accessCount?: number;
        lastAccessed?: number;
        sessionId?: string;
        parentId?: string;
        childrenIds?: string[];
    };
    score?: number;
    embedding?: number[];
}

export interface MemorySearchQuery {
    text: string;
    semantic?: boolean;
    limit?: number;
    minScore?: number;
    source?: MemorySource | string;
    type?: string;
    timeRange?: { from: number; to: number };
    importanceMin?: number;
    tags?: string[];
    agentId?: string;
    sessionId?: string;
}

export interface MemorySearchResult {
    entry: MemoryEntry;
    score: number;
    matchedOn: 'semantic' | 'keyword' | 'hybrid';
}

export interface MemoryStats {
    totalEntries: number;
    totalTokens: number;
    uniqueSources: number;
    byType: Record<string, number>;
    byImportance: Record<MemoryImportance, number>;
    avgImportance: number;
    oldestEntry: number;
    newestEntry: number;
    totalStorageBytes: number;
    lastPruned: number | null;
}

export function makeEmptyMemoryStats(): MemoryStats {
    return {
        totalEntries: 0,
        totalTokens: 0,
        uniqueSources: 0,
        byType: {},
        byImportance: {} as Record<MemoryImportance, number>,
        avgImportance: 0,
        oldestEntry: 0,
        newestEntry: 0,
        totalStorageBytes: 0,
        lastPruned: null,
    };
}

/** Compute MemoryStats from an array of MemoryEntry (used by all 7 stores). */
export function computeMemoryStats(entries: MemoryEntry[]): MemoryStats {
    if (entries.length === 0) return makeEmptyMemoryStats();

    const sources = new Set<string>();
    const byType: Record<string, number> = {};
    const byImportance: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    let totalTokens = 0;
    let importanceSum = 0;
    let importanceCount = 0;
    let oldest = Infinity;
    let newest = 0;

    for (const e of entries) {
        if (e.metadata.source) sources.add(e.metadata.source);
        const t = e.metadata.type || 'unknown';
        byType[t] = (byType[t] || 0) + 1;

        const imp = e.metadata.importance || 0;
        importanceSum += imp;
        importanceCount++;
        if (imp >= 8) byImportance.critical!++;
        else if (imp >= 5) byImportance.high!++;
        else if (imp >= 3) byImportance.medium!++;
        else byImportance.low!++;

        const ts = e.metadata.timestamp || 0;
        if (ts > 0) {
            if (ts < oldest) oldest = ts;
            if (ts > newest) newest = ts;
        }

        totalTokens += e.metadata.tokenCount ?? Math.ceil(e.content.length / 4);
    }

    const totalStorageBytes = entries.reduce((s, e) => s + e.content.length * 2, 0);

    return {
        totalEntries: entries.length,
        totalTokens,
        uniqueSources: sources.size,
        byType,
        byImportance,
        avgImportance: importanceCount > 0 ? importanceSum / importanceCount : 0,
        oldestEntry: oldest === Infinity ? 0 : oldest,
        newestEntry: newest,
        totalStorageBytes,
        lastPruned: null,
    };
}

export interface MemoryPruneOptions {
    olderThan?: number;
    importanceBelow?: number;
    maxEntries?: number;
    types?: string[];
    dryRun?: boolean;
}

export interface MemoryPruneResult {
    removed: number;
    bytesFreed: number;
    details: { type: string; count: number }[];
}
