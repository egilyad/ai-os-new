import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockEventBus, emit } = vi.hoisted(() => {
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
    return {
        mockEventBus: { on: subscribe, onSafe: subscribe, emit },
        emit,
    };
});

vi.mock('../kernel/events/event-bus', () => ({ eventBus: mockEventBus }));

import { useTopologyTraceStore } from './topologyTraceStore';
import { EVENTS } from '../kernel/events/event-names';

const activeEvent = 'cognitive:step:active';
const completedEvent = 'cognitive:step:completed';

describe('useTopologyTraceStore', () => {
    beforeEach(() => {
        emit.mockClear();
        useTopologyTraceStore.setState({ steps: [], activeTraces: new Set() });
    });

    it('initializes with empty steps and traces', () => {
        const s = useTopologyTraceStore.getState();
        expect(s.steps).toEqual([]);
        expect(s.activeTraces.size).toBe(0);
    });

    it('adds an active step on cognitive:step:active event', () => {
        emit(activeEvent, { nodeId: 'node-1', traceId: 'trace-1' });
        const s = useTopologyTraceStore.getState();
        expect(s.steps).toHaveLength(1);
        expect(s.steps[0]).toMatchObject({
            nodeId: 'node-1',
            traceId: 'trace-1',
            status: 'active',
        });
        expect(s.steps[0].timestamp).toBeGreaterThan(0);
        expect(s.activeTraces.has('trace-1')).toBe(true);
    });

    it('adds a completed step and removes the active trace', () => {
        emit(activeEvent, { nodeId: 'node-1', traceId: 'trace-1' });
        emit(completedEvent, {
            nodeId: 'node-1',
            traceId: 'trace-1',
            status: 'done',
            duration: 120,
        });
        const s = useTopologyTraceStore.getState();
        expect(s.steps).toHaveLength(2);
        expect(s.steps[1]).toMatchObject({
            nodeId: 'node-1',
            traceId: 'trace-1',
            status: 'done',
            duration: 120,
        });
        expect(s.activeTraces.has('trace-1')).toBe(false);
    });

    it('adds an error step and removes the active trace', () => {
        emit(activeEvent, { nodeId: 'node-1', traceId: 'trace-1' });
        emit(completedEvent, {
            nodeId: 'node-1',
            traceId: 'trace-1',
            status: 'error',
            duration: 5,
        });
        const s = useTopologyTraceStore.getState();
        expect(s.steps[1].status).toBe('error');
        expect(s.activeTraces.size).toBe(0);
    });

    it('addStep handles active status manually', () => {
        useTopologyTraceStore.getState().addStep({
            nodeId: 'n1',
            traceId: 't1',
            status: 'active',
            timestamp: 1,
        });
        const s = useTopologyTraceStore.getState();
        expect(s.activeTraces.has('t1')).toBe(true);
        expect(s.steps).toHaveLength(1);
    });

    it('addStep handles done status manually', () => {
        useTopologyTraceStore.getState().addStep({
            nodeId: 'n1',
            traceId: 't1',
            status: 'active',
            timestamp: 1,
        });
        useTopologyTraceStore.getState().addStep({
            nodeId: 'n1',
            traceId: 't1',
            status: 'done',
            timestamp: 2,
        });
        expect(useTopologyTraceStore.getState().activeTraces.has('t1')).toBe(false);
    });

    it('caps active traces at MAX_ACTIVE_TRACES', () => {
        for (let i = 0; i < 120; i++) {
            emit(activeEvent, { nodeId: `n${i}`, traceId: `t${i}` });
        }
        const s = useTopologyTraceStore.getState();
        expect(s.activeTraces.size).toBeLessThanOrEqual(100);
    });

    it('clearTrace removes steps and active trace for a traceId', () => {
        emit(activeEvent, { nodeId: 'n1', traceId: 't1' });
        emit(activeEvent, { nodeId: 'n2', traceId: 't2' });
        useTopologyTraceStore.getState().clearTrace('t1');
        const s = useTopologyTraceStore.getState();
        expect(s.steps.every((st) => st.traceId !== 't1')).toBe(true);
        expect(s.steps.some((st) => st.traceId === 't2')).toBe(true);
        expect(s.activeTraces.has('t1')).toBe(false);
        expect(s.activeTraces.has('t2')).toBe(true);
    });

    it('clearAll empties the store', () => {
        emit(activeEvent, { nodeId: 'n1', traceId: 't1' });
        useTopologyTraceStore.getState().clearAll();
        const s = useTopologyTraceStore.getState();
        expect(s.steps).toEqual([]);
        expect(s.activeTraces.size).toBe(0);
    });

    it('REQUEST_COMPLETED subscription does not mutate state', () => {
        emit(activeEvent, { nodeId: 'n1', traceId: 't1' });
        emit(EVENTS.REQUEST_COMPLETED, { requestId: 'r1' });
        expect(useTopologyTraceStore.getState().steps).toHaveLength(1);
    });

    it('destroy unsubscribes from events', () => {
        useTopologyTraceStore.getState().destroy();
        emit(activeEvent, { nodeId: 'n1', traceId: 't1' });
        expect(useTopologyTraceStore.getState().steps).toHaveLength(0);
    });
});
