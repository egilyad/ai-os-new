import { genId } from '../../utils/gen-id';
import { rootLogger } from './logger-service';
import type {
    ISessionManager,
    SessionMeta,
    DebateCreateData,
    SessionType,
    SessionStatus,
    SessionFilters,
} from '../contracts/session-manager';
import type { DebateSession } from '../contracts/debate-types';
import type { DebateSessionRecord, DebateStore } from '../contracts/storage/debate-store';
import type { ChatSession, SessionStore } from '../contracts/storage/session-store';
import type { IEventBus } from '../types/interfaces';
import { EVENTS } from '../events/event-names';
import { loadHistoryList, persistHistoryList } from './debate-runtime/debate-session-persistence';
import { DebateTimelineRepository } from '../dal/debate-timeline-repository';
import { DebateOverrideRepository } from '../dal/debate-override-repository';
import { SessionLinkRepository } from '../dal/session-link-repository';
import type { IDebateEngine } from '../contracts/debate-runtime';

const LOGGER = rootLogger.child('SessionManagerService');

export class SessionManagerService implements ISessionManager {
    private completedSessions: DebateSession[] = [];
    private readonly MAX_HISTORY = 5;
    private _historyLoaded = false;
    private _pendingHistorySaves: DebateSession[] = [];

    constructor(
        private sessionStore: SessionStore,
        private debateStore: DebateStore,
        private eventBus: IEventBus,
        private timelineRepo: DebateTimelineRepository,
        private overrideRepo: DebateOverrideRepository,
        private linkRepo: SessionLinkRepository,
        private debateEngine?: IDebateEngine,
    ) {}

    async create(
        type: SessionType,
        meta: Partial<SessionMeta>,
        debateData?: DebateCreateData,
    ): Promise<string> {
        const id = meta.id || genId();
        const now = Date.now();
        const base: SessionMeta = {
            id,
            type,
            title: meta.title || 'Untitled',
            status: 'active',
            tags: meta.tags || [],
            folder: meta.folder || '',
            isArchived: false,
            isPinned: false,
            createdAt: now,
            updatedAt: now,
            linkedSessionIds: [],
        };

        if (type === 'debate') {
            const record: DebateSessionRecord = {
                id,
                topic: base.title,
                topologyType:
                    (debateData?.topologyType as DebateSessionRecord['topologyType']) ??
                    'roundtable',
                phase: 'created',
                round: 0,
                totalTokens: 0,
                totalCost: 0,
                agentStates: '[]',
                arguments: '[]',
                topology: debateData?.topology ?? '{}',
                participants: debateData?.participants ?? '[]',
                memory: '{}',
                startedAt: now,
                updatedAt: now,
                createdAt: now,
                version: 1,
                tags: debateData?.tags ?? base.tags,
                folder: debateData?.folder ?? base.folder,
                isArchived: false,
            };
            await this.debateStore.saveSnapshot(record);
        } else {
            const session: ChatSession = {
                id,
                title: base.title,
                history: [],
                createdAt: now,
                updatedAt: now,
                tags: base.tags,
                folder: base.folder,
                isArchived: false,
                isPinned: false,
            };
            await this.sessionStore.put(session);
        }

        return id;
    }

    async load(id: string): Promise<SessionMeta | null> {
        const debate = await this.debateStore.getSnapshot(id);
        if (debate) {
            const meta = this.recordToMeta(debate, 'debate');
            const links = await this.linkRepo.getByEitherId(id);
            meta.linkedSessionIds = links.map((l) => (l.fromId === id ? l.toId : l.fromId));
            return meta;
        }
        const chat = await this.sessionStore.getSession(id);
        if (chat) {
            const meta = this.chatToMeta(chat);
            const links = await this.linkRepo.getByEitherId(id);
            meta.linkedSessionIds = links.map((l) => (l.fromId === id ? l.toId : l.fromId));
            return meta;
        }
        return null;
    }

    async save(id: string): Promise<void> {
        let existed = false;
        const debate = await this.debateStore.getSnapshot(id);
        if (debate) {
            existed = true;
            await this.debateStore.saveSnapshot({ ...debate, updatedAt: Date.now() });
        }
        const chat = await this.sessionStore.getSession(id);
        if (chat) {
            existed = true;
            await this.sessionStore.put({ ...chat, updatedAt: Date.now() });
        }
        if (!existed) {
            LOGGER.warn('SessionManagerService', `save: session ${id} not found in any store`);
        }
    }

