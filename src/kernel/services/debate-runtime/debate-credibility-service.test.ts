import { describe, it, expect } from 'vitest';
import { CredibilityScorer } from './debate-credibility-service';

describe('CredibilityScorer', () => {
    const svc = new CredibilityScorer();

    it('scores academic source high', () => {
        const s = svc.scoreSource('According to https://nature.com article');
        expect(s.tier ?? s.domainTier).toBe(1);
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
});
