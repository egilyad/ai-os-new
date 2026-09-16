import { describe, it, expect, vi } from 'vitest';
import { DebateSyncManager, DebateAlreadyActiveError } from './debate-sync-manager';

function fakeEngine() {
    let created = 0;
    const cancelled: string[] = [];
    const engine: any = {
        createSession: vi.fn(() => `sess-${++created}`),
        getSession: vi.fn((id: string) => ({
            id,
            topic: 't',
            phase: 'deliberating',
            round: 1,
            startedAt: Date.now(),
        })),
        getTimeline: vi.fn(() => null),
        // Never resolve so the post-run finalize (which needs a real session)
        // does not execute during the test — we only assert concurrency/startup.
        startSession: vi.fn(() => new Promise<void>(() => {})),
        cancelSession: vi.fn((id: string) => {
            cancelled.push(id);
        }),
        saveSnapshot: vi.fn(() => Promise.resolve()),
        dumpSizes: vi.fn(() => ({})),
    };
    engine.__cancelled = cancelled;
    return engine;
}

function inMemoryStore() {
    const sessions = new Map<string, { session: any; governorState: any }>();
    let activeId: string | null = null;
    return {
        get session() {
            return activeId ? (sessions.get(activeId)?.session ?? null) : null;
        },
        get governorState() {
            return activeId ? (sessions.get(activeId)?.governorState ?? null) : null;
        },
        setSession: (s: any) => {
            if (!s) {
                activeId = null;
                return;
            }
            sessions.set(s.id, {
                session: s,
                governorState: sessions.get(s.id)?.governorState ?? null,
            });
            activeId = s.id;
        },
        upsertSession: (s: any) => {
            if (!s) return;
            sessions.set(s.id, {
                session: s,
                governorState: sessions.get(s.id)?.governorState ?? null,
            });
        },
        setGovernorState: (st: any) => {
            if (activeId) {
                const e = sessions.get(activeId);
                if (e) e.governorState = st;
            }
        },
        setGovernorStateFor: (id: string, st: any) => {
            const e = sessions.get(id);
            if (e) e.governorState = st;
        },
        setActiveSessionId: (id: string) => {
            activeId = id;
        },
        getSession: (id: string) => sessions.get(id)?.session ?? null,
        clearSession: (id: string) => {
            sessions.delete(id);
            if (activeId === id) activeId = null;
        },
        clearAll: () => {
            sessions.clear();
            activeId = null;
        },
    };
}

function makeEntry(sessionId: string, owner: string | null) {
    return {
        sessionId,
        activeSession: null as any,
        runtimeSessionId: null as string | null,
        governor: null as any,
        bridgeCtx: null as any,
        owner,
        runPromise: Promise.resolve(),
        unsubs: [] as Array<() => void>,
        durationTimer: null as any,
        syncing: false,
        syncDebounceTimer: null as any,
        finalized: false,
    };
}

function makeManager(engine: any) {
    const store = inMemoryStore();
    const postProcessor: any = {
        factCheckService: {},
        process: vi.fn(),
        processGovernorFeeding: vi.fn(),
        processFactCheck: vi.fn(),
        updateConvergenceScore: vi.fn(),
        clearProcessedIds: vi.fn(),
    };
    const mgr = new DebateSyncManager(postProcessor);
    (mgr as any).engine = engine;
    // `DebateInterpreter` is constructed internally and not injectable; stub it so
    // the minimal fake session doesn't make `finalizeDebateState` throw.
    (mgr as any)._interpreter = { interpret: vi.fn(() => ({})) };
    mgr.setDeps({
        eventBus: {
            on: vi.fn(() => () => {}),
            emit: vi.fn(),
            emitOnce: vi.fn(),
            onSafe: vi.fn(() => () => {}),
        } as never,
        activeDebateStore: store,
        debateLiveStore: { clearAll: vi.fn(), clearSession: vi.fn() } as never,
        debateStore: {} as never,
        sessionManager: {
            link: vi.fn(async () => {}),
            updateMeta: vi.fn(async () => {}),
            saveToDebateHistory: vi.fn(),
            getDebateHistory: vi.fn(() => []),
        } as never,
        adapterRegistry: { resetCircuitBreaker: vi.fn() } as never,
        keyService: {
            getActiveKeys: () => [{ provider: 'groq' }, { provider: 'openrouter' }],
        } as never,
    } as never);
    // Bypass the restart cooldown so the guard (not throttling) is what we test.
    (mgr as any)._lastStartTime = 0;
    return mgr;
}

