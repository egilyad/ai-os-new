import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionManagerService } from './session-manager-service';
import type { DebateStore } from '../contracts/storage/debate-store';
import type { SessionStore } from '../contracts/storage/session-store';
import type { DebateTimelineRepository } from '../dal/debate-timeline-repository';
import type { DebateOverrideRepository } from '../dal/debate-override-repository';
import type { SessionLinkRepository } from '../dal/session-link-repository';
import type { IEventBus } from '../types/interfaces';

function mockStore<T extends Record<string, unknown>>() {
    const data = new Map<string, T>();
    return {
        data,
        getSnapshot: vi.fn(async (id: string) => data.get(id) ?? null),
        saveSnapshot: vi.fn(async (rec: T) => {
            data.set(rec.id as string, rec);
            return 1;
        }),
        deleteSession: vi.fn(async (id: string) => {
            data.delete(id);
        }),
        listAllSessions: vi.fn(async () => [...data.values()]),
    };
}

function mockSessionStore() {
    const data = new Map<string, Record<string, unknown>>();
    return {
        data,
        put: vi.fn(async (s: Record<string, unknown>) => {
            data.set(s.id as string, s);
        }),
        getSession: vi.fn(async (id: string) => data.get(id) ?? null),
        updateSession: vi.fn(async (id: string, patch: Record<string, unknown>) => {
            const existing = data.get(id);
            if (existing) {
                data.set(id, { ...existing, ...patch });
            }
        }),
        deleteSession: vi.fn(async (id: string) => {
            data.delete(id);
        }),
        listAll: vi.fn(async () => [...data.values()]),
    };
}

function mockRepo() {
    const data: Record<string, unknown>[] = [];
    return {
        data,
        put: vi.fn(async (item: Record<string, unknown>) => {
            data.push(item);
        }),
        getBySessionId: vi.fn(async (id: string) =>
            data.filter((d: Record<string, unknown>) => d.sessionId === id),
        ),
        getByEitherId: vi.fn(async (id: string) =>
            data.filter((d: Record<string, unknown>) => d.fromId === id || d.toId === id),
        ),
        deleteBySessionId: vi.fn(async (id: string) => {
            data.splice(
                0,
                data.length,
                ...data.filter((d: Record<string, unknown>) => d.sessionId !== id),
            );
        }),
        deleteByFromId: vi.fn(async (id: string) => {
            data.splice(
                0,
                data.length,
                ...data.filter((d: Record<string, unknown>) => d.fromId !== id),
            );
        }),
        deleteByToId: vi.fn(async (id: string) => {
            data.splice(
                0,
                data.length,
                ...data.filter((d: Record<string, unknown>) => d.toId !== id),
            );
        }),
    };
}

function createService() {
    const debateStore = mockStore() as unknown as DebateStore;
    const sessionStore = mockSessionStore() as unknown as SessionStore;
    const eventBus = { emit: vi.fn() } as unknown as IEventBus;
    const timelineRepo = mockRepo() as unknown as DebateTimelineRepository;
    const overrideRepo = mockRepo() as unknown as DebateOverrideRepository;
    const linkRepo = mockRepo() as unknown as SessionLinkRepository;

    const service = new SessionManagerService(
        sessionStore as never,
        debateStore as never,
        eventBus,
        timelineRepo as never,
        overrideRepo as never,
        linkRepo as never,
    );

    return { service, debateStore, sessionStore, eventBus, timelineRepo, overrideRepo, linkRepo };
}

