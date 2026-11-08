import { describe, it, expect } from 'vitest';
import { filterOptions, scoreOption } from './filter-options';

type Item = { id: string; title: string; description: string };

const ITEMS: Item[] = [
    { id: '1', title: 'API Keys', description: 'Manage provider API keys' },
    { id: '2', title: 'Providers', description: 'Provider pool configuration' },
    { id: '3', title: 'Key Rotation', description: 'Automatic key rotation rules' },
    { id: '4', title: 'Секреты', description: 'Vault passphrase management' },
    { id: '5', title: 'Keys Overview', description: 'Summary of all keys' },
];

describe('scoreOption', () => {
    it('scores empty query as neutral', () => {
        expect(scoreOption(ITEMS[0]!, '', ['title', 'description'])).toEqual({
            score: 0,
            matchedKey: null,
        });
    });

    it('prefers prefix matches over substring matches', () => {
        const prefix = scoreOption(ITEMS[0]!, 'api', ['title']);
        const substring = scoreOption(ITEMS[4]!, 'keys', ['title']);
        expect(prefix.score).toBeGreaterThan(0);
        expect(prefix.score).toBeGreaterThan(substring.score);
    });

    it('matches cyrillic values', () => {
        const s = scoreOption(ITEMS[3]!, 'секреты', ['title']);
        expect(s.score).toBeGreaterThan(0);
        expect(s.matchedKey).toBe('title');
    });

    it('returns zero when nothing matches', () => {
        const s = scoreOption(ITEMS[0]!, 'zzz-nothing', ['title', 'description']);
        expect(s.score).toBe(0);
        expect(s.matchedKey).toBeNull();
    });
});

describe('filterOptions', () => {
    it('returns everything up to limit for an empty query', () => {
        const res = filterOptions(ITEMS, '', ['title']);
        expect(res).toHaveLength(ITEMS.length);
    });

    it('filters and sorts by relevance', () => {
        const res = filterOptions(ITEMS, 'key', ['title', 'description']);
        expect(res.length).toBeGreaterThan(0);
        expect(res[0]!.item.id).toBe('1');
        for (let i = 1; i < res.length; i++) {
            expect(res[i - 1]!.score).toBeGreaterThanOrEqual(res[i]!.score);
        }
    });

    it('respects the limit', () => {
        const res = filterOptions(ITEMS, 'a', ['title', 'description'], 2);
        expect(res).toHaveLength(2);
    });

    it('returns empty for unmatched query', () => {
        const res = filterOptions(ITEMS, 'zzz-nothing', ['title']);
        expect(res).toEqual([]);
    });

    it('matches on any provided key', () => {
        const res = filterOptions(ITEMS, 'vault', ['title', 'description']);
        expect(res.some((r) => r.item.id === '4')).toBe(true);
    });
});
