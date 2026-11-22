import { describe, it, expect } from 'vitest';
import { HumanFeedbackService } from './human-feedback-service';

describe('HumanFeedbackService', () => {
    it('aggregates repeated feedback into a delta', () => {
        const svc = new HumanFeedbackService();
        svc.add({ agentId: 'a1', task: 't', feedback: 'Be more concise' });
        svc.add({ agentId: 'a1', task: 't', feedback: 'Too long, shorten it' });
        const d = svc.deltas('a1');
        expect(d[0]!.theme).toBe('conciseness');
        expect(d[0]!.occurrences).toBe(2);
    });

    it('builds an improved prompt from top deltas', () => {
        const svc = new HumanFeedbackService();
        svc.add({ agentId: 'a1', task: 't', feedback: 'Add sources and evidence' });
        const prompt = svc.improvedPrompt('You are an analyst.', 'a1');
        expect(prompt).toContain('You are an analyst.');
        expect(prompt).toContain('Learned review guidance');
        expect(prompt).toContain('Cite concrete sources');
    });

    it('returns base prompt unchanged without feedback', () => {
        expect(new HumanFeedbackService().improvedPrompt('base', 'none')).toBe('base');
    });
});
