import { create } from 'zustand';
import { liveQuery } from 'dexie';
import { runtime } from '../../kernel/runtime';
import { genId } from '../../utils/gen-id';
import { getDexieDb, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('DebateSessionStore');
import type { DebateParticipant, DebateSession } from '../../kernel/contracts/debate-types';
import type { DebateSessionMeta, DebateSessionStoreShape } from './types';
import type { ISessionManager } from '../../kernel/contracts/session-manager';
import type { DatabaseService } from '../../kernel/services/database-service';
import { safeJsonParse } from '../../kernel/utils/safe-json';

interface DebateRecord {
    id: string;
    topic: string;
    topologyType?: string;
    phase: string;
    round: number;
    participants?: string;
    tags?: string[];
    folder?: string;
    isArchived?: boolean;
    isPinned?: boolean;
    createdAt: number;
    updatedAt: number;
    arguments?: string;
    topology?: string;
    totalTokens?: number;
    totalCost?: number;
}

let _sm: ISessionManager | null = null;
let _db: DatabaseService | null = null;

function sm(): ISessionManager | null {
    if (!_sm) {
        try {
            _sm = runtime.getService<ISessionManager>('sessionManagerService');
        } catch {
            _sm = null;
        }
    }
    return _sm;
}

function db(): DatabaseService | null {
    if (!_db) {
        try {
            _db = runtime.getService<DatabaseService>('database');
        } catch {
            _db = null;
        }
    }
    return _db;
}

async function getLinkedIds(id: string): Promise<string[]> {
    try {
        const mgr = sm();
        if (!mgr) return [];
        const links = await mgr.getLinked(id);
        return links.map((l) => (l.fromId === id ? l.toId : l.fromId));
    } catch (err) {
        LOGGER.warn('DebateSessionStore', 'getLinkedIds failed', { error: err });
        return [];
    }
}

function toMeta(r: DebateRecord, linkedIds?: string[]): DebateSessionMeta {
    let p: DebateParticipant[];
    try {
        p = (safeJsonParse(r.participants || '[]') as DebateParticipant[]) ?? [];
    } catch (err) {
        LOGGER.warn('DebateSessionStore', 'toMeta parse participants failed', { error: err });
        p = [];
    }
    return {
        id: r.id,
        topic: r.topic || '(untitled)',
        strategy: (r.topologyType || 'round_robin') as DebateSessionMeta['strategy'],
        phase: r.phase as DebateSessionMeta['phase'],
        round: r.round || 0,
        participants: p,
        tags: r.tags ?? [],
        folder: r.folder ?? '',
        isArchived: r.isArchived ?? false,
        isPinned: r.isPinned ?? false,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        linkedSessionIds: linkedIds ?? [],
    };
}

async function loadFull(id: string): Promise<DebateSession | null> {
    try {
        const d = db();
        if (!d) return null;
        const r = (await d.debateSessions.get(id)) as DebateRecord | undefined;
        if (!r) return null;
        let args: unknown[] = [];
        let parts: unknown[] = [];
        try {
            args = (safeJsonParse(r.arguments || '[]') as unknown[]) ?? [];
        } catch (err) {
            LOGGER.warn('DebateSessionStore', 'loadFull parse arguments failed', { error: err });
            args = [];
        }
        try {
            parts = (safeJsonParse(r.participants || '[]') as unknown[]) ?? [];
        } catch (err) {
            LOGGER.warn('DebateSessionStore', 'loadFull parse participants failed', { error: err });
            parts = [];
        }
        let storedConfig: Record<string, unknown> = {};
        try {
            const topology = safeJsonParse(r.topology || '{}') as
                Record<string, unknown> | undefined;
            storedConfig = ((topology?.config || topology) as Record<string, unknown>) ?? {};
        } catch (err) {
            LOGGER.warn('DebateSessionStore', 'loadFull parse topology failed', { error: err });
        }
        return {
            id: r.id,
            topic: r.topic || '(untitled)',
            status: r.phase as DebateSession['status'],
            strategy: (r.topologyType || 'round_robin') as DebateSession['strategy'],
            maxRounds: 10,
            currentRound: r.round || 0,
            participants: Array.isArray(parts) ? (parts as DebateParticipant[]) : [],
            arguments: Array.isArray(args) ? (args as DebateSession['arguments']) : [],
            convergenceScore: 0,
            totalTokens: r.totalTokens || 0,
            totalCost: r.totalCost || 0,
            createdAt: r.createdAt,
            config: {
                roundDelayMs: 2000,
                maxTokens: 4096,
                temperature: 0.7,
                debateTemperature: 0.7,
                useModerator: false,
                timeoutMs: 30000,
                ...storedConfig,
            },
        };
    } catch (err) {
        LOGGER.warn('DebateSessionStore', 'loadFull failed', { error: err });
        return null;
    }
}

let liveSub: { unsubscribe: () => void } | null = null;
let liveInitialized = false;

async function recordsToMetas(records: DebateRecord[]): Promise<DebateSessionMeta[]> {
    return Promise.all(records.map(async (r) => toMeta(r, await getLinkedIds(r.id))));
}

function ensureLiveQuery(
    _set: (
        partial:
            | Partial<DebateSessionStoreShape>
            | ((prev: DebateSessionStoreShape) => Partial<DebateSessionStoreShape>),
    ) => void,
): void {
    if (liveInitialized) return;
    liveInitialized = true;

    const db = getDexieDb();
    const observable = liveQuery(() => db.debateSessions.orderBy('updatedAt').reverse().toArray());
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    liveSub = observable.subscribe({
        next: (records: DebateRecord[]) => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                const metas = await recordsToMetas(records);
                useDebateSessionStore.setState({ sessions: metas, isLoaded: true });
            }, 200);
        },
        error: (err: unknown) => {
            LOGGER.warn('DebateSessionStore', 'liveQuery error', { error: err });
            useDebateSessionStore.setState({ isLoaded: true });
        },
    });

    if (import.meta.hot) {
        import.meta.hot.dispose(() => {
            liveSub?.unsubscribe();
            liveSub = null;
            liveInitialized = false;
        });
    }
}

