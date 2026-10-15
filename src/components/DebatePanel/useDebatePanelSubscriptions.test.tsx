import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { useRef } from 'react';
import { useDebatePanelSubscriptions } from './useDebatePanelSubscriptions';

// Real event names (event-registry.ts:566-577); the hook reads EVENTS from
// the mocked instances module below, so both sides must agree literally.
const FAILED = 'debate:runtime:session:failed';
const CANCELLED = 'debate:runtime:session:cancelled';

const handlers = vi.hoisted(() => ({ map: new Map<string, (p: unknown) => void>() }));

vi.mock('../../kernel/instances', () => {
    const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() });
    return {
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
        EVENTS: {
            DEBATE_SESSION_FAILED: 'debate:runtime:session:failed',
            DEBATE_SESSION_CANCELLED: 'debate:runtime:session:cancelled',
            DEBATE_VERDICT_GENERATED: 'debate:runtime:verdict:generated',
        },
        eventBus: {
            emit: vi.fn(),
            on: vi.fn((event: string, cb: (p: unknown) => void) => {
                handlers.map.set(event, cb);
                return () => {};
            }),
            onSafe: vi.fn((event: string, cb: (p: unknown) => void) => {
                handlers.map.set(event, cb);
                return () => {};
            }),
            off: vi.fn(),
        },
        orchestrator: { getActiveTopology: () => null },
    };
});

afterEach(() => {
    cleanup();
    handlers.map.clear();
    vi.clearAllMocks();
});

function renderHook(sessionId: string | null = 's1') {
    const api = {
        setSession: vi.fn(),
        setError: vi.fn(),
        refreshHistory: vi.fn(),
        setViewTab: vi.fn(),
    };
    function Harness() {
        const sessionRef = useRef<{ id: string } | null>(sessionId ? { id: sessionId } : null);
        const isMountedRef = useRef(true);
        useDebatePanelSubscriptions({
            session: sessionId ? ({ id: sessionId } as never) : null,
            setSession: api.setSession,
            setStreamingArgIds: vi.fn(),
            setVerdict: vi.fn(),
            setIsLoading: vi.fn(),
            setError: api.setError,
            setActionLoading: vi.fn(),
            setViewTab: api.setViewTab,
            setShowVotePanel: vi.fn(),
            setSelectedAgents: vi.fn(),
            syncHumanVotesFromSession: vi.fn(),
            refreshHistory: api.refreshHistory,
            prevRoundRef: useRef(0),
            sessionRef: sessionRef as never,
            scrollRef: useRef(null),
            timersRef: useRef(new Set()),
            isMountedRef,
            selectedAgentsRef: useRef([]),
            t: (k: string) => k,
        });
        return null;
    }
    render(<Harness />);
    return api;
}

describe('useDebatePanelSubscriptions terminal events (Zone 2)', () => {
    it('failed debates show a message and refresh history instead of silent reset', () => {
        const api = renderHook('s1');
        act(() => {
            handlers.map.get(FAILED)!({ sessionId: 's1' });
        });
        expect(api.setSession).toHaveBeenCalledWith(null);
        expect(api.setError).toHaveBeenCalledWith('debate.session_failed');
        expect(api.refreshHistory).toHaveBeenCalled();
    });

    it('cancelled debates show a message and refresh history', () => {
        const api = renderHook('s1');
        act(() => {
            handlers.map.get(CANCELLED)!({ sessionId: 's1' });
        });
        expect(api.setError).toHaveBeenCalledWith('debate.session_cancelled');
        expect(api.refreshHistory).toHaveBeenCalled();
    });

    it('ignores terminal events for other sessions', () => {
        const api = renderHook('s1');
        act(() => {
            handlers.map.get(FAILED)!({ sessionId: 'other' });
        });
        expect(api.setSession).not.toHaveBeenCalled();
        expect(api.setError).not.toHaveBeenCalled();
    });
});
