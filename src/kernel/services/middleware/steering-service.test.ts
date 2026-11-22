import { describe, it, expect } from 'vitest';
import { SteeringService } from './steering-service';

describe('SteeringService', () => {
    it('drains pending hints into a prompt block', () => {
        const svc = new SteeringService();
        svc.push({ text: 'Focus on evidence', priority: 'normal' });
        svc.push({ text: 'Be concise', priority: 'high' });
        const block = svc.drain();
        expect(block).toContain('[high] Be concise');
        expect(block).toContain('[normal] Focus on evidence');
        expect(svc.pending()).toHaveLength(0);
        expect(svc.drain()).toBeNull();
    });

    it('respects the max limit', () => {
        const svc = new SteeringService();
        for (let i = 0; i < 4; i++) svc.push({ text: `hint ${i}`, priority: 'low' });
        expect(svc.drain(2)).toContain('hint 0');
        expect(svc.pending()).toHaveLength(2);
    });

    it('supports clear', () => {
        const svc = new SteeringService();
        svc.push({ text: 'x', priority: 'low' });
        svc.clear();
        expect(svc.pending()).toEqual([]);
    });
});