    async pause(id: string): Promise<void> {
        // Route through engine first if active runtime session exists
        if (this.debateEngine) {
            try {
                this.debateEngine.pauseSession(id);
            } catch {
                /* session not active in engine */
            }
        }
        const debate = await this.debateStore.getSnapshot(id);
        if (debate) {
            await this.debateStore.saveSnapshot({
                ...debate,
                phase: 'paused',
                updatedAt: Date.now(),
            });
            return;
        }
        throw new Error(`Session ${id} not found or is not a debate`);
    }

    async resume(id: string): Promise<void> {
        // Route through engine first if active runtime session exists
        if (this.debateEngine) {
            try {
                this.debateEngine.resumeSession(id);
            } catch {
                /* session not active in engine */
            }
        }
        const debate = await this.debateStore.getSnapshot(id);
        if (debate) {
            await this.debateStore.saveSnapshot({
                ...debate,
                phase: 'active',
                updatedAt: Date.now(),
            });
            return;
        }
        throw new Error(`Session ${id} not found or is not a debate`);
    }

    async list(filters: SessionFilters): Promise<SessionMeta[]> {
        const results: SessionMeta[] = [];

        const shouldIncludeDebates = !filters.type || filters.type === 'debate';
        const shouldIncludeChats = !filters.type || filters.type === 'chat';

        if (shouldIncludeDebates) {
            let records = await this.debateStore.listAllSessions();
            records.sort((a, b) => b.updatedAt - a.updatedAt);

            if (filters.status) {
                records = records.filter((r) => r.phase === filters.status);
            }
            if (filters.folder) {
                records = records.filter((r) => r.folder === filters.folder);
            }
            if (filters.isArchived !== undefined) {
                records = records.filter((r) => (r.isArchived ?? false) === filters.isArchived);
            }
            if (filters.search) {
                const q = filters.search.toLowerCase();
                records = records.filter((r) => r.topic.toLowerCase().includes(q));
            }
            if (filters.tags && filters.tags.length > 0) {
                records = records.filter((r) => {
                    const tags = r.tags ?? [];
                    return filters.tags!.some((t) => tags.includes(t));
                });
            }

            results.push(...records.map((r) => this.recordToMeta(r, 'debate')));
        }

        if (shouldIncludeChats) {
            let records = await this.sessionStore.listAll();
            records.sort((a, b) => b.updatedAt - a.updatedAt);

            if (filters.status) {
                records = records.filter((r) => this.mapChatStatus(r) === filters.status);
            }
            if (filters.folder) {
                records = records.filter((r) => r.folder === filters.folder);
            }
            if (filters.isArchived !== undefined) {
                records = records.filter((r) => (r.isArchived ?? false) === filters.isArchived);
            }
            if (filters.search) {
                const q = filters.search.toLowerCase();
                records = records.filter((r) => r.title.toLowerCase().includes(q));
            }
            if (filters.tags && filters.tags.length > 0) {
                records = records.filter((r) => {
                    const tags = r.tags ?? [];
                    return filters.tags!.some((t) => tags.includes(t));
                });
            }

            results.push(...records.map((r) => this.chatToMeta(r)));
        }

        results.sort((a, b) => b.updatedAt - a.updatedAt);
        return results;
    }

    async archive(id: string): Promise<void> {
        const debate = await this.debateStore.getSnapshot(id);
        if (debate) {
            await this.debateStore.saveSnapshot({
                ...debate,
                isArchived: true,
                updatedAt: Date.now(),
            });
            return;
        }
        const chat = await this.sessionStore.getSession(id);
        if (chat) {
            await this.sessionStore.updateSession(id, {
                isArchived: true,
                updatedAt: Date.now(),
            } as Partial<ChatSession>);
            return;
        }
        throw new Error(`Session ${id} not found`);
    }

    async unarchive(id: string): Promise<void> {
        const debate = await this.debateStore.getSnapshot(id);
        if (debate) {
            await this.debateStore.saveSnapshot({
                ...debate,
                isArchived: false,
                updatedAt: Date.now(),
            });
            return;
        }
        const chat = await this.sessionStore.getSession(id);
        if (chat) {
            await this.sessionStore.updateSession(id, {
                isArchived: false,
                updatedAt: Date.now(),
            } as Partial<ChatSession>);
            return;
        }
        throw new Error(`Session ${id} not found`);
    }

