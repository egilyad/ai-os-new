import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
    mockRuntime,
    mockSm,
    mockDatabase,
    mockGetDexieDb,
    mockLiveQuery,
    mockDebateEngine,
    defaultGetService,
} = vi.hoisted(() => {
    const makeCollection = () => {
        const records: Array<Record<string, unknown>> = [];
        const coll = {
            records,
            get: vi.fn(async (id: string) => records.find((r) => r.id === id)),
            orderBy: vi.fn(() => ({
                reverse: () => ({
                    toArray: vi.fn(async () =>
                        [...records].sort(
                            (a, b) => (b.updatedAt as number) - (a.updatedAt as number),
                        ),
                    ),
                }),
            })),
            _seed: (recs: Array<Record<string, unknown>>) => {
                records.splice(0, records.length, ...recs);
            },
        };
        return coll;
    };

    const mockSm = {
        create: vi.fn(async () => {}),
        save: vi.fn(async () => {}),
        pause: vi.fn(async () => {}),
        resume: vi.fn(async () => {}),
        delete: vi.fn(async () => {}),
        archive: vi.fn(async () => {}),
        unarchive: vi.fn(async () => {}),
        updateMeta: vi.fn(async () => {}),
        getLinked: vi.fn(async () => []),
    };

    const mockDatabase = {
        debateSessions: makeCollection(),
    };

    const mockDebateEngine = {
        pauseSession: vi.fn(),
        resumeSession: vi.fn(),
    };

    const defaultGetService = (name: string) => {
        if (name === 'sessionManagerService') return mockSm;
        if (name === 'database') return mockDatabase;
        if (name === 'debateEngine') return mockDebateEngine;
        return undefined;
    };

    const mockRuntime = {
        getService: vi.fn(defaultGetService),
    };

    const mockGetDexieDb = vi.fn(() => mockDatabase);

    const liveSubscribers: Array<{
        next: (r: unknown[]) => void;
        error: (e: unknown) => void;
    }> = [];
    const mockLiveQuery = vi.fn(() => ({
        subscribe: (handlers: { next: (r: unknown[]) => void; error: (e: unknown) => void }) => {
            liveSubscribers.push(handlers);
            return { unsubscribe: vi.fn() };
        },
    }));

    return {
        mockRuntime,
        mockSm,
        mockDatabase,
        mockGetDexieDb,
        mockLiveQuery,
        mockDebateEngine,
        defaultGetService,
        liveSubscribers,
    };
});

vi.mock('../../kernel/runtime', () => ({ runtime: mockRuntime }));
vi.mock('../../kernel/instances', () => ({ getDexieDb: mockGetDexieDb }));
vi.mock('dexie', async (importOriginal) => {
    const actual = (await importOriginal<typeof import('dexie')>()) as Record<string, unknown>;
    return { ...actual, liveQuery: mockLiveQuery };
});

import { useDebateSessionStore } from './index';

const makeRecord = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 's1',
    topic: 'Test topic',
    topologyType: 'round_robin',
    phase: 'active',
    round: 2,
    participants: '[]',
    tags: [],
    folder: '',
    isArchived: false,
    isPinned: false,
    createdAt: 100,
    updatedAt: 200,
    ...overrides,
});

