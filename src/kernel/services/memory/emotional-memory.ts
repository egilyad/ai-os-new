import type { MemoryEntry, MemoryStats } from '../../types/memory-types';
import { computeMemoryStats } from '../../types/memory-types';
import type {
    IMemoryStore,
    MemoryStoreQuery,
    ConsolidationReport,
    MemoryStoreSnapshot,
} from '../../contracts/memory-store';
import { MemoryStoreType } from '../../contracts/memory-store';

const MAX_EMOTIONAL = 10000;

export interface EmotionalTag {
    emotion: 'joy' | 'anger' | 'sadness' | 'surprise' | 'fear' | 'disgust' | 'neutral';
    intensity: number;
}

export class EmotionalMemoryStore implements IMemoryStore {
    readonly type = MemoryStoreType.EMOTIONAL;
    private entries: MemoryEntry[] = [];

    async store(entry: Omit<MemoryEntry, 'id'>): Promise<string> {
        const id = crypto.randomUUID();
        const full: MemoryEntry = { ...entry, id } as MemoryEntry;
        full.id = id;
        full.metadata.importance = (full.metadata.importance || 0) + 0.2;
        this.entries.push(full);
        if (this.entries.length > MAX_EMOTIONAL) {
            this.entries.sort((a, b) => (a.metadata.timestamp || 0) - (b.metadata.timestamp || 0));
            this.entries = this.entries.slice(-MAX_EMOTIONAL);
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
        if (query.importanceMin)
            results = results.filter((e) => (e.metadata.importance || 0) >= query.importanceMin!);
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
        const old = this.entries.filter((e) => {
            const ageHours = (Date.now() - (e.metadata.timestamp || 0)) / 3600000;
            return ageHours > 720;
        });
        old.forEach((e) => {
            const idx = this.entries.findIndex((x) => x.id === e.id);
            if (idx >= 0) this.entries.splice(idx, 1);
        });
        return {
            timestamp: Date.now(),
            storesConsolidated: [this.type],
            entriesForgotten: old.length,
            entriesConsolidated: this.entries.length,
            newSemanticEntries: Math.ceil(old.length / 5),
            durationMs: 0,
        };
    }
}
