import { describe, it, expect, vi } from 'vitest';
import { CausalTimelineService } from './causal-timeline-service';
import type { CausalTraceEntry, CausalScope, EventRef } from '../contracts/causal-debugger';
import { EVENTS } from '../events/event-names';

function scope(causalId: string, partial: Partial<CausalScope> = {}): CausalScope {
    return {
        causalId,
        requestIds: [],
        startedAt: 0,
        providerIds: [],
        keyIds: [],
        ...partial,
    };
}

function entry(causalId: string, partial: Partial<CausalTraceEntry> = {}): CausalTraceEntry {
    return {
        causalId,
        requestIds: ['req-1'],
        logPos: 0,
        before: {
            keyState: { data: {}, takenAt: 0 },
            routerState: { data: {}, takenAt: 0 },
        },
        decision: {
            requestId: 'req-1',
            strategy: 'broadcast',
            selected: 'p1',
            secondBest: null,
            timestamp: 0,
            scores: [],
            skipped: [],
        },
        after: {
            keyState: { data: {}, takenAt: 0 },
            routerState: { data: {}, takenAt: 0 },
        },
        links: [],
        createdAt: 0,
        ...partial,
    };
}

function makeService(overrides: {
    scope?: { getScope?: ReturnType<typeof vi.fn> };
    eventLog?: () => EventRef[];
} = {}) {
    const scopeManager = {
        getScope: overrides.scope?.getScope ?? vi.fn(),
        getConfig: vi.fn(),
        resolveScope: vi.fn(),
        getAllScopes: vi.fn(() => []),
    };
    const keyStateStore = {} as never;
    const routerProjection = {} as never;
    const eventBus = { on: vi.fn(() => () => {}), onSafe: vi.fn(() => () => {}) };
    const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    const svc = new CausalTimelineService(
        scopeManager,
        keyStateStore,
        routerProjection,
        eventBus as never,
        logger as never,
        overrides.eventLog,
    );
    return { svc, scopeManager, eventBus, logger };
}

describe('CausalTimelineService', () => {
    it('records decisions and lists them newest-first', () => {
        const { svc } = makeService();
        svc.recordDecision(entry('c1', { createdAt: 100 }));
        svc.recordDecision(entry('c2', { createdAt: 200 }));
        const traces = svc.listTraces();
        expect(traces.map((t) => t.causalId)).toEqual(['c1', 'c2']);
        expect(svc.getTrace('c1')?.entry.causalId).toBe('c1');
    });

    it('evicts the oldest trace over the cap', () => {
        const { svc } = makeService();
        for (let i = 0; i < 205; i++) {
            svc.recordDecision(entry(`c${i}`, { createdAt: i }));
        }
        expect(svc.listTraces(500)).toHaveLength(200);
        expect(svc.getTrace('c0')).toBeUndefined();
        expect(svc.getTrace('c204')).toBeDefined();
    });

    it('filters relevant events by global scope, keyId and providerId', () => {
        const { svc, scopeManager } = makeService({
            scope: {
                getScope: vi.fn(() => scope('c1', { keyIds: ['k1'], providerIds: ['p1'] })),
            },
        });
        const log: EventRef[] = [
            { eventName: 'system:state:changed', timestamp: 1, payload: {} },
            { eventName: 'llm:request', timestamp: 2, payload: { keyId: 'k1' } },
            { eventName: 'llm:request', timestamp: 3, payload: { providerId: 'p1' } },
            { eventName: 'llm:request', timestamp: 4, payload: { keyId: 'other' } },
        ];
        const relevant = svc.getRelevantEvents('c1', { entries: log });
        expect(relevant).toHaveLength(3);
        expect(scopeManager.getScope).toHaveBeenCalledWith('c1');
    });

    it('subscribes to decisions on start and tolerates payloads without requestId', () => {
        const { svc, eventBus, logger } = makeService();
        svc.start();
        expect(eventBus.on).toHaveBeenCalledWith(EVENTS.DECISION, expect.any(Function));
        const handler = eventBus.on.mock.calls[0]![1] as (data: unknown) => void;
        handler({ providers: ['p1'] });
        expect(logger.error).not.toHaveBeenCalled();
        svc.destroy();
    });
});
