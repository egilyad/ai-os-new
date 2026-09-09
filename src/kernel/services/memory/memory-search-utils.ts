import type { MemoryEntry, MemorySearchResult, MemoryStats } from '../../types/memory-types';
import { estimateTokenCount } from '../../../llm/utils/token-counter';

/** Local keyword fallback used when the worker is unavailable. */
export function keywordFilterSearch(
    memories: MemoryEntry[],
    query: string,
    limit: number,
): MemorySearchResult[] {
    return memories
        .filter((m) => m.content.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit)
        .map((e) => ({ entry: e, score: 1, matchedOn: 'keyword' as const }));
}

/** Recall ranking: score memories by keyword overlap with the context. */
export function recallRank(memories: MemoryEntry[], context: string, limit: number): MemoryEntry[] {
    const keywords = context
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
    if (keywords.length === 0) return memories.slice(0, limit);

    const scored = memories.map((m) => {
        const content = m.content.toLowerCase();
        const matches = keywords.filter((k) => content.includes(k)).length;
        return { entry: m, score: matches / keywords.length };
    });

    return scored
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => ({ ...s.entry, score: s.score }));
}

/** Aggregate MemoryStats from a memory list (getStats implementation). */
export function computeEngineStats(memories: MemoryEntry[]): MemoryStats {
    const byType: Record<string, number> = {};
    const byImportance: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    let totalImportance = 0;

    for (const m of memories) {
        const type = m.metadata.type ?? 'unknown';
        byType[type] = (byType[type] || 0) + 1;
        const imp = m.metadata.importance ?? 0;
        const label = imp < 0.3 ? 'low' : imp < 0.6 ? 'medium' : imp < 0.9 ? 'high' : 'critical';
        byImportance[label] = (byImportance[label] || 0) + 1;
        totalImportance += imp;
    }

    return {
        totalEntries: memories.length,
        totalTokens: memories.reduce(
            (s, m) => s + (m.metadata.tokenCount || estimateTokenCount(m.content)),
            0,
        ),
        uniqueSources: new Set(memories.map((m) => m.metadata.source)).size,
        byType,
        byImportance: byImportance as MemoryStats['byImportance'],
        avgImportance: memories.length > 0 ? totalImportance / memories.length : 0,
        oldestEntry:
            memories.length > 0 ? Math.min(...memories.map((m) => m.metadata.timestamp ?? 0)) : 0,
        newestEntry:
            memories.length > 0 ? Math.max(...memories.map((m) => m.metadata.timestamp ?? 0)) : 0,
        totalStorageBytes: memories.reduce(
            (s, m) => s + new TextEncoder().encode(m.content).length,
            0,
        ),
        lastPruned: null,
    };
}
