import { describe, it, expect } from 'vitest';
import { EVENT_REGISTRY, EVENTS, EventValidators } from './event-registry';

describe('event-registry decomposition (P3-5)', () => {
    it('registry is assembled from all group modules', () => {
        const keys = Object.keys(EVENT_REGISTRY);
        expect(keys.length).toBeGreaterThan(500);
    });

    it('every event name is unique', () => {
        const names = Object.values(EVENT_REGISTRY).map((e) => e.name);
        expect(new Set(names).size).toBe(names.length);
    });

    it('EVENTS mirrors registry names', () => {
        const events = EVENTS as Record<string, string>;
        const entries = Object.entries(EVENT_REGISTRY) as Array<
            [string, { name: string; schema: unknown }]
        >;
        for (const [key, entry] of entries) {
            expect(events[key]).toBe(entry.name);
        }
    });

    it('EventValidators covers every registered event', () => {
        const entries = Object.values(EVENT_REGISTRY) as Array<{ name: string; schema: unknown }>;
        for (const entry of entries) {
            expect(EventValidators[entry.name]).toBeDefined();
        }
    });
});
