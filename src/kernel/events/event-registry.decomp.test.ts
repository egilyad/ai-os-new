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
        for (const key of Object.keys(EVENT_REGISTRY)) {
            expect(EVENTS[key as keyof typeof EVENTS]).toBe(EVENT_REGISTRY[key].name);
        }
    });

    it('EventValidators covers every registered event', () => {
        for (const entry of Object.values(EVENT_REGISTRY)) {
            expect(EventValidators[entry.name]).toBeDefined();
        }
    });
});