describe('useDebateSessionStore', () => {
    beforeEach(() => {
        mockSm.create.mockClear();
        mockSm.save.mockClear();
        mockSm.pause.mockClear();
        mockSm.resume.mockClear();
        mockSm.delete.mockClear();
        mockSm.archive.mockClear();
        mockSm.unarchive.mockClear();
        mockSm.updateMeta.mockClear();
        mockSm.getLinked.mockClear();
        mockSm.getLinked.mockImplementation(async () => []);
        mockDatabase.debateSessions._seed([]);
        mockDebateEngine.pauseSession.mockClear();
        mockDebateEngine.resumeSession.mockClear();
        mockRuntime.getService.mockImplementation(defaultGetService);
        useDebateSessionStore.setState({
            sessions: [],
            activeSessionId: null,
            isLoaded: false,
        });
    });

    it('initializes with empty state', () => {
        const s = useDebateSessionStore.getState();
        expect(s.sessions).toEqual([]);
        expect(s.activeSessionId).toBeNull();
        expect(s.isLoaded).toBe(false);
    });

    it('init is a no-op', () => {
        expect(() => useDebateSessionStore.getState().init()).not.toThrow();
    });

    it('createSession creates via manager and prepends meta', async () => {
        const id = await useDebateSessionStore
            .getState()
            .createSession('New debate', 'round_robin', [], { maxRounds: 5 } as never);
        expect(id).toBeTruthy();
        expect(mockSm.create).toHaveBeenCalledWith(
            'debate',
            expect.objectContaining({ title: 'New debate' }),
            expect.objectContaining({ topologyType: 'round_robin' }),
        );
        const s = useDebateSessionStore.getState();
        expect(s.activeSessionId).toBe(id);
        expect(s.sessions[0]).toMatchObject({
            id,
            topic: 'New debate',
            strategy: 'round_robin',
            phase: 'created',
        });
    });

    it('loadSession returns a full session from db', async () => {
        mockDatabase.debateSessions._seed([makeRecord({ arguments: '[{"id":"a1"}]' })]);
        const s = await useDebateSessionStore.getState().loadSession('s1');
        expect(s).toMatchObject({
            id: 's1',
            topic: 'Test topic',
            strategy: 'round_robin',
            currentRound: 2,
            maxRounds: 10,
        });
        expect(s?.arguments).toHaveLength(1);
    });

    it('loadSession returns null for unknown id', async () => {
        const s = await useDebateSessionStore.getState().loadSession('missing');
        expect(s).toBeNull();
    });

    it('saveCurrentSession persists active session', async () => {
        useDebateSessionStore.setState({ activeSessionId: 's1' });
        await useDebateSessionStore.getState().saveCurrentSession();
        expect(mockSm.save).toHaveBeenCalledWith('s1');
    });

    it('saveCurrentSession is a no-op without active session', async () => {
        await useDebateSessionStore.getState().saveCurrentSession();
        expect(mockSm.save).not.toHaveBeenCalled();
    });

    it('listSessions applies status, folder and search filters', async () => {
        mockDatabase.debateSessions._seed([
            makeRecord({ id: 's1', phase: 'active', folder: 'f1', topic: 'Hello world' }),
            makeRecord({ id: 's2', phase: 'completed', folder: 'f2', topic: 'Other topic' }),
        ]);
        const all = await useDebateSessionStore.getState().listSessions();
        expect(all).toHaveLength(2);

        const active = await useDebateSessionStore.getState().listSessions({ status: 'active' });
        expect(active.map((m) => m.id)).toEqual(['s1']);

        const folder = await useDebateSessionStore.getState().listSessions({ folder: 'f2' });
        expect(folder.map((m) => m.id)).toEqual(['s2']);

        const search = await useDebateSessionStore.getState().listSessions({ search: 'hello' });
        expect(search.map((m) => m.id)).toEqual(['s1']);
    });

    it('listSessions filters by tags', async () => {
        mockDatabase.debateSessions._seed([
            makeRecord({ id: 's1', tags: ['research'] }),
            makeRecord({ id: 's2', tags: ['fun'] }),
        ]);
        const tagged = await useDebateSessionStore.getState().listSessions({
            tags: ['research'],
        });
        expect(tagged.map((m) => m.id)).toEqual(['s1']);
    });

    it('pauseSession pauses via manager and engine, updates phase', async () => {
        useDebateSessionStore.setState({
            sessions: [makeRecord({ id: 's1' }) as never],
        });
        await useDebateSessionStore.getState().pauseSession('s1');
        expect(mockSm.pause).toHaveBeenCalledWith('s1');
        expect(mockDebateEngine.pauseSession).toHaveBeenCalledWith('s1');
        expect(useDebateSessionStore.getState().sessions[0].phase).toBe('paused');
    });

    it('resumeSession resumes and updates phase to active', async () => {
        useDebateSessionStore.setState({
            sessions: [{ ...makeRecord({ id: 's1' }), phase: 'paused' } as never],
        });
        await useDebateSessionStore.getState().resumeSession('s1');
        expect(mockSm.resume).toHaveBeenCalledWith('s1');
        expect(mockDebateEngine.resumeSession).toHaveBeenCalledWith('s1');
        expect(useDebateSessionStore.getState().sessions[0].phase).toBe('active');
    });

    it('deleteSession removes the session and clears active id', async () => {
        useDebateSessionStore.setState({
            sessions: [makeRecord({ id: 's1' }) as never],
            activeSessionId: 's1',
        });
        await useDebateSessionStore.getState().deleteSession('s1');
        expect(mockSm.delete).toHaveBeenCalledWith('s1');
        const s = useDebateSessionStore.getState();
        expect(s.sessions).toHaveLength(0);
        expect(s.activeSessionId).toBeNull();
    });

    it('archiveSession and unarchiveSession toggle isArchived', async () => {
        useDebateSessionStore.setState({
            sessions: [makeRecord({ id: 's1' }) as never],
        });
        await useDebateSessionStore.getState().archiveSession('s1');
        expect(useDebateSessionStore.getState().sessions[0].isArchived).toBe(true);
        expect(mockSm.archive).toHaveBeenCalledWith('s1');
        await useDebateSessionStore.getState().unarchiveSession('s1');
        expect(useDebateSessionStore.getState().sessions[0].isArchived).toBe(false);
        expect(mockSm.unarchive).toHaveBeenCalledWith('s1');
    });

    it('tagSession updates tags', async () => {
        useDebateSessionStore.setState({ sessions: [makeRecord({ id: 's1' }) as never] });
        await useDebateSessionStore.getState().tagSession('s1', ['new-tag']);
        expect(mockSm.updateMeta).toHaveBeenCalledWith('s1', { tags: ['new-tag'] });
        expect(useDebateSessionStore.getState().sessions[0].tags).toEqual(['new-tag']);
    });

    it('moveToFolder updates folder', async () => {
        useDebateSessionStore.setState({ sessions: [makeRecord({ id: 's1' }) as never] });
        await useDebateSessionStore.getState().moveToFolder('s1', 'work');
        expect(mockSm.updateMeta).toHaveBeenCalledWith('s1', { folder: 'work' });
        expect(useDebateSessionStore.getState().sessions[0].folder).toBe('work');
    });

    it('renameSession updates topic', async () => {
        useDebateSessionStore.setState({ sessions: [makeRecord({ id: 's1' }) as never] });
        await useDebateSessionStore.getState().renameSession('s1', 'Renamed');
        expect(mockSm.updateMeta).toHaveBeenCalledWith('s1', { title: 'Renamed' });
        expect(useDebateSessionStore.getState().sessions[0].topic).toBe('Renamed');
    });

    it('pinSession toggles isPinned', async () => {
        useDebateSessionStore.setState({ sessions: [makeRecord({ id: 's1' }) as never] });
        await useDebateSessionStore.getState().pinSession('s1');
        expect(useDebateSessionStore.getState().sessions[0].isPinned).toBe(true);
        expect(mockSm.updateMeta).toHaveBeenCalledWith('s1', { isPinned: true });
        await useDebateSessionStore.getState().pinSession('s1');
        expect(useDebateSessionStore.getState().sessions[0].isPinned).toBe(false);
    });

    it('pinSession is a no-op for unknown session', async () => {
        await useDebateSessionStore.getState().pinSession('missing');
        expect(mockSm.updateMeta).not.toHaveBeenCalled();
    });

    it('setActiveSessionId sets the id', () => {
        useDebateSessionStore.getState().setActiveSessionId('s1');
        expect(useDebateSessionStore.getState().activeSessionId).toBe('s1');
    });

    it('refresh loads records into state', async () => {
        mockDatabase.debateSessions._seed([
            makeRecord({ id: 's1', topic: 'First', updatedAt: 100 }),
            makeRecord({ id: 's2', topic: 'Second', updatedAt: 300 }),
        ]);
        await useDebateSessionStore.getState().refresh();
        const s = useDebateSessionStore.getState();
        expect(s.isLoaded).toBe(true);
        expect(s.sessions).toHaveLength(2);
        expect(s.sessions[0].topic).toBe('Second');
    });
});
