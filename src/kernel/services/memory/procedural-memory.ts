import type { MemoryEntry, MemoryStats } from '../../types/memory-types';
import { computeMemoryStats } from '../../types/memory-types';
import type {
    IMemoryStore,
    MemoryStoreQuery,
    ConsolidationReport,
    MemoryStoreSnapshot,
} from '../../contracts/memory-store';
import { MemoryStoreType } from '../../contracts/memory-store';

const MAX_PROCEDURAL = 10000;

export class ProceduralMemoryStore implements IMemoryStore {
    readonly type = MemoryStoreType.PROCEDURAL;
    private entries: MemoryEntry[] = [];

    async store(entry: Omit<MemoryEntry, 'id'>): Promise<string> {
        const id = crypto.randomUUID();
        const full: MemoryEntry = { ...entry, id } as MemoryEntry;
        full.id = id;
        this.entries.push(full);
        if (this.entries.length > MAX_PROCEDURAL) {
            this.entries.sort(
                (a, b) => (b.metadata.importance || 0) - (a.metadata.importance || 0),
            );
            this.entries = this.entries.slice(0, MAX_PROCEDURAL);
        }
        return id;
    }

    async query(query: MemoryStoreQuery): Promise<MemoryEntry[]> {
        let results = [...this.entries];
        if (query.tags?.length)
            results = results.filter((e) =>
                e.metadata.tags?.labels?.some((t) => query.tags!.includes(t)),
            );
        const q = query.query.toLowerCase();
        if (q) results = results.filter((e) => e.content.toLowerCase().includes(q));
        results.sort((a, b) => (b.metadata.importance || 0) - (a.metadata.importance || 0));
        return results.slice(0, query.limit || 20);
    }

    async recall(context: string, limit = 5): Promise<MemoryEntry[]> {
        return this.query({ query: context, limit });
    }

    async get(id: string): Promise<MemoryEntry | undefined> {
        return this.entries.find((e) => e.id === id);
    }

    async delete(id: string): Promise<void> {
        this.entries = this.entries.filter((e) => e.id !== id);
    }

    async clear(): Promise<void> {
        this.entries = [];
    }

    async getStats(): Promise<MemoryStats> {
        return computeMemoryStats(this.entries);
    }

    async snapshot(): Promise<MemoryStoreSnapshot> {
        const timestamps = this.entries.map((e) => e.metadata.timestamp || 0).filter(Boolean);
        return {
            type: this.type,
            entryCount: this.entries.length,
            memoryUsage: this.entries.reduce((s, e) => s + e.content.length * 2, 0),
            oldestEntry: timestamps.length ? Math.min(...timestamps) : 0,
            newestEntry: timestamps.length ? Math.max(...timestamps) : 0,
        };
    }

    async consolidate(): Promise<ConsolidationReport> {
        return {
            timestamp: Date.now(),
            storesConsolidated: [this.type],
            entriesForgotten: 0,
            entriesConsolidated: this.entries.length,
            newSemanticEntries: 0,
            durationMs: 0,
        };
    }
}
