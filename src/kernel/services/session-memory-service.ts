import type {
    ISessionMemoryService,
    SessionMemoryItem,
    SessionMemoryKind,
    SessionMemoryRecord,
} from '../contracts/session-memory';

export const SESSION_MEMORY_KEY = 'session_memory_v1';

const MAX_SESSIONS = 100;
const MAX_ITEMS = 400;

/** Per-kind retention caps so one noisy kind cannot crowd out the rest. */
const KIND_LIMITS: Record<SessionMemoryKind, number> = {
    objective: 1,
    file: 50,
    command: 30,
    decision: 40,
    issue: 40,
    note: 40,
};

const CONTEXT_ORDER: SessionMemoryKind[] = [
    'objective',
    'file',
    'command',
    'decision',
    'issue',
    'note',
];

const CONTEXT_LABELS: Record<SessionMemoryKind, string> = {
    objective: 'Objective',
    file: 'Files',
    command: 'Commands',
    decision: 'Decisions',
    issue: 'Open issues',
    note: 'Notes',
};

const MAX_ITEM_CHARS = 500;

function nowMs(): number {
    return Date.now();
}

/**
 * Durable, per-session scratchpad for coding agents. Loads lazily from the KV
 * store so it works even when resolved after boot, dedupes items, caps each kind
 * and persists on every mutation.
 */
export class SessionMemoryService implements ISessionMemoryService {
    private records = new Map<string, SessionMemoryRecord>();
    private loadPromise?: Promise<void>;

    constructor(
        private readonly deps: {
            database: {
                getKv: <T>(id: string) => Promise<T | null>;
                setKv: <T>(id: string, value: T) => Promise<void>;
            };
        },
    ) {}

    async init(): Promise<void> {
        await this.ensureLoaded();
    }

    destroy(): void {
        this.records.clear();
        this.loadPromise = undefined;
    }

    private ensureLoaded(): Promise<void> {
        if (!this.loadPromise) {
            this.loadPromise = this.load().catch(() => {
                /* corrupt/absent store: start empty */
            });
        }
        return this.loadPromise;
    }

    private async load(): Promise<void> {
        const saved = await this.deps.database.getKv<SessionMemoryRecord[]>(SESSION_MEMORY_KEY);
        if (!Array.isArray(saved)) return;
        for (const rec of saved) {
            if (rec && typeof rec.sessionId === 'string' && Array.isArray(rec.items)) {
                this.records.set(rec.sessionId, rec);
            }
        }
    }

    private async persist(): Promise<void> {
        const all = this.list();
        await this.deps.database.setKv(SESSION_MEMORY_KEY, all);
    }

    private emptyRecord(sessionId: string, at: number): SessionMemoryRecord {
        return { sessionId, items: [], createdAt: at, updatedAt: at };
    }

    async remember(
        sessionId: string,
        kind: SessionMemoryKind,
        text: string,
    ): Promise<SessionMemoryItem> {
        await this.ensureLoaded();
        const trimmed = text.trim().slice(0, MAX_ITEM_CHARS);
        if (!trimmed) throw new Error('text is required');
        const at = nowMs();
        const rec = this.records.get(sessionId) ?? this.emptyRecord(sessionId, at);

        if (kind === 'objective') {
            const item: SessionMemoryItem = { kind, text: trimmed, at };
            rec.objective = trimmed;
            rec.items = [item, ...rec.items.filter((i) => i.kind !== 'objective')];
            rec.updatedAt = at;
            this.records.set(sessionId, rec);
            this.evict();
            await this.persist();
            return item;
        }

        const existing = rec.items.find((i) => i.kind === kind && i.text === trimmed);
        if (existing) {
            existing.at = at;
            rec.updatedAt = at;
            this.records.set(sessionId, rec);
            await this.persist();
            return existing;
        }

        const item: SessionMemoryItem = { kind, text: trimmed, at };
        rec.items = [item, ...rec.items];
        this.trimKind(rec, kind);
        rec.updatedAt = at;
        this.records.set(sessionId, rec);
        this.evict();
        await this.persist();
        return item;
    }

    async setObjectiveIfEmpty(sessionId: string, text: string): Promise<boolean> {
        await this.ensureLoaded();
        const rec = this.records.get(sessionId);
        if (rec?.objective) return false;
        await this.remember(sessionId, 'objective', text);
        return true;
    }

    private trimKind(rec: SessionMemoryRecord, kind: SessionMemoryKind): void {
        const limit = KIND_LIMITS[kind];
        const ofKind = rec.items.filter((i) => i.kind === kind);
        if (ofKind.length <= limit) return;
        const drop = new Set(ofKind.slice(limit));
        rec.items = rec.items.filter((i) => !drop.has(i));
    }

    private evict(): void {
        while (this.records.size > MAX_SESSIONS) {
            let oldest: SessionMemoryRecord | undefined;
            for (const rec of this.records.values()) {
                if (!oldest || rec.updatedAt < oldest.updatedAt) oldest = rec;
            }
            if (!oldest) break;
            this.records.delete(oldest.sessionId);
        }
    }

    get(sessionId: string): SessionMemoryRecord | undefined {
        return this.records.get(sessionId);
    }

    snapshot(sessionId: string): SessionMemoryRecord {
        return this.records.get(sessionId) ?? this.emptyRecord(sessionId, nowMs());
    }

    buildContext(sessionId: string, options?: { maxItems?: number }): string {
        const rec = this.records.get(sessionId);
        if (!rec || rec.items.length === 0) return '';
        const maxItems = Math.max(1, Math.min(options?.maxItems ?? 20, MAX_ITEMS));
        const lines: string[] = ['## Session memory'];
        if (rec.objective) lines.push(`- Objective: ${rec.objective}`);
        for (const kind of CONTEXT_ORDER) {
            if (kind === 'objective') continue;
            const items = rec.items
                .filter((i) => i.kind === kind)
                .slice(0, maxItems)
                .map((i) => i.text);
            if (items.length === 0) continue;
            lines.push(`- ${CONTEXT_LABELS[kind]}: ${items.join('; ')}`);
        }
        return lines.join('\n');
    }

    async clear(sessionId: string): Promise<void> {
        await this.ensureLoaded();
        if (!this.records.delete(sessionId)) return;
        await this.persist();
    }

    list(): SessionMemoryRecord[] {
        return [...this.records.values()].sort((a, b) => b.updatedAt - a.updatedAt);
    }
}
