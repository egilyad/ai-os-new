import type { MemoryEntry, MemoryStats } from '../types/memory-types';
import type {
    IMemoryStore,
    MemoryStoreQuery,
    ConsolidationReport,
} from '../contracts/memory-store';
import { MemoryStoreType } from '../contracts/memory-store';
import type { MemoryService } from './memory-engine';
import { ServiceBackedMemoryStore } from './memory/service-backed-memory';
import { SleepEngine } from './memory/sleep-engine';
import { MemoryPalace } from './memory/memory-palace';
import type { PalaceState } from './memory/memory-palace';

export class MemoryOrchestrator {
    readonly stores: Map<MemoryStoreType, IMemoryStore>;
    readonly sleepEngine: SleepEngine;
    readonly palace: MemoryPalace;

    constructor(private memoryService?: () => MemoryService | undefined) {
        this.stores = new Map();
        this.registerDefaultStores();
        this.sleepEngine = new SleepEngine(this.stores);
        this.palace = new MemoryPalace(this.stores);
    }

    private getService(): MemoryService | undefined {
        return this.memoryService?.();
    }

    private registerDefaultStores(): void {
        const ms = () => this.getService();
        this.stores.set(
            MemoryStoreType.WORKING,
            new ServiceBackedMemoryStore(MemoryStoreType.WORKING, ms),
        );
        this.stores.set(
            MemoryStoreType.EPISODIC,
            new ServiceBackedMemoryStore(MemoryStoreType.EPISODIC, ms),
        );
        this.stores.set(
            MemoryStoreType.SEMANTIC,
            new ServiceBackedMemoryStore(MemoryStoreType.SEMANTIC, ms),
        );
        this.stores.set(
            MemoryStoreType.PROCEDURAL,
            new ServiceBackedMemoryStore(MemoryStoreType.PROCEDURAL, ms),
        );
        this.stores.set(
            MemoryStoreType.EMOTIONAL,
            new ServiceBackedMemoryStore(MemoryStoreType.EMOTIONAL, ms),
        );
        this.stores.set(
            MemoryStoreType.SOCIAL,
            new ServiceBackedMemoryStore(MemoryStoreType.SOCIAL, ms),
        );
        this.stores.set(
            MemoryStoreType.SPATIAL,
            new ServiceBackedMemoryStore(MemoryStoreType.SPATIAL, ms),
        );
    }

    async init(): Promise<void> {
        /* stores are self-initializing */
    }

    async destroy(): Promise<void> {
        this.stop();
    }

    start(): void {
        this.sleepEngine.start();
    }

    stop(): void {
        this.sleepEngine.stop();
    }

    getStore(type: MemoryStoreType): IMemoryStore | undefined {
        return this.stores.get(type);
    }

    async store(entry: Omit<MemoryEntry, 'id'>, storeType?: MemoryStoreType): Promise<string> {
        const store = storeType
            ? this.stores.get(storeType)
            : this.stores.get(MemoryStoreType.EPISODIC);
        if (!store) throw new Error(`Store ${storeType} not found`);
        this.sleepEngine.recordMutation();
        return store.store(entry);
    }

    async query(query: MemoryStoreQuery): Promise<MemoryEntry[]> {
        const store = query.store
            ? this.stores.get(query.store)
            : this.stores.get(MemoryStoreType.SEMANTIC);
        if (!store) return [];
        return store.query(query);
    }

    async recall(context: string, limit = 10): Promise<MemoryEntry[]> {
        const all: MemoryEntry[] = [];
        const seen = new Set<string>();
        for (const [, store] of this.stores) {
            const results = await store.recall(context, Math.ceil(limit / this.stores.size));
            for (const r of results) {
                if (!seen.has(r.id)) {
                    seen.add(r.id);
                    all.push(r);
                }
            }
        }
        all.sort((a, b) => (b.metadata.importance || 0) - (a.metadata.importance || 0));
        return all.slice(0, limit);
    }

    async consolidateAll(): Promise<ConsolidationReport[]> {
        const reports: ConsolidationReport[] = [];
        for (const [, store] of this.stores) {
            reports.push(await store.consolidate());
        }
        return reports;
    }

    async getStats(): Promise<Record<MemoryStoreType, MemoryStats>> {
        const stats: Record<string, MemoryStats> = {};
        for (const [type, store] of this.stores) {
            stats[type] = await store.getStats();
        }
        return stats as Record<MemoryStoreType, MemoryStats>;
    }

    async getPalaceState(): Promise<PalaceState> {
        return this.palace.getState();
    }

    async clearAll(): Promise<void> {
        for (const [, store] of this.stores) {
            await store.clear();
        }
    }
}