describe('DebateSyncManager — B-16 multi-session (no single-active-debate assumption)', () => {
    it('allows a manual and an invocation debate to run concurrently (no silent kill)', async () => {
        const engine = fakeEngine();
        const mgr = makeManager(engine);
        const manual = makeEntry('prev', null);
        manual.activeSession = { id: 'prev', status: 'active', arguments: [] } as any;
        manual.runtimeSessionId = 'prev';
        (mgr as any)._entries.set('prev', manual);
        (mgr as any)._activeSessionId = 'prev';

        const session = await mgr.startDebate(
            'topic',
            [{ id: 'a' }, { id: 'b' }] as any,
            'round_robin',
            5,
            undefined,
            undefined,
            'invocation:inv1',
        );
        expect(session.id).toBe('sess-1');
        expect((mgr as any)._entries.has('prev')).toBe(true);
        expect((mgr as any)._entries.has('sess-1')).toBe(true);
        expect(engine.cancelSession).not.toHaveBeenCalledWith('prev');
    });

    it('rejects a second non-terminal debate under the SAME owner (idempotency)', async () => {
        const engine = fakeEngine();
        const mgr = makeManager(engine);
        const inv = makeEntry('inv1', 'invocation:inv1');
        inv.activeSession = { id: 'inv1', status: 'active', arguments: [] } as any;
        inv.runtimeSessionId = 'inv1';
        (mgr as any)._entries.set('inv1', inv);

        await expect(
            mgr.startDebate(
                'topic',
                [{ id: 'a' }, { id: 'b' }] as any,
                'round_robin',
                5,
                undefined,
                undefined,
                'invocation:inv1',
            ),
        ).rejects.toThrow(DebateAlreadyActiveError);
    });

    it('allows two different invocation owners to coexist', async () => {
        const engine = fakeEngine();
        const mgr = makeManager(engine);
        const inv1 = makeEntry('inv1', 'invocation:inv1');
        inv1.activeSession = { id: 'inv1', status: 'active', arguments: [] } as any;
        inv1.runtimeSessionId = 'inv1';
        (mgr as any)._entries.set('inv1', inv1);

        const session = await mgr.startDebate(
            'topic',
            [{ id: 'a' }, { id: 'b' }] as any,
            'round_robin',
            5,
            undefined,
            undefined,
            'invocation:inv2',
        );
        expect(session.id).toBe('sess-1');
        expect((mgr as any)._entries.has('inv1')).toBe(true);
        expect((mgr as any)._entries.has('sess-1')).toBe(true);
    });

    it('getRunCompletion exposes the per-session run promise for B-16 awaiting', () => {
        const mgr = makeManager(fakeEngine());
        const p = Promise.resolve();
        const entry = makeEntry('sess-1', null);
        entry.runPromise = p;
        (mgr as any)._entries.set('sess-1', entry);
        expect(mgr.getRunCompletion('sess-1')).toBe(p);
        expect(mgr.getRunCompletion('unknown')).toBeUndefined();
    });

    it('stopDebate(id) finalizes only the targeted session', () => {
        const engine = fakeEngine();
        const mgr = makeManager(engine);
        const a = makeEntry('a', null);
        a.activeSession = { id: 'a', status: 'active', arguments: [] } as any;
        a.runtimeSessionId = 'a';
        const b = makeEntry('b', null);
        b.activeSession = { id: 'b', status: 'cancelled', arguments: [] } as any;
        b.runtimeSessionId = 'b';
        (mgr as any)._entries.set('a', a);
        (mgr as any)._entries.set('b', b);
        (mgr as any)._activeSessionId = 'a';

        mgr.stopDebate('b');

        const bEntry = (mgr as any)._entries.get('b');
        expect(bEntry.finalized).toBe(true);
        expect(bEntry.runtimeSessionId).toBeNull();
        expect((mgr as any)._entries.get('a').finalized).toBe(false);
        expect(engine.cancelSession).toHaveBeenCalledWith('b');
        expect(engine.cancelSession).not.toHaveBeenCalledWith('a');
    });

    it('setActiveSessionId switches the viewed session', () => {
        const mgr = makeManager(fakeEngine());
        const a = makeEntry('a', null);
        a.activeSession = { id: 'a', status: 'active', arguments: [] } as any;
        const b = makeEntry('b', null);
        b.activeSession = { id: 'b', status: 'active', arguments: [] } as any;
        (mgr as any)._entries.set('a', a);
        (mgr as any)._entries.set('b', b);
        (mgr as any)._activeSessionId = 'a';

        expect(mgr.getActiveDebateSession()?.id).toBe('a');
        mgr.setActiveSessionId('b');
        expect(mgr.getActiveDebateSession()?.id).toBe('b');
    });

    it('two sequential startDebate calls keep both entries (true concurrency)', async () => {
        const engine = fakeEngine();
        const mgr = makeManager(engine);
        const first = await mgr.startDebate(
            'topic1',
            [{ id: 'a' }, { id: 'b' }] as any,
            'round_robin',
            5,
        );
        // Bypass the restart cooldown between the two starts in this test only.
        (mgr as any)._lastStartTime = 0;
        const second = await mgr.startDebate(
            'topic2',
            [{ id: 'c' }, { id: 'd' }] as any,
            'round_robin',
            5,
        );
        expect(first.id).toBe('sess-1');
        expect(second.id).toBe('sess-2');
        expect((mgr as any)._entries.has('sess-1')).toBe(true);
        expect((mgr as any)._entries.has('sess-2')).toBe(true);
        // Neither start cancelled the other's engine session.
        expect(engine.cancelSession).not.toHaveBeenCalledWith('sess-1');
        expect(engine.cancelSession).not.toHaveBeenCalledWith('sess-2');
    });
});