    async delete(id: string): Promise<void> {
        const debate = await this.debateStore.getSnapshot(id);
        const chat = debate ? null : await this.sessionStore.getSession(id);
        const type: SessionType = debate ? 'debate' : chat ? 'chat' : 'chat';

        try {
            (await import('../instances')).debateEngine.cancelSession(id);
        } catch {
            /* ignore */
        }

        // Sequential deletes to prevent partial orphan state.
        // Promise.allSettled would allow some deletes to succeed while others fail,
        // leaving orphan records. Abort on first failure instead.
        const operations: Array<{ name: string; run: () => Promise<void> }> = [
            { name: 'debateStore', run: () => this.debateStore.deleteSession(id) },
            { name: 'sessionStore', run: () => this.sessionStore.deleteSession(id) },
            { name: 'debateTimeline', run: () => this.timelineRepo.deleteBySessionId(id) },
            { name: 'debateOverrides', run: () => this.overrideRepo.deleteBySessionId(id) },
            { name: 'sessionLinks(from)', run: () => this.linkRepo.deleteByFromId(id) },
            { name: 'sessionLinks(to)', run: () => this.linkRepo.deleteByToId(id) },
        ];
        let lastError: unknown;
        for (const op of operations) {
            try {
                await op.run();
            } catch (e) {
                LOGGER.error('SessionManager', `delete ${op.name} failed — aborting`, {
                    id,
                    error: e,
                });
                lastError = e;
                break;
            }
        }
        if (lastError) throw lastError;

        this.eventBus.emit(EVENTS.SESSION_DELETED, { id, type });
    }

    async link(
        fromId: string,
        toId: string,
        linkType: import('../contracts/session-manager').SessionLink['linkType'],
        context = '',
    ): Promise<void> {
        const link = {
            id: genId(),
            fromId,
            toId,
            linkType,
            context,
            createdAt: Date.now(),
        } satisfies import('../contracts/session-manager').SessionLink;
        await this.linkRepo.put(link);
    }

    async getLinked(id: string): Promise<import('../contracts/session-manager').SessionLink[]> {
        return this.linkRepo.getByEitherId(id);
    }

    async updateMeta(id: string, updates: Partial<SessionMeta>): Promise<void> {
        const now = Date.now();
        const debate = await this.debateStore.getSnapshot(id);
        if (debate) {
            const updated = { ...debate, updatedAt: now };
            if (updates.title !== undefined) updated.topic = updates.title;
            if (updates.tags !== undefined) updated.tags = updates.tags;
            if (updates.folder !== undefined) updated.folder = updates.folder;
            if (updates.isArchived !== undefined) updated.isArchived = updates.isArchived;
            if (updates.isPinned !== undefined) updated.isPinned = updates.isPinned;
            await this.debateStore.saveSnapshot(updated);
            return;
        }
        const chat = await this.sessionStore.getSession(id);
        if (chat) {
            const patch: Partial<ChatSession> = { updatedAt: now };
            if (updates.title !== undefined) patch.title = updates.title;
            if (updates.tags !== undefined) patch.tags = updates.tags;
            if (updates.folder !== undefined) patch.folder = updates.folder;
            if (updates.isArchived !== undefined) patch.isArchived = updates.isArchived;
            if (updates.isPinned !== undefined) patch.isPinned = updates.isPinned;
            if (updates.linkedDebateId !== undefined) patch.linkedDebateId = updates.linkedDebateId;
            await this.sessionStore.updateSession(id, patch);
            return;
        }
        // Best-effort metadata update: the session may be a virtual/placeholder id
        // (e.g. the chat store's in-memory 'default' session that is never persisted).
        // Don't throw — this is an optional metadata write, and the error only produces
        // noisy "Session X not found" ERROR logs (e.g. DebateSyncManager linking a debate
        // started from the default chat session).
        LOGGER.warn('SessionManager', 'updateMeta: session not found — skipping', { id });
    }

