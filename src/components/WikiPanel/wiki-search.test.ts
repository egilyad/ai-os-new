import { describe, it, expect } from 'vitest';
import { searchWikiQuick } from './wiki-search';

describe('searchWikiQuick (P2-6)', () => {
    it('returns nothing for empty/whitespace queries', () => {
        expect(searchWikiQuick('')).toEqual([]);
        expect(searchWikiQuick('   ')).toEqual([]);
    });

    it('returns bounded, well-formed hits for a single-letter prefix', () => {
        const hits = searchWikiQuick('п', 5);
        expect(hits.length).toBeLessThanOrEqual(5);
        for (const h of hits) {
            expect(typeof h.slug).toBe('string');
            expect(h.slug.length).toBeGreaterThan(0);
            expect(typeof h.score).toBe('number');
        }
    });

    it('returns nothing when nothing matches', () => {
        expect(searchWikiQuick('zzzz-nothing')).toEqual([]);
    });

    it('matches title prefixes and prefers exact title hits', () => {
        const hits = searchWikiQuick('исключ', 10);
        expect(hits.some((h) => h.slug === 'panel-exceptions')).toBe(true);
    });
});
