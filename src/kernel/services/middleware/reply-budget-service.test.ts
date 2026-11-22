import { describe, it, expect } from 'vitest';
import { ReplyBudgetService } from './reply-budget-service';

describe('ReplyBudgetService', () => {
    it('warns at 80% and exhausts at 100%', () => {
        const svc = new ReplyBudgetService();
        let s = svc.start(100);
        s = svc.consume(s, 50);
        expect(svc.guidance(s)).toBeNull();
        s = svc.consume(s, 30);
        expect(s.warned).toBe(true);
        expect(svc.guidance(s)).toContain('wrap up');
        s = svc.consume(s, 20);
        expect(s.exhausted).toBe(true);
        expect(svc.guidance(s)).toContain('stop generating');
    });

    it('never goes negative', () => {
        const svc = new ReplyBudgetService();
        expect(svc.consume(svc.start(10), -5).usedTokens).toBe(0);
    });
});
