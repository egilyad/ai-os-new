/**
 * ExecutionVizService static test (G3) — no Dexie, fake buses.
 * Verifies: overlay, rawTrace, declarative map coverage, subscribe.
 */

import { describe, it, expect } from 'vitest';
import { ExecutionVizService } from './execution-viz-service';
import { TIMELINE_MAP } from './timeline-map';

function fakeBus() {
    const handlers = new Map<string, Array<(d: unknown) => void>>();
    return {
        on: (evt: string, cb: (d: unknown) => void) => {
            if (!handlers.has(evt)) handlers.set(evt, []);
            handlers.get(evt)!.push(cb);
            return () => {
                const arr = handlers.get(evt) ?? [];
                const idx = arr.indexOf(cb);
                if (idx >= 0) arr.splice(idx, 1);
            };
        },
        onSafe: function (this: unknown, evt: string, cb: (d: unknown) => void) {
            return (this as ReturnType<typeof fakeBus>).on(evt, cb);
        },
        emit: (evt: string, data: unknown) => {
            for (const cb of handlers.get(evt) ?? []) cb(data);
        },
        _handlers: handlers,
    } as unknown as import('../../types/interfaces').IEventBus & { _handlers: Map<string, unknown> };
}

function fakeTimeline() {
    const evts: Array<{ id: string; title: string; traceId?: string; category: string; type: string; timestamp: number; severity?: string; metadata?: Record<string, unknown>; source?: string }> = [];
    return {
        getEvents: (filter?: { search?: string; limit?: number }) => {
            if (!filter?.search) return evts;
            return evts.filter((e) => e.title.includes(filter.search!) || (e.metadata?.runId as string | undefined) === filter.search);
        },
        addEvent: (e: { title: string; traceId?: string; metadata?: Record<string, unknown> }) => {
            const entry = { id: `tl-${evts.length}`, title: e.title, traceId: e.traceId, category: 'fleet', type: 'graph:started', timestamp: Date.now(), metadata: e.metadata, severity: 'info' as const, source: 'test' };
            evts.push(entry);
            return entry;
        },
        _evts: evts,
    } as unknown as import('../timeline-service').TimelineService & { _evts: unknown[] };
}

function fakeTraceService() {
    const store = new Map<string, import('../../contracts/observability').ExecutionTrace>();
    return {
        getTrace: (id: string) => store.get(id),
        _put: (t: import('../../contracts/observability').ExecutionTrace) => store.set(t.id, t),
    } as unknown as import('../trace-service').TraceService & { _put: (t: import('../../contracts/observability').ExecutionTrace) => void };
}

describe('G3 ExecutionVizService (static)', () => {
    it('TIMELINE_MAP coverage', () => {
        expect(Object.keys(TIMELINE_MAP).length).toBeGreaterThanOrEqual(60);
        expect(TIMELINE_MAP['crew:created']).toBeDefined();
        expect(TIMELINE_MAP['knowledge:hybrid:retrieved']).toBeDefined();
        expect(TIMELINE_MAP['catalog:updated']).toBeDefined();
    });

    it('getOverlay merges direct spans + timeline fallback + trace', async () => {
        const bus = fakeBus();
        const timeline = fakeTimeline();
        const traceSvc = fakeTraceService();
        traceSvc._put({ id: 'run-1', startTime: Date.now(), input: 'hi', status: 'running', steps: [] } as import('../../contracts/observability').ExecutionTrace);
        timeline.addEvent({ type: 'graph_started', category: 'system', timestamp: Date.now(), title: 'Graph started run-1', traceId: 'run-1', metadata: { runId: 'run-1', graphId: 'g1' } });

        const svc = new ExecutionVizService({ events: bus, timeline: timeline as unknown as import('../timeline-service').TimelineService, traceService: traceSvc as unknown as import('../trace-service').TraceService });
        await svc.init();

        // simulate mapped event
        (bus as unknown as { emit: (n: string, d: unknown) => void }).emit('crew:created', { id: 'c1', name: 'MyCrew', runId: 'run-1' });
        // wait microtask
        await new Promise((r) => setTimeout(r, 0));

        const ov = await svc.getOverlay('run-1');
        expect(ov).not.toBeNull();
        expect(ov!.runId).toBe('run-1');
        expect(ov!.spans.length).toBeGreaterThanOrEqual(1);
        expect(ov!.trace?.id).toBe('run-1');
        expect(ov!.stats.total).toBeGreaterThan(0);

        await svc.destroy();
    });

    it('subscribe receives overlay updates', async () => {
        const bus = fakeBus();
        const svc = new ExecutionVizService({ events: bus });
        await svc.init();
        const received: string[] = [];
        const unsub = svc.subscribe((ov) => received.push(ov.runId));
        (bus as unknown as { emit: (n: string, d: unknown) => void }).emit('graph:started', { graphId: 'g1', runId: 'run-2' });
        await new Promise((r) => setTimeout(r, 10));
        expect(received).toContain('run-2');
        unsub();
        await svc.destroy();
    });

    it('getOverlay null if no spans and no trace', async () => {
        const bus = fakeBus();
        const svc = new ExecutionVizService({ events: bus });
        await svc.init();
        const ov = await svc.getOverlay('missing');
        expect(ov).toBeNull();
        await svc.destroy();
    });
});
