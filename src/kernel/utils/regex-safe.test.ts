import { describe, it, expect } from 'vitest';
import { isReDoSPattern } from './regex-safe';

describe('isReDoSPattern (W6-023)', () => {
    it('flags ambiguous nested quantifiers', () => {
        expect(isReDoSPattern('(a+)+')).toBe(true);
        expect(isReDoSPattern('(a*)*')).toBe(true);
        expect(isReDoSPattern('([a-z]+)*')).toBe(true);
        expect(isReDoSPattern('(x{1,})+')).toBe(true);
    });

    it('flags repeated dot-star', () => {
        expect(isReDoSPattern('.*.*')).toBe(true);
    });

    it('allows safe patterns', () => {
        expect(isReDoSPattern('\\b[a-z]+@[a-z]+\\.[a-z]{2,}\\b')).toBe(false);
        expect(isReDoSPattern('gpt-4')).toBe(false);
        expect(isReDoSPattern('^\\d{3}-\\d{2}-\\d{4}$')).toBe(false);
    });
});
