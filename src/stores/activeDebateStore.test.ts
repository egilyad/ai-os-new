import { describe, it, expect, beforeEach } from 'vitest';
import { useActiveDebateStore, createDebateSessionStoreAdapter } from './activeDebateStore';
import type { DebateSession } from '../kernel/contracts/debate-types';

const makeSession = (overrides: Partial<DebateSession> = {}): DebateSession =>
    ({
        id: 'deb-1',
        topic: 'Test topic',
        phase: 'running',
        args: [],
        createdAt: 1,
        updatedAt: 2,
        ...overrides,
    }) as DebateSession;

describe('useActiveDebateStore', () => {
    beforeEach(() => {
        useActiveDebateStore.setState({ session: null, governorState: null });
    });

    it('initializes with null session and governorState', () => {
        const s = useActiveDebateStore.getState();
        expect(s.session).toBeNull();
        expect(s.governorState).toBeNull();
    });

    it('setSession stores the session', () => {
        const session = makeSession({ id: 'deb-2' });
        useActiveDebateStore.getState().setSession(session);
        expect(useActiveDebateStore.getState().session).toEqual(session);
    });

    it('setSession accepts null', () => {
        useActiveDebateStore.getState().setSession(makeSession());
        useActiveDebateStore.getState().setSession(null);
        expect(useActiveDebateStore.getState().session).toBeNull();
    });

    it('setGovernorState stores governor state', () => {
        const gov = { mode: 'normal', round: 3 } as never;
        useActiveDebateStore.getState().setGovernorState(gov);
        expect(useActiveDebateStore.getState().governorState).toEqual(gov);
    });

    it('clearAll resets both session and governorState', () => {
        useActiveDebateStore.getState().setSession(makeSession());
        useActiveDebateStore.getState().setGovernorState({ mode: 'normal' } as never);
        useActiveDebateStore.getState().clearAll();
        const s = useActiveDebateStore.getState();
        expect(s.session).toBeNull();
        expect(s.governorState).toBeNull();
    });

    it('adapter getters proxy store state', () => {
        const adapter = createDebateSessionStoreAdapter();
        expect(adapter.session).toBeNull();
        expect(adapter.governorState).toBeNull();
        const session = makeSession();
        useActiveDebateStore.setState({ session });
        expect(adapter.session).toEqual(session);
    });

    it('adapter setters proxy into the store', () => {
        const adapter = createDebateSessionStoreAdapter();
        const session = makeSession({ id: 'deb-9' });
        const gov = { mode: 'strict' } as never;
        adapter.setSession(session);
        adapter.setGovernorState(gov);
        expect(useActiveDebateStore.getState().session).toEqual(session);
        expect(useActiveDebateStore.getState().governorState).toEqual(gov);
    });

    it('adapter clearAll resets the store', () => {
        const adapter = createDebateSessionStoreAdapter();
        adapter.setSession(makeSession());
        adapter.clearAll();
        expect(useActiveDebateStore.getState().session).toBeNull();
        expect(useActiveDebateStore.getState().governorState).toBeNull();
    });
});
