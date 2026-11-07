import { describe, expect, it, vi } from 'vitest';
import { CausalTimelineService } from './causal-timeline-service';
import type { ICausalScopeManager, CausalScope, CausalTraceEntry, EventRef } from '../contracts/causal-debugger';
import type { Projection } from '../contracts/projection';
import { EVENTS } from '../events/event-names';

function fakeScopeManager(): ICausalScopeManager {
    const causalId = 'scope-1';
    const scope: CausalScope = {
        causalId,
        requestIds: ['req-1'],
        startedAt: 1,
        providerIds: ['p1'],
        keyIds: ['k1'],
    };
    return {
        getConfig: () => ({ maxScopes: 100, maxScopeSize: 10 }),
        resolveScope: () => scope,
        getScope: () => scope,
        getAllScopes: () => [scope],
    } as unknown as ICausalScopeManager;
}

function fakeKeyState() {
    return { getAll: () => [] } as never;
}

function fakeProjection(): Projection {
    const state: { data: Record<string, unknown>; takenAt: number } = { data: {}, takenAt: 1 };
    return {
        getState: () => state,
        reduce: () => {},
        reset: () => {},
    } as unknown as Projection;
}

function fakeBus() {
    return { on: () => () => {}, onSafe: () => () => {} } as never;
}

function fakeLogger() {
    return { info: () => {}, warn: () => {}, error: () => {} } as never;
}

function makeEntry(): CausalTraceEntry {
    return {
        causalId: 'scope-1',
        requestIds: ['req-1'],
        logPos: 0,
        before: { keyState: { data: {}, takenAt: 1 }, routerState: { data: {}, takenAt: 1 } },
        decision: {
            requestId: 'req-1',
            strategy: 'auto',
            selected: 'p1',
            secondBest: null,
            timestamp: 1,
            scores: [],
            skipped: [],
        },
        after: { keyState: { data: {}, takenAt: 2 }, routerState: { data: {}, takenAt: 2 } },
        links: [],
        createdAt: 1,
    };
}

function entryFor(causalId: string, createdAt = 1): CausalTraceEntry {
    return { ...makeEntry(), causalId, createdAt };
}

describe('CausalTimelineService', () => {
    it('getTrace populates timeline from the eventLogProvider (C2 fix)', () => {
        const events: EventRef[] = [
            { eventName: 'key:state:changed', timestamp: 5, payload: { keyId: 'k1' } },
            { eventName: 'provider:health:changed', timestamp: 6, payload: { providerId: 'p1' } },
            { eventName: 'chat:stream:chunk', timestamp: 7, payload: {} },
        ];
        const svc = new CausalTimelineService(
            fakeScopeManager(),
            fakeKeyState(),
            fakeProjection(),
            fakeBus(),
            fakeLogger(),
            () => events,
        );
        svc.recordDecision(makeEntry());

        const trace = svc.getTrace('scope-1');
        expect(trace).toBeDefined();
        // chat:stream:chunk has no matching key/provider → excluded; the other two match scope.
        expect(trace!.timeline.map((e) => e.eventName)).toEqual([
            'key:state:changed',
            'provider:health:changed',
        ]);
    });

    it('getTrace returns empty timeline when no provider is configured', () => {
        const svc = new CausalTimelineService(
            fakeScopeManager(),
            fakeKeyState(),
            fakeProjection(),
            fakeBus(),
            fakeLogger(),
        );
        svc.recordDecision(makeEntry());
        const trace = svc.getTrace('scope-1');
        expect(trace).toBeDefined();
        expect(trace!.timeline).toEqual([]);
    });

    it('records decisions and lists them in insertion order', () => {
        const svc = new CausalTimelineService(
            fakeScopeManager(),
            fakeKeyState(),
            fakeProjection(),
            fakeBus(),
            fakeLogger(),
        );
        svc.recordDecision(entryFor('c1', 100));
        svc.recordDecision(entryFor('c2', 200));
        expect(svc.listTraces().map((t) => t.causalId)).toEqual(['c1', 'c2']);
        expect(svc.getTrace('c1')?.entry.causalId).toBe('c1');
    });

    it('evicts the oldest trace over the cap', () => {
        const svc = new CausalTimelineService(
            fakeScopeManager(),
            fakeKeyState(),
            fakeProjection(),
            fakeBus(),
            fakeLogger(),
        );
        for (let i = 0; i < 205; i++) {
            svc.recordDecision(entryFor(`c${i}`, i));
        }
        expect(svc.listTraces(500)).toHaveLength(200);
        expect(svc.getTrace('c0')).toBeUndefined();
        expect(svc.getTrace('c204')).toBeDefined();
    });

    it('subscribes to decisions on start and tolerates payloads without requestId', () => {
        const eventBus = {
            on: vi.fn((_event: string, _cb: (...args: unknown[]) => void) => () => {}),
            onSafe: vi.fn((_event: string, _cb: (...args: unknown[]) => void) => () => {}),
        };
        const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
        const svc = new CausalTimelineService(
            fakeScopeManager(),
            fakeKeyState(),
            fakeProjection(),
            eventBus as never,
            logger as never,
        );
        svc.start();
        expect(eventBus.on).toHaveBeenCalledWith(EVENTS.DECISION, expect.any(Function));
        const handler = eventBus.on.mock.calls[0]![1] as (data: unknown) => void;
        handler({ providers: ['p1'] });
        expect(logger.error).not.toHaveBeenCalled();
        svc.destroy();
    });
});
