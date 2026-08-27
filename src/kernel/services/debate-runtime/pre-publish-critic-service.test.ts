import { describe, it, expect } from 'vitest';
import { PrePublishCriticService } from './pre-publish-critic-service';

describe('PrePublishCriticService', () => {
    const svc = new PrePublishCriticService();

    it('detects unsupported absolute claim', () => {
        const issues = svc.review('This is always true for everyone definitely.');
        expect(issues.some((i) => i.type === 'unsupported')).toBe(true);
    });

    it('detects ad hominem', () => {
        const issues = svc.review('You are stupid and ignorant, your argument is wrong.');
        expect(issues.some((i) => i.type === 'fallacy')).toBe(true);
    });

    it('detects vague attribution', () => {
        const issues = svc.review('Some people say it is known that many believe this.');
        expect(issues.some((i) => i.type === 'vague')).toBe(true);
    });

    it('shouldBlock when high severity present', () => {
        expect(svc.shouldBlock('This is always true for everyone definitely.')).toBe(true);
        expect(svc.shouldBlock('A balanced argument with source https://example.com and data 42.')).toBe(false);
    });

    it('clean text has no issues', () => {
        expect(svc.review('According to study 2023, 42% of users prefer option A. Source: https://example.com')).toEqual([]);
    });
});
