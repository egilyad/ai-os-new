import { genId } from '../../utils/gen-id';
import type { ILogger } from '../contracts/logger';
import type { IDatabaseService } from '../types/interfaces';
import { BucketStorageAdapter } from './storage-adapter';
import { EVENTS } from '../events/event-names';

export interface JournalEntry {
    id: string;
    agentId: string;
    agentName: string;
    taskType: string;
    taskDescription: string;
    outcome: 'success' | 'failure' | 'partial' | 'in_progress';
    durationMs: number;
    tokensUsed: number;
    notes?: string;
    tags: string[];
    timestamp: number;
}

export interface AgentJournalServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    logger?: ILogger;
    database: IDatabaseService;
    storage?: {
        list: () => Promise<JournalEntry[]>;
        save: (entry: JournalEntry) => Promise<void>;
        delete: (id: string) => Promise<void>;
        clear: () => Promise<void>;
    };
}

const STORAGE_KEY = 'agent_journal_v1';
const MAX_ENTRIES = 1000;

function createDbStorage(db: IDatabaseService): NonNullable<AgentJournalServiceDeps['storage']> {
    return {
        async list(): Promise<JournalEntry[]> {
            // Migration read: prefer db, fall back to localStorage for existing data
            const raw = await db.getKv<JournalEntry[]>(STORAGE_KEY);
            const lsRaw = await migrateFromLocalStorage();
            if (raw && raw.length > 0 && (!lsRaw || lsRaw.length === 0)) {
                return raw;
            }
            if (lsRaw && lsRaw.length > 0) {
                await db.setKv(STORAGE_KEY, lsRaw);
                await BucketStorageAdapter.AGENTS.remove(STORAGE_KEY);
                return lsRaw;
            }
            return raw && raw.length > 0 ? raw : [];
        },
        async save(entry: JournalEntry): Promise<void> {
            for (let attempt = 0; attempt < 3; attempt++) {
                const { value, version } = await db.getKvCas<JournalEntry[]>(STORAGE_KEY);
                const list = Array.isArray(value) ? value : [];
                const filtered = list.filter((e) => e.id !== entry.id);
                filtered.unshift(entry);
                if (await db.setKvCas(STORAGE_KEY, filtered.slice(0, MAX_ENTRIES), version)) return;
            }
        },
        async delete(id: string): Promise<void> {
            for (let attempt = 0; attempt < 3; attempt++) {
                const { value, version } = await db.getKvCas<JournalEntry[]>(STORAGE_KEY);
                const list = Array.isArray(value) ? value : [];
                if (
                    await db.setKvCas(
                        STORAGE_KEY,
                        list.filter((e) => e.id !== id),
                        version,
                    )
                )
                    return;
            }
        },
        async clear(): Promise<void> {
            await db.setKv(STORAGE_KEY, []);
        },
    };
}

async function migrateFromLocalStorage(): Promise<JournalEntry[] | null> {
    try {
        const raw = await BucketStorageAdapter.AGENTS.get<JournalEntry[]>(STORAGE_KEY);
        if (raw && Array.isArray(raw) && raw.length > 0) return raw;
    } catch {
        /* ignore */
    }
    return null;
}

const MAX_CACHE_SIZE = 500;

export class AgentJournalService {
    private deps: AgentJournalServiceDeps;
    private storage: NonNullable<AgentJournalServiceDeps['storage']>;
    private cache: Map<string, JournalEntry> = new Map();
    private initialized = false;
    private unsubs: Array<() => void> = [];

    constructor(deps: AgentJournalServiceDeps) {
        this.deps = deps;
        this.storage = deps.storage ?? createDbStorage(deps.database);
    }

    async init(): Promise<void> {
        if (this.initialized) return;
        try {
            const all = await this.storage.list();
            this.cache.clear();
            for (const e of all) this.cache.set(e.id, e);
        } catch (err) {
            this.deps.logger?.error('AgentJournal', 'init failed', { error: String(err) });
        }
        this.initialized = true;
        this.subscribe();
        if (this.cache.size > MAX_CACHE_SIZE) {
            const entries = Array.from(this.cache.entries()).sort(
                ([, a], [, b]) => a.timestamp - b.timestamp,
            );
            for (const [key] of entries.slice(0, entries.length - MAX_CACHE_SIZE)) {
                this.cache.delete(key);
            }
        }
    }

    private subscribe(): void {
        const off1 = this.deps.eventBus.on(EVENTS.COGNITIVE_STEP_ACTIVE, (raw: unknown) => {
            const e = raw as { nodeId: string };
            if (!e?.nodeId) return;
            this.record({
                agentId: e.nodeId,
                agentName: e.nodeId,
                taskType: 'cognitive_step',
                taskDescription: 'in_progress',
                outcome: 'in_progress' as const,
                durationMs: 0,
                tokensUsed: 0,
                tags: [],
            }).catch((err) =>
                this.deps.logger?.error('AgentJournal', 'record failed (COGNITIVE_STEP_ACTIVE)', {
                    error: String(err),
                }),
            );
        });
        this.unsubs.push(off1);

        const off2 = this.deps.eventBus.on(EVENTS.COGNITIVE_STEP_COMPLETED, (raw: unknown) => {
            const e = raw as {
                nodeId: string;
                status: 'done' | 'error';
                duration: number;
                output?: string;
                fullContent?: string;
            };
            if (!e?.nodeId) return;
            this.record({
                agentId: e.nodeId,
                agentName: e.nodeId,
                taskType: 'cognitive_step',
                taskDescription: (e.output ?? '').slice(0, 200),
                outcome: e.status === 'done' ? 'success' : ('failure' as const),
                durationMs: e.duration ?? 0,
                tokensUsed: 0,
                tags: [],
            }).catch((err) =>
                this.deps.logger?.error('AgentJournal', 'record failed', { error: String(err) }),
            );
        });
        this.unsubs.push(off2);

        const off3 = this.deps.eventBus.on('debate:runtime:agent:error', (raw: unknown) => {
            const e = raw as { agentId: string; error: string };
            if (!e?.agentId) return;
            this.record({
                agentId: e.agentId,
                agentName: e.agentId,
                taskType: 'debate',
                taskDescription: (e.error ?? '').slice(0, 200),
                outcome: 'failure' as const,
                durationMs: 0,
                tokensUsed: 0,
                tags: [],
            }).catch((err) =>
                this.deps.logger?.error('AgentJournal', 'record failed', { error: String(err) }),
            );
        });
        this.unsubs.push(off3);
    }

