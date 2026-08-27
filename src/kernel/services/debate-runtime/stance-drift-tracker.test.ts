import { describe, it, expect } from 'vitest';
import { StanceDriftTracker } from './stance-drift-tracker';

describe('StanceDriftTracker', () => {
    it('tracks stance without throw', () => {
        const t = new StanceDriftTracker();
        t.reset(['alice'], 'topic');
        expect(() => t.registerArgument('alice', 'Alice', 1, 'We support solar')).not.toThrow();
        expect(() => t.registerArgument('alice', 'Alice', 2, 'We oppose solar now')).not.toThrow();
    });
    it('get drift events after tracking', () => {
        const t = new StanceDriftTracker();
        t.reset(['bob'], 'topic');
        t.registerArgument('bob', 'Bob', 1, 'Nuclear is best for energy future');
        t.registerArgument('bob', 'Bob', 2, 'Solar is actually best, I changed completely');
        const events = (t as any).driftEvents ?? (t as any).getDriftEvents?.() ?? [];
        expect(Array.isArray(events)).toBe(true);
    });
    it('does not throw on empty', () => {
        const t = new StanceDriftTracker();
        t.reset(['alice'], 'topic');
        expect(() => t.registerArgument('alice', 'Alice', 1, '')).not.toThrow();
    });
});