    private async ensureHistoryLoaded(): Promise<void> {
        if (this._historyLoaded) return;
        this._historyLoaded = true;
        try {
            this.completedSessions = await loadHistoryList(this.debateStore, this.MAX_HISTORY);
            // Replay any saves that arrived while load was in flight
            const pending = this._pendingHistorySaves.splice(0);
            for (const session of pending) {
                if (!this.completedSessions.some((s) => s.id === session.id)) {
                    this.completedSessions.unshift(structuredClone(session));
                }
            }
            if (this.completedSessions.length > this.MAX_HISTORY) {
                this.completedSessions = this.completedSessions.slice(0, this.MAX_HISTORY);
            }
            if (pending.length > 0) {
                this.persistDebateHistory();
            }
        } catch (e) {
            LOGGER.warn('SessionManagerService', 'Failed to load debate history', {
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }

    private static stripArgumentContent(session: DebateSession): DebateSession {
        if (!session.arguments?.length) return session;
        return {
            ...session,
            arguments: session.arguments.map((arg) => ({
                ...arg,
                content: '',
            })),
        };
    }

    private persistDebateHistory(): void {
        void persistHistoryList(this.debateStore, this.completedSessions);
    }

    getDebateHistory(): DebateSession[] {
        void this.ensureHistoryLoaded();
        return [...this.completedSessions];
    }

    saveToDebateHistory(session: DebateSession): void {
        if (session.status !== 'completed') return;
        if (this.completedSessions.some((s) => s.id === session.id)) return;
        const snapshot = structuredClone(session);
        // If history is still loading, buffer the save to replay after load completes
        const stripped = SessionManagerService.stripArgumentContent(snapshot);
        if (!this._historyLoaded && this._pendingHistorySaves.length >= 0) {
            this._pendingHistorySaves.push(stripped);
            return;
        }
        this.completedSessions.unshift(stripped);
        if (this.completedSessions.length > this.MAX_HISTORY) {
            this.completedSessions = this.completedSessions.slice(0, this.MAX_HISTORY);
        }
        this.persistDebateHistory();
    }

    restoreDebateSession(id: string): DebateSession | null {
        const idx = this.completedSessions.findIndex((s) => s.id === id);
        if (idx === -1) return null;
        const restored = structuredClone(this.completedSessions[idx]!);
        restored.status = 'active';
        restored.currentRound = 1;
        this.completedSessions.splice(idx, 1);
        this.persistDebateHistory();
        return restored as DebateSession;
    }

    archiveDebateSession(id: string): boolean {
        const session = this.completedSessions.find((s) => s.id === id);
        if (!session) return false;
        session.status = 'completed';
        this.persistDebateHistory();
        return true;
    }

    deleteDebateHistory(id: string): boolean {
        const idx = this.completedSessions.findIndex((s) => s.id === id);
        if (idx === -1) return false;
        this.completedSessions.splice(idx, 1);
        this.persistDebateHistory();
        return true;
    }

    clearDebateHistory(): void {
        this.completedSessions = [];
        this.persistDebateHistory();
    }

    async addTimelineEntry(sessionId: string, type: string, payload: string): Promise<void> {
        const entry = {
            id: genId(),
            sessionId,
            timestamp: Date.now(),
            type,
            payload,
        } satisfies import('../contracts/session-manager').DebateTimelineEntry;
        await this.timelineRepo.put(entry);
    }

    async getTimeline(
        sessionId: string,
    ): Promise<import('../contracts/session-manager').DebateTimelineEntry[]> {
        return this.timelineRepo.getBySessionId(sessionId);
    }

    async addOverride(sessionId: string, type: string, payload: string): Promise<void> {
        const override = {
            id: genId(),
            sessionId,
            type,
            payload,
            appliedAt: Date.now(),
        } satisfies import('../contracts/session-manager').DebateOverride;
        await this.overrideRepo.put(override);
    }

    async getOverrides(
        sessionId: string,
    ): Promise<import('../contracts/session-manager').DebateOverride[]> {
        return this.overrideRepo.getBySessionId(sessionId);
    }

    private recordToMeta(record: DebateSessionRecord, type: SessionType): SessionMeta {
        return {
            id: record.id,
            type,
            title: record.topic || '(untitled)',
            status: this.mapPhaseToStatus(record.phase),
            tags: record.tags ?? [],
            folder: record.folder ?? '',
            isArchived: record.isArchived ?? false,
            isPinned: record.isPinned ?? false,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            linkedSessionIds: [],
        };
    }

    private chatToMeta(chat: ChatSession): SessionMeta {
        return {
            id: chat.id,
            type: 'chat',
            title: chat.title,
            status: chat.isArchived ? 'archived' : 'active',
            tags: chat.tags ?? [],
            folder: chat.folder ?? '',
            isArchived: chat.isArchived ?? false,
            isPinned: chat.isPinned ?? false,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            linkedSessionIds: chat.linkedDebateId ? [chat.linkedDebateId] : [],
        };
    }

    private mapPhaseToStatus(phase: string): SessionStatus {
        switch (phase) {
            case 'active':
            case 'deliberating':
            case 'consensus':
            case 'summarizing':
                return 'active';
            case 'paused':
                return 'paused';
            case 'completed':
                return 'completed';
            case 'failed':
            case 'cancelled':
                return 'failed';
            default:
                return 'active';
        }
    }

    private mapChatStatus(chat: ChatSession): SessionStatus {
        if (chat.isArchived) return 'archived';
        return 'active';
    }
}
