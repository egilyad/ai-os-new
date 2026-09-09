import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { EVENTS } from '../kernel/events/event-names';

const { mockEventBus, mockKeyService, emit } = vi.hoisted(() => {
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
    const mockKeyService = {
        getKeys: vi.fn(() => []),
        getFreeTierLimits: vi.fn(() => ({})),
        setFreeTierLimit: vi.fn(),
        setPoolStrategy: vi.fn(),
        getPoolStrategy: vi.fn(() => 'round-robin'),
        getPoolKeyDistribution: vi.fn(() => []),
    };
    return { mockEventBus: { on: subscribe, onSafe: subscribe, emit }, mockKeyService, emit };
});

vi.mock('../kernel/instances', () => ({
    eventBus: mockEventBus,
    EVENTS,
    keyService: mockKeyService,
}));

import { usePoolStatus } from './usePoolStatus';

const makeKey = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'k1',
    provider: 'groq',
    key: 'sk-test',
    label: 'Test',
    status: 'active',
    ...overrides,
});

describe('usePoolStatus', () => {
    beforeEach(() => {
        emit.mockClear();
        mockKeyService.getKeys.mockClear();
        mockKeyService.getFreeTierLimits.mockClear();
        mockKeyService.setFreeTierLimit.mockClear();
        mockKeyService.setPoolStrategy.mockClear();
        mockKeyService.getPoolStrategy.mockClear();
        mockKeyService.getPoolKeyDistribution.mockClear();
        mockKeyService.getKeys.mockImplementation(() => []);
        mockKeyService.getFreeTierLimits.mockImplementation(() => ({}));
        mockKeyService.getPoolStrategy.mockImplementation(() => 'round-robin');
        mockKeyService.getPoolKeyDistribution.mockImplementation(() => []);
    });

    it('initializes with keys and quotas from the service', () => {
        mockKeyService.getKeys.mockImplementation(() => [makeKey({ id: 'k1' })] as never);
        mockKeyService.getFreeTierLimits.mockImplementation(() => ({
            groq: { requestsPerDay: 100, tokensPerDay: 50000 },
        }));
        const { result } = renderHook(() => usePoolStatus());
        expect(result.current.keys).toHaveLength(1);
        expect(result.current.keys[0]).toMatchObject({ id: 'k1' });
        expect(result.current.quotas.groq).toEqual({
            requestsPerDay: 100,
            tokensPerDay: 50000,
        });
    });

    it('falls back to empty quotas when getFreeTierLimits is missing', () => {
        mockKeyService.getFreeTierLimits.mockImplementation(undefined as never);
        const { result } = renderHook(() => usePoolStatus());
        expect(result.current.quotas).toEqual({});
    });

    it('refreshes keys when KEY_UPDATED fires', () => {
        const { result } = renderHook(() => usePoolStatus());
        mockKeyService.getKeys.mockImplementation(() => [makeKey({ id: 'k2' })] as never);
        act(() => {
            emit(EVENTS.KEY_UPDATED, []);
        });
        expect(result.current.keys).toHaveLength(1);
        expect(result.current.keys[0]).toMatchObject({ id: 'k2' });
    });

    it('refreshes keys when KEY_ADDED fires', () => {
        const { result } = renderHook(() => usePoolStatus());
        mockKeyService.getKeys.mockImplementation(() => [makeKey({ id: 'k3' })] as never);
        act(() => {
            emit(EVENTS.KEY_ADDED, {});
        });
        expect(result.current.keys[0]).toMatchObject({ id: 'k3' });
    });

    it('refreshes quotas when KEY_STATE_CHANGED fires', () => {
        mockKeyService.getFreeTierLimits.mockImplementation(() => ({
            openrouter: { requestsPerDay: 10, tokensPerDay: 20 },
        }));
        const { result } = renderHook(() => usePoolStatus());
        expect(result.current.quotas.openrouter).toEqual({
            requestsPerDay: 10,
            tokensPerDay: 20,
        });
    });

    it('does not re-render state when keys and quotas are unchanged', () => {
        mockKeyService.getKeys.mockImplementation(() => [makeKey({ id: 'k1' })] as never);
        mockKeyService.getFreeTierLimits.mockImplementation(() => ({
            groq: { requestsPerDay: 1, tokensPerDay: 2 },
        }));
        const { result } = renderHook(() => usePoolStatus());
        const keysRef = result.current.keys;
        act(() => {
            emit(EVENTS.KEY_REMOVED, { id: 'k1' });
        });
        expect(result.current.keys).toBe(keysRef);
    });

    it('unsubscribes from events on unmount', () => {
        const { unmount } = renderHook(() => usePoolStatus());
        unmount();
        mockKeyService.getKeys.mockImplementation(() => [makeKey({ id: 'k9' })] as never);
        act(() => {
            emit(EVENTS.KEY_UPDATED, []);
        });
        expect(mockKeyService.getKeys).toHaveBeenCalledTimes(1);
    });

    it('setFreeTierLimit delegates and refreshes quotas', () => {
        mockKeyService.setFreeTierLimit.mockImplementation(() => {});
        mockKeyService.getFreeTierLimits.mockImplementation(() => ({
            groq: { requestsPerDay: 500, tokensPerDay: 99999 },
        }));
        const { result } = renderHook(() => usePoolStatus());
        act(() => {
            result.current.actions.setFreeTierLimit('groq', {
                requestsPerDay: 500,
                tokensPerDay: 99999,
            });
        });
        expect(mockKeyService.setFreeTierLimit).toHaveBeenCalledWith('groq', {
            requestsPerDay: 500,
            tokensPerDay: 99999,
        });
        expect(result.current.quotas.groq).toEqual({
            requestsPerDay: 500,
            tokensPerDay: 99999,
        });
    });

    it('setPoolStrategy delegates to keyService', () => {
        const { result } = renderHook(() => usePoolStatus());
        act(() => {
            result.current.actions.setPoolStrategy('groq', 'round-robin');
        });
        expect(mockKeyService.setPoolStrategy).toHaveBeenCalledWith('groq', 'round-robin');
    });

    it('getPoolStrategy delegates to keyService', () => {
        mockKeyService.getPoolStrategy.mockImplementation(() => 'random');
        const { result } = renderHook(() => usePoolStatus());
        expect(result.current.actions.getPoolStrategy('groq')).toBe('random');
    });

    it('getPoolKeyDistribution delegates to keyService', () => {
        const dist = [{ id: 'k1', label: 'A', used: 1, limit: 10, pct: 10, status: 'active' }];
        mockKeyService.getPoolKeyDistribution.mockImplementation(() => dist as never);
        const { result } = renderHook(() => usePoolStatus());
        expect(result.current.actions.getPoolKeyDistribution('groq')).toEqual(dist);
    });
});
