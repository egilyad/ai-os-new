import { describe, it, expect } from 'vitest';
import { ReviewRetryService } from './review-retry-service';

describe('ReviewRetryService', () => {
    it('accepts a submission above threshold on the first attempt', async () => {
        const svc = new ReviewRetryService();
        const r = await svc.run({
            threshold: 7,
            maxAttempts: 3,
            produce: async () => 'v1',
            review: async () => ({ overall: 8 }),
        });
        expect(r.accepted).toBe(true);
        expect(r.attempts).toBe(1);
        expect(r.value).toBe('v1');
    });

    it('retries with previous feedback and accepts on improvement', async () => {
        const svc = new ReviewRetryService();
        const seen: Array<string | undefined> = [];
        const r = await svc.run({
            threshold: 8,
            maxAttempts: 3,
            produce: async (feedback) => {
                seen.push(feedback);
                return feedback ? 'v2' : 'v1';
            },
            review: async (value) =>
                value === 'v2' ? { overall: 9 } : { overall: 4, feedback: 'add evidence' },
        });
        expect(r.accepted).toBe(true);
        expect(r.attempts).toBe(2);
        expect(seen).toEqual([undefined, 'add evidence']);
    });

    it('keeps the best attempt and marks rejected when budget is exhausted', async () => {
        const svc = new ReviewRetryService();
        const r = await svc.run<string>({
            threshold: 10,
            maxAttempts: 3,
            produce: async (_, i) => `v${i}`,
            review: async (_, i) => ({ overall: 5 + i }),
        });
        expect(r.accepted).toBe(false);
        expect(r.attempts).toBe(3);
        expect(r.value).toBe('v2');
        expect(r.score.overall).toBe(5);
    });
});
