import { describe, it, expect } from 'vitest';
import {
    suggestTopics,
    suggestByDifficulty,
    suggestByCategory,
    TOPIC_CATEGORIES,
    TOPIC_DIFFICULTIES,
} from './topic-suggestions';

describe('topic-suggestions', () => {
    it('suggestTopics returns the requested count of unique topics', () => {
        const topics = suggestTopics({ count: 3 });
        expect(topics).toHaveLength(3);
        expect(new Set(topics.map((t) => t.topic)).size).toBe(3);
    });

    it('suggestTopics respects avoid list and category filter', () => {
        const topics = suggestTopics({
            count: 10,
            avoid: ['Should AI have legal personhood?'],
            categories: ['ethics'],
        });
        expect(topics.every((t) => t.category === 'ethics')).toBe(true);
        expect(topics.some((t) => t.topic === 'Should AI have legal personhood?')).toBe(false);
    });

    it('suggestTopics returns [] when filter matches nothing', () => {
        expect(suggestTopics({ categories: ['creative'], avoid: ['Will paper books survive another century?'] })).toEqual([]);
    });

    it('suggestByDifficulty filters by difficulty', () => {
        const all = suggestByDifficulty('beginner', 100);
        expect(all.length).toBeGreaterThan(0);
        expect(all.every((t) => t.difficulty === 'beginner')).toBe(true);
    });

    it('suggestByCategory filters by category', () => {
        const all = suggestByCategory('science', 100);
        expect(all.length).toBeGreaterThan(0);
        expect(all.every((t) => t.category === 'science')).toBe(true);
    });

    it('exposes valid category/difficulty enums', () => {
        expect(TOPIC_CATEGORIES).toContain('ethics');
        expect(TOPIC_DIFFICULTIES).toContain('advanced');
    });
});
