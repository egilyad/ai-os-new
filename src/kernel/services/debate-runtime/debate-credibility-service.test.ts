import { describe, it, expect } from 'vitest';
import { CredibilityScorer } from './debate-credibility-service';

describe('CredibilityScorer', () => {
    const svc = new CredibilityScorer();

    it('scores academic source high', () => {
        const s = svc.scoreSource('According to https://nature.com article');
        expect(s.domainTier).toBe(1);
        expect(s.score).toBeGreaterThan(0.6);
    });

    it('scores blog low', () => {
        const s = svc.scoreSource('From my blog mysite.blogspot.com personal opinion');
        expect(s.score).toBeLessThan(0.6);
    });

    it('scoreSources aggregates correctly', () => {
        const res = svc.scoreSources(['https://nature.com/paper', 'https://reuters.com/news', 'my random blog']);
        expect(res.scores).toHaveLength(3);
        expect(res.average).toBeGreaterThan(0);
        expect(res.average).toBeLessThanOrEqual(1);
        expect(typeof res.lowestTier).toBe('number');
    });

    it('extracts a clean url from a URL citation', () => {
        const s = svc.scoreSource('See https://nature.com/articles/xyz123.');
        expect(s.url).toBe('https://nature.com/articles/xyz123');
        expect(s.domainTier).toBe(1);
    });

    it('strips a wrapping paren from the extracted url', () => {
        const s = svc.scoreSource('(see https://reuters.com/news/today)');
        expect(s.url).toBe('https://reuters.com/news/today');
    });

    it('leaves url undefined for quote-only citations', () => {
        const s = svc.scoreSource('"According to leading experts"');
        expect(s.url).toBeUndefined();
        expect(s.source).toContain('According to');
    });

    it('drops absurdly long urls instead of bloating the prompt', () => {
        const s = svc.scoreSource(`see https://example.com/${'a'.repeat(600)}`);
        expect(s.url).toBeUndefined();
    });
});
