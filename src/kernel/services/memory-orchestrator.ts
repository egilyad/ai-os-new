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
import { MIN_SUMMARY_ENTRIES } from './memory/memory-summarizer';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('MemoryOrchestrator');

export const CONSOLIDATION_SUMMARY_TYPE = 'consolidation_summary';
const SUMMARY_WINDOW_MS = 24 * 60 * 60 * 1000;
const SUMMARY_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const MAX_SUMMARIES = 5;
const SUMMARY_SCAN_LIMIT = 500;

/** Structural type so the orchestrator does not depend on the LLM client. */
export interface MemorySummarizerLike {
    summarize(entries: MemoryEntry[]): Promise<string | null>;
}

export class MemoryOrchestrator {
    readonly stores: Map<MemoryStoreType, IMemoryStore>;
    readonly sleepEngine: SleepEngine;
    readonly palace: MemoryPalace;

    constructor(
        private memoryService?: () => MemoryService | undefined,
        private summarizer?: () => MemorySummarizerLike | undefined,
    ) {
        this.stores = new Map();
        this.registerDefaultStores();
        this.sleepEngine = new SleepEngine(this.stores, {
            afterNightlyConsolidation: async () => {
                await this.summarizeRecent();
            },
        });
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
        try {
            await this.summarizeRecent();
        } catch (e) {
            LOGGER.warn('MemoryOrchestrator', 'summarization failed', {
                error: e instanceof Error ? e.message : String(e),
            });
        }
        return reports;
    }

    /**
     * LLM-summarize recent mesh entries into one `consolidation_summary` entry.
     * No-op without a summarizer (offline), below the entry threshold, during
     * the cooldown window, or when the text is unchanged. Keeps at most
     * MAX_SUMMARIES summaries (oldest pruned). Returns true when stored.
     */
    async summarizeRecent(windowMs: number = SUMMARY_WINDOW_MS): Promise<boolean> {
        const svc = this.getService();
        const summarizer = this.summarizer?.();
        if (!svc || !summarizer) return false;

        const now = Date.now();
        const all = svc.getMemories(SUMMARY_SCAN_LIMIT);
        const summaries = all
            .filter((e) => e.metadata.type === CONSOLIDATION_SUMMARY_TYPE)
            .sort((a, b) => (b.metadata.timestamp ?? 0) - (a.metadata.timestamp ?? 0));
        const recent = all.filter(
            (e) =>
                e.metadata.type !== CONSOLIDATION_SUMMARY_TYPE &&
                now - (e.metadata.timestamp ?? 0) <= windowMs &&
                e.content.trim().length > 0,
        );
        if (recent.length < MIN_SUMMARY_ENTRIES) return false;

        const text = await summarizer.summarize(recent);
        if (!text) return false;

        const latest = summaries[0];
        if (
            latest &&
            (latest.content.trim() === text.trim() ||
                now - (latest.metadata.timestamp ?? 0) < SUMMARY_COOLDOWN_MS)
        ) {
            return false;
        }

        await svc.store({
            content: text,
            metadata: {
                source: 'summary',
                type: CONSOLIDATION_SUMMARY_TYPE,
                timestamp: now,
                importance: 0.85,
            },
        });

        const excess = summaries.length - (MAX_SUMMARIES - 1);
        if (excess > 0) {
            for (const old of summaries.slice(summaries.length - excess)) {
                await svc.deleteMemory(old.id);
            }
        }
        return true;
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
