import { describe, it, expect, vi } from 'vitest';
import { TimelineService, type TimelineServiceDeps } from './timeline-service';
import { EVENTS } from '../events/event-names';

function makeDeps(): TimelineServiceDeps {
    return {
        eventBus: {
            on: vi.fn(() => () => {}),
            onSafe: vi.fn(() => () => {}),
            emit: vi.fn(),
        },
    };
}

function baseEvent(partial: Record<string, unknown> = {}) {
    return {
        type: 'system_event',
        category: 'system',
        timestamp: 1000,
        title: 'test event',
        severity: 'info',
        source: 'test',
        ...partial,
    };
}

describe('TimelineService', () => {
    it('addEvent appends and emits TIMELINE_EVENT_ADDED', () => {
        const deps = makeDeps();
        const svc = new TimelineService(deps);
        const added = svc.addEvent(baseEvent());
        expect(svc.getEvent(added.id)).toBeDefined();
        expect(deps.eventBus.emit).toHaveBeenCalledWith(EVENTS.TIMELINE_EVENT_ADDED, {
            eventId: added.id,
            type: 'system_event',
            category: 'system',
            timestamp: 1000,
            title: 'test event',
        });
    });

    it('getEvents filters by category, severity, search and limit', () => {
        const deps = makeDeps();
        const svc = new TimelineService(deps);
        svc.addEvents([
            baseEvent({ title: 'alpha', category: 'provider', severity: 'error' }),
            baseEvent({ title: 'beta', category: 'system', severity: 'info' }),
            baseEvent({ title: 'gamma', category: 'system', severity: 'warning' }),
        ]);
        const byCategory = svc.getEvents({ categories: ['system'] });
        expect(byCategory).toHaveLength(2);
        const bySeverity = svc.getEvents({ severity: 'error' });
        expect(bySeverity).toHaveLength(1);
        const bySearch = svc.getEvents({ search: 'alpha' });
        expect(bySearch).toHaveLength(1);
        const limited = svc.getEvents({ limit: 2 });
        expect(limited).toHaveLength(2);
    });

    it('getEventStats aggregates by category and severity', () => {
        const deps = makeDeps();
        const svc = new TimelineService(deps);
        svc.addEvents([
            baseEvent({ category: 'provider', severity: 'error' }),
            baseEvent({ category: 'provider', severity: 'error' }),
            baseEvent({ category: 'system', severity: 'info' }),
        ]);
        const stats = svc.getEventStats();
        expect(stats.total).toBe(3);
        expect(stats.byCategory).toEqual({ provider: 2, system: 1 });
        expect(stats.bySeverity).toEqual({ error: 2, info: 1 });
    });

    it('clearEvents emits TIMELINE_CLEARED', () => {
        const deps = makeDeps();
        const svc = new TimelineService(deps);
        svc.addEvent(baseEvent());
        svc.clearEvents();
        expect(svc.getEvents()).toEqual([]);
        expect(deps.eventBus.emit).toHaveBeenCalledWith(EVENTS.TIMELINE_CLEARED, {
            count: 1,
            timestamp: expect.any(Number),
        });
    });
});
