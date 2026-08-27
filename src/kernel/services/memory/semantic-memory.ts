import type { MemoryEntry, MemoryStats } from '../../types/memory-types';
import { computeMemoryStats } from '../../types/memory-types';
import type {
    IMemoryStore,
    MemoryStoreQuery,
    ConsolidationReport,
    MemoryStoreSnapshot,
} from '../../contracts/memory-store';
import { MemoryStoreType } from '../../contracts/memory-store';

const MAX_SEMANTIC = 100000;

export class SemanticMemoryStore implements IMemoryStore {
    readonly type = MemoryStoreType.SEMANTIC;
    private entries: MemoryEntry[] = [];

    async store(entry: Omit<MemoryEntry, 'id'>): Promise<string> {
        const id = crypto.randomUUID();
        const full: MemoryEntry = { ...entry, id } as MemoryEntry;
        full.id = id;
        const dup = this.entries.find((e) => {
            const s1 = e.content.slice(0, 100);
            const s2 = full.content.slice(0, 100);
            return (
                s1 === s2 ||
                (e.metadata.source === full.metadata.source &&
                    e.metadata.type === full.metadata.type)
            );
        });
        if (dup) {
            dup.metadata.accessCount = (dup.metadata.accessCount || 0) + 1;
            dup.metadata.lastAccessed = Date.now();
            return dup.id;
        }
        this.entries.push(full);
        if (this.entries.length > MAX_SEMANTIC) {
            this.entries.sort(
                (a, b) => (a.metadata.accessCount || 0) - (b.metadata.accessCount || 0),
            );
            this.entries = this.entries.slice(0, MAX_SEMANTIC);
        }
        return id;
    }

    async query(query: MemoryStoreQuery): Promise<MemoryEntry[]> {
        let results = [...this.entries];
        if (query.timeRange)
            results = results.filter((e) => {
                const ts = e.metadata.timestamp || 0;
                return ts >= query.timeRange!.from && ts <= query.timeRange!.to;
            });
        const q = query.query.toLowerCase();
        if (q) results = results.filter((e) => e.content.toLowerCase().includes(q));
        results.sort((a, b) => (b.metadata.importance || 0) - (a.metadata.importance || 0));
        return results.slice(0, query.limit || 20);
    }

    async recall(context: string, limit = 5): Promise<MemoryEntry[]> {
        return this.query({ query: context, limit });
    }

    async get(id: string): Promise<MemoryEntry | undefined> {
        const e = this.entries.find((x) => x.id === id);
        if (e) {
            e.metadata.accessCount = (e.metadata.accessCount || 0) + 1;
            e.metadata.lastAccessed = Date.now();
        }
        return e;
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
        const before = this.entries.length;
        const dups = new Map<string, MemoryEntry[]>();
        for (const e of this.entries) {
            const key = e.content.slice(0, 100);
            if (!dups.has(key)) dups.set(key, []);
            dups.get(key)!.push(e);
        }
        let removed = 0;
        for (const [, group] of dups) {
            if (group.length > 1) {
                group.sort((a, b) => (b.metadata.timestamp || 0) - (a.metadata.timestamp || 0));
                group.slice(1).forEach((e) => {
                    const idx = this.entries.findIndex((x) => x.id === e.id);
                    if (idx >= 0) {
                        this.entries.splice(idx, 1);
                        removed++;
                    }
                });
            }
        }
        return {
            timestamp: Date.now(),
            storesConsolidated: [this.type],
            entriesForgotten: removed,
            entriesConsolidated: before - removed,
            newSemanticEntries: 0,
            durationMs: 0,
        };
    }
}
