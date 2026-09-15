/**
 * SmartRetry tests — AGEMS port Phase 12.6.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SmartRetry } from './smart-retry';

describe('SmartRetry', () => {
    let retry: SmartRetry;

    beforeEach(() => {
        retry = new SmartRetry({ maxRetries: 3, baseDelayMs: 1000, backoffMultiplier: 2 });
    });

    it('calculates exponential backoff', () => {
        const r1 = retry.nextRetry('error');
        expect(r1.attempt).toBe(1);
        expect(r1.delayMs).toBe(1000);
        expect(r1.shouldRetry).toBe(true);

        const r2 = retry.nextRetry('error');
        expect(r2.attempt).toBe(2);
        expect(r2.delayMs).toBe(2000);
        expect(r2.shouldRetry).toBe(true);

        const r3 = retry.nextRetry('error');
        expect(r3.attempt).toBe(3);
        expect(r3.delayMs).toBe(4000);
        expect(r3.shouldRetry).toBe(true);

        const r4 = retry.nextRetry('error');
        expect(r4.attempt).toBe(4);
        expect(r4.shouldRetry).toBe(false);
        expect(r4.delayMs).toBe(0);
    });

    it('respects max delay', () => {
        const r = new SmartRetry({ maxRetries: 10, baseDelayMs: 1000, maxDelayMs: 5000, backoffMultiplier: 2 });
        let last = r.nextRetry('e');
        for (let i = 0; i < 10; i++) {
            last = r.nextRetry('e');
        }
        expect(last.delayMs).toBeLessThanOrEqual(5000);
    });

    it('reset clears state', () => {
        retry.nextRetry('e');
        retry.nextRetry('e');
        retry.reset();
        const r = retry.nextRetry('e');
        expect(r.attempt).toBe(1);
    });

    it('isRetryable identifies retryable errors', () => {
        expect(retry.isRetryable('timeout')).toBe(true);
        expect(retry.isRetryable('rate limit exceeded')).toBe(true);
        expect(retry.isRetryable('429 Too Many Requests')).toBe(true);
        expect(retry.isRetryable('ECONNRESET')).toBe(true);
        expect(retry.isRetryable('ECONNREFUSED')).toBe(true);
        expect(retry.isRetryable('ETIMEDOUT')).toBe(true);
        expect(retry.isRetryable('invalid api key')).toBe(false);
        expect(retry.isRetryable('authentication failed')).toBe(false);
    });

    it('getAttempt returns current attempt', () => {
        expect(retry.getAttempt()).toBe(0);
        retry.nextRetry('e');
        expect(retry.getAttempt()).toBe(1);
    });
});
