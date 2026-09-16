import type { MemoryEntry, MemoryStats } from '../../types/memory-types';
import { computeMemoryStats } from '../../types/memory-types';
import type {
    IMemoryStore,
    MemoryStoreQuery,
    ConsolidationReport,
    MemoryStoreSnapshot,
} from '../../contracts/memory-store';
import { MemoryStoreType } from '../../contracts/memory-store';
import type { MemoryService } from '../memory-engine';

export class ServiceBackedMemoryStore implements IMemoryStore {
    readonly type: MemoryStoreType;
    private memoryService: () => MemoryService | undefined;

    constructor(type: MemoryStoreType, memoryService: () => MemoryService | undefined) {
        this.type = type;
        this.memoryService = memoryService;
    }

    async store(entry: Omit<MemoryEntry, 'id'>): Promise<string> {
        const svc = this.memoryService();
        if (!svc) return '';
        const tagged = {
            ...entry,
            metadata: { ...entry.metadata, type: this.type },
        } as MemoryEntry;
        await svc.store(tagged);
        return tagged.id || '';
    }

    async query(query: MemoryStoreQuery): Promise<MemoryEntry[]> {
        const svc = this.memoryService();
        if (!svc) return [];
        const all = (svc as unknown as { memories: MemoryEntry[] }).memories || [];
        let results = all.filter((e) => (e.metadata.type || '').startsWith(this.type));
        if (query.timeRange)
            results = results.filter((e) => {
                const ts = e.metadata.timestamp || 0;
                return ts >= query.timeRange!.from && ts <= query.timeRange!.to;
            });
        if (query.importanceMin)
            results = results.filter((e) => (e.metadata.importance || 0) >= query.importanceMin!);
        if (query.sessionId)
            results = results.filter((e) => e.metadata.sessionId === query.sessionId);
        if (query.agentId) results = results.filter((e) => e.metadata.agentId === query.agentId);
        const q = query.query.toLowerCase();
        if (q) results = results.filter((e) => e.content.toLowerCase().includes(q));
        results.sort((a, b) => (b.metadata.timestamp || 0) - (a.metadata.timestamp || 0));
        return results.slice(0, query.limit || 50);
    }

    async recall(context: string, limit = 10): Promise<MemoryEntry[]> {
        return this.query({ query: context, limit });
    }

    async get(id: string): Promise<MemoryEntry | undefined> {
        const svc = this.memoryService();
        if (!svc) return undefined;
        const all = (svc as unknown as { memories: MemoryEntry[] }).memories || [];
        return all.find((e) => e.id === id && (e.metadata.type || '').startsWith(this.type));
    }

    async delete(id: string): Promise<void> {
        const svc = this.memoryService();
        if (!svc) return;
        await svc.deleteMemory(id);
    }

    async clear(): Promise<void> {
        const svc = this.memoryService();
        if (!svc) return;
        const all = (svc as unknown as { memories: MemoryEntry[] }).memories || [];
        for (const e of all) {
            if ((e.metadata.type || '').startsWith(this.type)) {
                await svc.deleteMemory(e.id);
            }
        }
    }

    async getStats(): Promise<MemoryStats> {
        const svc = this.memoryService();
        if (!svc) return { totalEntries: 0, byType: {}, byImportance: {} } as MemoryStats;
        const all = (svc as unknown as { memories: MemoryEntry[] }).memories || [];
        const filtered = all.filter((e) => (e.metadata.type || '').startsWith(this.type));
        return computeMemoryStats(filtered);
    }

    async snapshot(): Promise<MemoryStoreSnapshot> {
        const svc = this.memoryService();
        let entryCount = 0;
        let totalContent = 0;
        let oldestEntry = Date.now();
        let newestEntry = 0;
        if (svc) {
            const all = (svc as unknown as { memories: MemoryEntry[] }).memories || [];
            const filtered = all.filter((e) => (e.metadata.type || '').startsWith(this.type));
            entryCount = filtered.length;
            for (const e of filtered) {
                totalContent += e.content.length;
                const ts = e.metadata.timestamp || 0;
                if (ts && ts < oldestEntry) oldestEntry = ts;
                if (ts > newestEntry) newestEntry = ts;
            }
        }
        return { type: this.type, entryCount, memoryUsage: totalContent, oldestEntry, newestEntry };
    }

    async consolidate(): Promise<ConsolidationReport> {
        return {
            timestamp: Date.now(),
            storesConsolidated: [this.type],
            entriesForgotten: 0,
            entriesConsolidated: 0,
            newSemanticEntries: 0,
            durationMs: 0,
        };
    }
}
