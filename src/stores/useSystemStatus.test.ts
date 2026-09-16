import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockEventBus, mockRuntime, emit } = vi.hoisted(() => {
    const handlers = new Map<string, Array<(data: unknown) => void>>();
    const subscribe = (event: string, cb: (data: unknown) => void) => {
        const list = handlers.get(event) ?? [];
        list.push(cb);
        handlers.set(event, list);
        return () => {
            const current = handlers.get(event);
            if (!current) return;
            const i = current.indexOf(cb);
            if (i >= 0) current.splice(i, 1);
        };
    };
    const emit = vi.fn((event: string, data: unknown) => {
        (handlers.get(event) ?? []).forEach((cb) => cb(data));
    });
    let statusReport: unknown = { summary: 'ok', overall: 'healthy' };
    const mockRuntime = {
        getService: vi.fn(() => ({
            getStatus: () => statusReport,
        })),
        _setStatus: (r: unknown) => {
            statusReport = r;
        },
        _setGetStatus: (fn: () => unknown) => {
            mockRuntime.getService.mockReturnValue({ getStatus: fn });
        },
    };
    return {
        mockEventBus: { on: subscribe, onSafe: subscribe, emit },
        mockRuntime,
        emit,
    };
});

vi.mock('../kernel/runtime', () => ({ runtime: mockRuntime }));
vi.mock('../kernel/events/event-bus', async (importOriginal) => {
    const mod = await importOriginal<typeof import('../kernel/events/event-bus')>();
    return { ...mod, eventBus: mockEventBus };
});

import { useSystemStatus } from './useSystemStatus';
import { EVENTS } from '../kernel/events/event-names';

const STALE_AFTER = 30_000;

describe('useSystemStatus', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        emit.mockClear();
        mockRuntime.getService.mockClear();
        mockRuntime._setStatus({ summary: 'ok', overall: 'healthy' });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the current status report on mount', () => {
        const { result } = renderHook(() => useSystemStatus());
        expect(result.current.report).toEqual({ summary: 'ok', overall: 'healthy' });
        expect(mockRuntime.getService).toHaveBeenCalledWith('systemStatusService');
    });

    it('recomputes the report after a refresh event with 50ms debounce', () => {
        const { result } = renderHook(() => useSystemStatus());
        mockRuntime._setStatus({ summary: 'degraded', overall: 'degraded' });
        act(() => {
            emit(EVENTS.KEY_STATE_CHANGED, { id: 'k1' });
        });
        // within debounce window the report is still stale
        act(() => {
            vi.advanceTimersByTime(10);
        });
        expect(result.current.report).toEqual({ summary: 'ok', overall: 'healthy' });
        act(() => {
            vi.advanceTimersByTime(50);
        });
        expect(result.current.report).toEqual({ summary: 'degraded', overall: 'degraded' });
    });

    it('debounce coalesces rapid consecutive events', () => {
        const { result } = renderHook(() => useSystemStatus());
        mockRuntime._setStatus({ summary: 'second', overall: 'healthy' });
        act(() => {
            emit(EVENTS.KEY_ADDED, { id: 'k1' });
            emit(EVENTS.KEY_REMOVED, { id: 'k2' });
            vi.advanceTimersByTime(60);
        });
        expect(result.current.report).toEqual({ summary: 'second', overall: 'healthy' });
    });

    it('refreshes periodically even without events', () => {
        const { result } = renderHook(() => useSystemStatus());
        mockRuntime._setStatus({ summary: 'periodic', overall: 'degraded' });
        act(() => {
            vi.advanceTimersByTime(STALE_AFTER);
            vi.advanceTimersByTime(50);
        });
        expect(result.current.report).toEqual({ summary: 'periodic', overall: 'degraded' });
    });

    it('tracks stalenessMs on a 1s tick', () => {
        const { result } = renderHook(() => useSystemStatus());
        expect(result.current.stalenessMs).toBe(0);
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(result.current.stalenessMs).toBe(1000);
    });

    it('falls back to empty report when runtime throws', () => {
        mockRuntime._setGetStatus(() => {
            throw new Error('not ready');
        });
        const { result } = renderHook(() => useSystemStatus());
        expect(result.current.report).toEqual({});
    });

    it('cleans up subscriptions and timers on unmount', () => {
        const { unmount } = renderHook(() => useSystemStatus());
        expect(() => {
            unmount();
            act(() => {
                vi.advanceTimersByTime(100000);
            });
        }).not.toThrow();
    });
});
