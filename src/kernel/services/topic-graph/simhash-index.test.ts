import { describe, it, expect } from 'vitest';
import {
    SimHashIndex,
    simhash64,
    hammingDistance,
    isNearDuplicate,
    tokenizeSimple,
} from './simhash-index';

describe('simhash64', () => {
    it('produces a 64-bit hash', () => {
        const h = simhash64('OpenCode поддерживает MCP-серверы');
        expect(h).toBeGreaterThan(0n);
        expect(h).toBeLessThan(2n ** 64n);
    });

    it('is stable for identical text', () => {
        expect(simhash64('один и тот же текст')).toBe(simhash64('один и тот же текст'));
    });

    it('is near-identical for long paraphrases', () => {
        const a = simhash64('OpenCode поддерживает MCP-серверы и умеет работать с ними');
        const b = simhash64('OpenCode поддерживает MCP-серверы и умеет работать с ними на');
        expect(isNearDuplicate(a, b)).toBe(true);
    });

    it('is far apart for unrelated texts', () => {
        const a = simhash64('установка пакетов через менеджер');
        const b = simhash64('погода в Москве сегодня ясная');
        expect(hammingDistance(a, b)).toBeGreaterThan(20);
    });
});

describe('tokenizeSimple', () => {
    it('lowercases and splits words/numbers', () => {
        expect(tokenizeSimple('OpenCode 1.19.4, МСР!')).toContain('opencode');
        expect(tokenizeSimple('OpenCode 1.19.4, МСР!')).toContain('1');
        expect(tokenizeSimple('OpenCode 1.19.4, МСР!')).toContain('19');
    });
});

describe('SimHashIndex', () => {
    it('returns candidates for near-duplicate queries', () => {
        const index = new SimHashIndex<number>();
        index.add('OpenCode поддерживает MCP-серверы и умеет работать с ними', 1);
        index.add('совершенно другая тема про космос и глубину', 2);
        const hits = index.queryText(
            'OpenCode поддерживает MCP-серверы и умеет работать с ними на',
        );
        expect(hits.map((h) => h.data)).toContain(1);
        expect(hits.map((h) => h.data)).not.toContain(2);
    });

    it('returns candidates for short texts via the flat list', () => {
        const index = new SimHashIndex<number>();
        index.add('каталог файлов', 1);
        index.add('обсуждение архитектуры системы', 2);
        const hits = index.queryText('каталог файлов');
        expect(hits.map((h) => h.data)).toContain(1);
    });

    it('returns nothing from an empty index', () => {
        const index = new SimHashIndex<number>();
        expect(index.queryText('что угодно')).toEqual([]);
    });

    it('tracks size and supports clear', () => {
        const index = new SimHashIndex<number>();
        index.add('a', 1);
        index.add('b', 2);
        expect(index.size).toBe(2);
        index.clear();
        expect(index.size).toBe(0);
    });

    it('candidate set is a small fraction of a diverse corpus', () => {
        const index = new SimHashIndex<number>();
        for (let i = 0; i < 500; i++) {
            index.add(`отдельная тема номер ${i}: рецепты, путешествия и наблюдения`, i);
        }
        index.add('OpenCode поддерживает MCP-серверы и умеет работать с ними на', 42);
        const hits = index.queryText('OpenCode поддерживает MCP-серверы и умеет работать с ними');
        expect(hits.length).toBeLessThan(30);
        expect(hits.map((h) => h.data)).toContain(42);
    });
});
