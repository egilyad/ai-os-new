import type { MemoryEntry, MemoryStats } from '../../types/memory-types';
import { computeMemoryStats } from '../../types/memory-types';
import type {
    IMemoryStore,
    MemoryStoreQuery,
    ConsolidationReport,
    MemoryStoreSnapshot,
} from '../../contracts/memory-store';
import { MemoryStoreType } from '../../contracts/memory-store';

const MAX_SPATIAL = 1000;

export interface SpatialAnchor {
    position: { x: number; y: number; z?: number };
    room: string;
    tags: string[];
}

export class SpatialMemoryStore implements IMemoryStore {
    readonly type = MemoryStoreType.SPATIAL;
    private entries: MemoryEntry[] = [];
    private anchors: Map<string, SpatialAnchor> = new Map();

    async store(entry: Omit<MemoryEntry, 'id'>): Promise<string> {
        const id = crypto.randomUUID();
        const full: MemoryEntry = { ...entry, id } as MemoryEntry;
        full.id = id;
        this.entries.push(full);
        if (this.entries.length > MAX_SPATIAL) {
            this.entries.shift();
        }
        return id;
    }

    setAnchor(entryId: string, anchor: SpatialAnchor): void {
        this.anchors.set(entryId, anchor);
        if (this.anchors.size > MAX_SPATIAL) {
            const oldest = this.anchors.keys().next().value;
            if (oldest !== undefined) this.anchors.delete(oldest);
        }
    }

    getAnchor(entryId: string): SpatialAnchor | undefined {
        return this.anchors.get(entryId);
    }

    getEntriesByRoom(room: string): MemoryEntry[] {
        const ids = new Set<string>();
        for (const [id, anchor] of this.anchors) {
            if (anchor.room === room) ids.add(id);
        }
        return this.entries.filter((e) => ids.has(e.id));
    }

    async query(query: MemoryStoreQuery): Promise<MemoryEntry[]> {
        let results = [...this.entries];
        if (query.tags?.length) {
            const anchoredIds = new Set<string>();
            for (const [id, anchor] of this.anchors) {
                if (anchor.tags.some((t) => query.tags!.includes(t))) anchoredIds.add(id);
            }
            results = results.filter((e) => anchoredIds.has(e.id));
        }
        const q = query.query.toLowerCase();
        if (q) results = results.filter((e) => e.content.toLowerCase().includes(q));
        results.sort((a, b) => (b.metadata.timestamp || 0) - (a.metadata.timestamp || 0));
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
        this.anchors.delete(id);
    }

    async clear(): Promise<void> {
        this.entries = [];
        this.anchors.clear();
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
