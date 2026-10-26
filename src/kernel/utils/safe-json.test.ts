import { describe, expect, it } from 'vitest';
import { safeJsonParse } from './safe-json';

describe('safeJsonParse', () => {
    it('parses valid JSON', () => {
        expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
    });

    it('returns undefined on invalid JSON without fallback', () => {
        expect(safeJsonParse('not-json')).toBeUndefined();
    });

    it('returns fallback on invalid JSON', () => {
        expect(safeJsonParse('not-json', { def: true })).toEqual({ def: true });
    });

    it('neutralizes prototype-pollution keys', () => {
        const parsed = safeJsonParse<Record<string, unknown>>('{"__proto__":{"x":1},"a":2}');
        expect(parsed).toEqual({ a: 2 });
        // The parsed object must NOT inherit the injected prototype.
        expect((parsed as Record<string, unknown>).x).toBeUndefined();
        expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    });
});