export const useDebateSessionStore = create<DebateSessionStoreShape>((set, get) => {
    ensureLiveQuery(set);

    return {
        sessions: [],
        activeSessionId: null,
        isLoaded: false,

        init: () => {
            /* liveQuery auto-subscribes on first import — no-op */
        },

        createSession: async (topic, strategy, participants, config) => {
            const id = genId('debate-session');
            const mgr = sm();
            if (!mgr) return null;
            await mgr.create(
                'debate',
                { id, title: topic, tags: [], folder: '' },
                {
                    topologyType: strategy,
                    participants: JSON.stringify(participants),
                    topology: JSON.stringify({ config }),
                    tags: [],
                    folder: '',
                },
            );
            const meta: DebateSessionMeta = {
                id,
                topic,
                strategy,
                phase: 'created',
                round: 0,
                participants,
                tags: [],
                folder: '',
                isArchived: false,
                isPinned: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                linkedSessionIds: [],
            };
            set((s) => ({ sessions: [meta, ...s.sessions], activeSessionId: id }));
            return id;
        },

        loadSession: async (id) => loadFull(id),

        saveCurrentSession: async () => {
            const id = get().activeSessionId;
            if (!id) return;
            const mgr = sm();
            if (!mgr) return;
            await mgr.save(id);
        },

        listSessions: async (filters) => {
            try {
                const d = db();
                if (!d) return [];
                let records = (await d.debateSessions
                    .orderBy('updatedAt')
                    .reverse()
                    .toArray()) as DebateRecord[];
                if (filters?.status) records = records.filter((r) => r.phase === filters.status);
                if (filters?.folder) records = records.filter((r) => r.folder === filters.folder);
                if (filters?.search) {
                    const q = filters.search.toLowerCase();
                    records = records.filter((r) => r.topic.toLowerCase().includes(q));
                }
                if (filters?.tags?.length)
                    records = records.filter((r) =>
                        (r.tags ?? []).some((t) => filters.tags!.includes(t)),
                    );
                return await Promise.all(
                    records.map(async (r) => toMeta(r, await getLinkedIds(r.id))),
                );
            } catch (err) {
                LOGGER.warn('DebateSessionStore', 'listSessions failed', { error: err });
                return [];
            }
        },

        pauseSession: async (id) => {
            const mgr = sm();
            if (!mgr) return;
            await mgr.pause(id);
            try {
                const de = runtime.getService<{ pauseSession(id: string): void }>('debateEngine');
                de?.pauseSession?.(id);
            } catch {
                /* engine not available */
            }
            set((s) => ({
                sessions: s.sessions.map((ss) =>
                    ss.id === id ? { ...ss, phase: 'paused' as const } : ss,
                ),
            }));
        },

        resumeSession: async (id) => {
            const mgr = sm();
            if (!mgr) return;
            await mgr.resume(id);
            try {
                const de = runtime.getService<{ resumeSession(id: string): void }>('debateEngine');
                de?.resumeSession?.(id);
            } catch {
                /* engine not available */
            }
            set((s) => ({
                sessions: s.sessions.map((ss) =>
                    ss.id === id ? { ...ss, phase: 'active' as const } : ss,
                ),
            }));
        },

        deleteSession: async (id) => {
            const mgr = sm();
            if (!mgr) return;
            await mgr.delete(id);
            set((s) => ({
                sessions: s.sessions.filter((ss) => ss.id !== id),
                activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
            }));
        },

        archiveSession: async (id) => {
            const mgr = sm();
            if (!mgr) return;
            await mgr.archive(id);
            set((s) => ({
                sessions: s.sessions.map((ss) => (ss.id === id ? { ...ss, isArchived: true } : ss)),
            }));
        },

        unarchiveSession: async (id) => {
            const mgr = sm();
            if (!mgr) return;
            await mgr.unarchive(id);
            set((s) => ({
                sessions: s.sessions.map((ss) =>
                    ss.id === id ? { ...ss, isArchived: false } : ss,
                ),
            }));
        },

        tagSession: async (id, tags) => {
            const mgr = sm();
            if (!mgr) return;
            await mgr.updateMeta(id, { tags });
            set((s) => ({
                sessions: s.sessions.map((ss) => (ss.id === id ? { ...ss, tags } : ss)),
            }));
        },

        moveToFolder: async (id, folder) => {
            const mgr = sm();
            if (!mgr) return;
            await mgr.updateMeta(id, { folder });
            set((s) => ({
                sessions: s.sessions.map((ss) => (ss.id === id ? { ...ss, folder } : ss)),
            }));
        },

        renameSession: async (id, title) => {
            const mgr = sm();
            if (!mgr) return;
            await mgr.updateMeta(id, { title });
            set((s) => ({
                sessions: s.sessions.map((ss) => (ss.id === id ? { ...ss, topic: title } : ss)),
            }));
        },

        pinSession: async (id) => {
            const current = get().sessions.find((ss) => ss.id === id);
            if (!current) return;
            const next = !current.isPinned;
            const mgr = sm();
            if (!mgr) return;
            await mgr.updateMeta(id, { isPinned: next });
            set((s) => ({
                sessions: s.sessions.map((ss) => (ss.id === id ? { ...ss, isPinned: next } : ss)),
            }));
        },

        setActiveSessionId: (id) => set({ activeSessionId: id }),

        refresh: async () => {
            try {
                const d = db();
                if (!d) {
                    set({ sessions: [], isLoaded: true });
                    return;
                }
                const records = (await d.debateSessions
                    .orderBy('updatedAt')
                    .reverse()
                    .toArray()) as DebateRecord[];
                const metas = await recordsToMetas(records);
                set({ sessions: metas, isLoaded: true });
            } catch (err) {
                LOGGER.warn('DebateSessionStore', 'refresh failed', { error: err });
                set({ sessions: [], isLoaded: true });
            }
        },
    };
});