describe('SessionManagerService', () => {
    let ctx: ReturnType<typeof createService>;

    beforeEach(() => {
        vi.clearAllMocks();
        ctx = createService();
    });

    describe('create', () => {
        it('creates a debate session', async () => {
            const id = await ctx.service.create('debate', { title: 'test debate' });
            expect(id).toBeDefined();
            expect(ctx.debateStore.saveSnapshot).toHaveBeenCalled();
        });

        it('creates a chat session', async () => {
            const id = await ctx.service.create('chat', { title: 'test chat' });
            expect(id).toBeDefined();
            expect(ctx.sessionStore.put).toHaveBeenCalled();
        });

        it('uses provided id', async () => {
            const id = await ctx.service.create('chat', { id: 'my-id', title: 'test' });
            expect(id).toBe('my-id');
        });
    });

    describe('load', () => {
        it('loads a debate session', async () => {
            await ctx.service.create('debate', { id: 'd1', title: 'debate' });
            const meta = await ctx.service.load('d1');
            expect(meta).not.toBeNull();
            expect(meta!.title).toBe('debate');
            expect(meta!.type).toBe('debate');
        });

        it('loads a chat session', async () => {
            await ctx.service.create('chat', { id: 'c1', title: 'chat' });
            const meta = await ctx.service.load('c1');
            expect(meta).not.toBeNull();
            expect(meta!.title).toBe('chat');
            expect(meta!.type).toBe('chat');
        });

        it('returns null for unknown id', async () => {
            const meta = await ctx.service.load('unknown');
            expect(meta).toBeNull();
        });
    });

    describe('pause/resume', () => {
        it('pauses a debate session', async () => {
            await ctx.service.create('debate', { id: 'd1' });
            await ctx.service.pause('d1');
            const meta = await ctx.service.load('d1');
            expect(meta!.status).toBe('paused');
        });

        it('resumes a debate session', async () => {
            await ctx.service.create('debate', { id: 'd1' });
            await ctx.service.pause('d1');
            await ctx.service.resume('d1');
            const meta = await ctx.service.load('d1');
            expect(meta!.status).toBe('active');
        });

        it('throws when pausing non-existent session', async () => {
            await expect(ctx.service.pause('unknown')).rejects.toThrow();
        });
    });

    describe('list', () => {
        beforeEach(async () => {
            await ctx.service.create('debate', { id: 'd1', title: 'debate1', tags: ['ml'] });
            await ctx.service.create('chat', { id: 'c1', title: 'chat1', tags: ['web'] });
        });

        it('lists all sessions', async () => {
            const all = await ctx.service.list({});
            expect(all).toHaveLength(2);
        });

        it('filters by type debate', async () => {
            const debates = await ctx.service.list({ type: 'debate' });
            expect(debates).toHaveLength(1);
            expect(debates[0].type).toBe('debate');
        });

        it('filters by type chat', async () => {
            const chats = await ctx.service.list({ type: 'chat' });
            expect(chats).toHaveLength(1);
            expect(chats[0].type).toBe('chat');
        });

        it('filters by tags', async () => {
            const ml = await ctx.service.list({ tags: ['ml'] });
            expect(ml).toHaveLength(1);
        });
    });

    describe('archive/unarchive', () => {
        it('archives a debate session', async () => {
            await ctx.service.create('debate', { id: 'd1' });
            await ctx.service.archive('d1');
            const meta = await ctx.service.load('d1');
            expect(meta!.isArchived).toBe(true);
        });

        it('archives a chat session', async () => {
            await ctx.service.create('chat', { id: 'c1' });
            await ctx.service.archive('c1');
            const meta = await ctx.service.load('c1');
            expect(meta!.isArchived).toBe(true);
        });

        it('unarchives a session', async () => {
            await ctx.service.create('chat', { id: 'c1' });
            await ctx.service.archive('c1');
            await ctx.service.unarchive('c1');
            const meta = await ctx.service.load('c1');
            expect(meta!.isArchived).toBe(false);
        });
    });

    describe('delete', () => {
        it('deletes a session from all stores', async () => {
            await ctx.service.create('chat', { id: 'c1' });
            await ctx.service.delete('c1');
            const meta = await ctx.service.load('c1');
            expect(meta).toBeNull();
        });
    });

    describe('updateMeta', () => {
        it('updates title for a debate session', async () => {
            await ctx.service.create('debate', { id: 'd1', title: 'old' });
            await ctx.service.updateMeta('d1', { title: 'new' });
            const meta = await ctx.service.load('d1');
            expect(meta!.title).toBe('new');
        });

        it('updates title for a chat session', async () => {
            await ctx.service.create('chat', { id: 'c1', title: 'old' });
            await ctx.service.updateMeta('c1', { title: 'new' });
            const meta = await ctx.service.load('c1');
            expect(meta!.title).toBe('new');
        });

        it('updates tags and folder', async () => {
            await ctx.service.create('chat', { id: 'c1' });
            await ctx.service.updateMeta('c1', { tags: ['a', 'b'], folder: '/test' });
            const meta = await ctx.service.load('c1');
            expect(meta!.tags).toEqual(['a', 'b']);
            expect(meta!.folder).toBe('/test');
        });
    });

    describe('debate history', () => {
        it('starts empty', () => {
            expect(ctx.service.getDebateHistory()).toEqual([]);
        });

        it('saveToDebateHistory stores completed sessions', () => {
            const service = ctx.service as unknown as {
                _historyLoaded: boolean;
                completedSessions: unknown[];
            };
            service._historyLoaded = true;
            const session = { id: 'h1', status: 'completed', arguments: [] };
            (
                ctx.service as never as {
                    saveToDebateHistory: (s: Record<string, unknown>) => void;
                }
            ).saveToDebateHistory(session);
            expect(ctx.service.getDebateHistory()).toHaveLength(1);
        });

        it('saveToDebateHistory ignores non-completed sessions', () => {
            const service = ctx.service as unknown as { _historyLoaded: boolean };
            service._historyLoaded = true;
            (
                ctx.service as never as {
                    saveToDebateHistory: (s: Record<string, unknown>) => void;
                }
            ).saveToDebateHistory({ id: 'h1', status: 'active' });
            expect(ctx.service.getDebateHistory()).toHaveLength(0);
        });

        it('does not save duplicates', () => {
            const service = ctx.service as unknown as { _historyLoaded: boolean };
            service._historyLoaded = true;
            const session = { id: 'h1', status: 'completed', arguments: [] };
            (
                ctx.service as never as {
                    saveToDebateHistory: (s: Record<string, unknown>) => void;
                }
            ).saveToDebateHistory(session);
            (
                ctx.service as never as {
                    saveToDebateHistory: (s: Record<string, unknown>) => void;
                }
            ).saveToDebateHistory(session);
            expect(ctx.service.getDebateHistory()).toHaveLength(1);
        });

        it('restoreDebateSession returns session and removes from history', () => {
            const service = ctx.service as unknown as {
                _historyLoaded: boolean;
                completedSessions: unknown[];
            };
            service._historyLoaded = true;
            const session = { id: 'h1', status: 'completed', arguments: [] };
            (
                ctx.service as never as {
                    saveToDebateHistory: (s: Record<string, unknown>) => void;
                }
            ).saveToDebateHistory(session);
            const restored = ctx.service.restoreDebateSession('h1');
            expect(restored).not.toBeNull();
            expect(restored!.status).toBe('active');
            expect(ctx.service.getDebateHistory()).toHaveLength(0);
        });

        it('restoreDebateSession returns null for unknown id', () => {
            expect(ctx.service.restoreDebateSession('unknown')).toBeNull();
        });

        it('clearDebateHistory removes all', () => {
            const service = ctx.service as unknown as {
                _historyLoaded: boolean;
                completedSessions: unknown[];
            };
            service._historyLoaded = true;
            (
                ctx.service as never as {
                    saveToDebateHistory: (s: Record<string, unknown>) => void;
                }
            ).saveToDebateHistory({ id: 'h1', status: 'completed', arguments: [] });
            ctx.service.clearDebateHistory();
            expect(ctx.service.getDebateHistory()).toHaveLength(0);
        });
    });

    describe('timeline', () => {
        it('adds and retrieves timeline entries', async () => {
            await ctx.service.addTimelineEntry('s1', 'event', 'payload');
            const entries = await ctx.service.getTimeline('s1');
            expect(entries).toHaveLength(1);
            expect(entries[0].type).toBe('event');
        });
    });

    describe('overrides', () => {
        it('adds and retrieves overrides', async () => {
            await ctx.service.addOverride('s1', 'config', 'json');
            const overrides = await ctx.service.getOverrides('s1');
            expect(overrides).toHaveLength(1);
            expect(overrides[0].type).toBe('config');
        });
    });

    describe('link', () => {
        it('creates and retrieves session links', async () => {
            await ctx.service.link('s1', 's2', 'continuation', 'context');
            const links = await ctx.service.getLinked('s1');
            expect(links).toHaveLength(1);
            expect(links[0].linkType).toBe('continuation');
        });
    });
});