    destroy(): void {
        for (const off of this.unsubs) {
            try {
                off();
            } catch {
                /* noop */
            }
        }
        this.unsubs = [];
        this.cache.clear();
        this.initialized = false;
    }

    async record(input: Omit<JournalEntry, 'id' | 'timestamp'>): Promise<JournalEntry> {
        const entry: JournalEntry = {
            ...input,
            id: genId('je'),
            timestamp: Date.now(),
        };
        this.cache.set(entry.id, entry);
        if (this.cache.size > MAX_ENTRIES) {
            const entries = Array.from(this.cache.entries()).sort(
                ([, a], [, b]) => a.timestamp - b.timestamp,
            );
            const toRemove = entries.slice(0, Math.min(100, entries.length - 800));
            for (const [id] of toRemove) this.cache.delete(id);
        }
        try {
            await this.storage.save(entry);
        } catch (err) {
            this.deps.logger?.warn('AgentJournal', 'persist failed', { error: String(err) });
        }
        this.deps.eventBus.emit(EVENTS.AGENT_JOURNAL_ADDED, entry);
        return entry;
    }

    async remove(id: string): Promise<void> {
        this.cache.delete(id);
        try {
            await this.storage.delete(id);
        } catch (e) {
            this.deps.logger?.warn('AgentJournal', 'remove failed', { id, error: String(e) });
        }
        this.deps.eventBus.emit(EVENTS.AGENT_JOURNAL_REMOVED, { id });
    }

    async clear(): Promise<void> {
        this.cache.clear();
        try {
            await this.storage.clear();
        } catch (e) {
            this.deps.logger?.warn('AgentJournal', 'clear failed', { error: String(e) });
        }
        this.deps.eventBus.emit(EVENTS.AGENT_JOURNAL_CLEARED, undefined);
    }

    listAll(): JournalEntry[] {
        return Array.from(this.cache.values()).sort((a, b) => b.timestamp - a.timestamp);
    }

    listByAgent(agentId: string): JournalEntry[] {
        return this.listAll().filter((e) => e.agentId === agentId);
    }

    listByTag(tag: string): JournalEntry[] {
        const lc = tag.toLowerCase();
        return this.listAll().filter((e) => e.tags.some((t) => t.toLowerCase() === lc));
    }

    search(query: string): JournalEntry[] {
        if (!query.trim()) return this.listAll();
        const q = query.toLowerCase();
        return this.listAll().filter(
            (e) =>
                e.agentName.toLowerCase().includes(q) ||
                e.taskType.toLowerCase().includes(q) ||
                e.taskDescription.toLowerCase().includes(q) ||
                e.notes?.toLowerCase().includes(q) ||
                e.tags.some((t) => t.toLowerCase().includes(q)),
        );
    }

    getByDateRange(from: number, to: number): JournalEntry[] {
        return this.listAll().filter((e) => e.timestamp >= from && e.timestamp <= to);
    }

    count(): number {
        return this.cache.size;
    }

    countByAgent(agentId: string): number {
        return this.listByAgent(agentId).length;
    }

    getAllTags(): string[] {
        const set = new Set<string>();
        for (const e of this.cache.values()) for (const t of e.tags) set.add(t);
        return Array.from(set).sort();
    }

    getAllAgents(): string[] {
        const set = new Set<string>();
        for (const e of this.cache.values()) set.add(e.agentId);
        return Array.from(set).sort();
    }

    getAgentStats(agentId: string): {
        totalTasks: number;
        successRate: number;
        totalDurationMs: number;
        avgDurationMs: number;
        totalTokens: number;
        lastActive: number;
    } {
        const entries = this.listByAgent(agentId);
        if (entries.length === 0) {
            return {
                totalTasks: 0,
                successRate: 0,
                totalDurationMs: 0,
                avgDurationMs: 0,
                totalTokens: 0,
                lastActive: 0,
            };
        }
        const success = entries.filter((e) => e.outcome === 'success').length;
        const totalDuration = entries.reduce((s, e) => s + e.durationMs, 0);
        const totalTokens = entries.reduce((s, e) => s + e.tokensUsed, 0);
        const lastActive = Math.max(...entries.map((e) => e.timestamp));
        return {
            totalTasks: entries.length,
            successRate: success / entries.length,
            totalDurationMs: totalDuration,
            avgDurationMs: totalDuration / entries.length,
            totalTokens,
            lastActive,
        };
    }
}
