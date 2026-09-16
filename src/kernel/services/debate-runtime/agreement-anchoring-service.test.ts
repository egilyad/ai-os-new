import { describe, it, expect } from 'vitest';
import { AgreementAnchoringService } from './agreement-anchoring-service';

describe('AgreementAnchoringService', () => {
    const svc = new AgreementAnchoringService();

    it('returns empty when less than 2 args or single agent', () => {
        expect(svc.findSharedPremises([])).toEqual([]);
        expect(svc.findSharedPremises([{ id: 'a1', agentId: 'alice', content: 'hello world test one two three', round: 1 }])).toEqual([]);
        expect(
            svc.findSharedPremises([
                { id: 'a1', agentId: 'alice', content: 'climate change requires action now', round: 1 },
                { id: 'a2', agentId: 'alice', content: 'climate change requires action indeed', round: 2 },
            ]),
        ).toEqual([]);
    });

    it('finds shared trigrams across agents', () => {
        const args = [
            { id: 'a1', agentId: 'alice', content: 'climate change requires immediate global action today', round: 1 },
            { id: 'b1', agentId: 'bob', content: 'climate change requires immediate global response today', round: 1 },
            { id: 'c1', agentId: 'carol', content: 'we love cats and dogs', round: 1 },
        ];
        const premises = svc.findSharedPremises(args);
        expect(premises.length).toBeGreaterThan(0);
        expect(premises[0].participantIds.length).toBeGreaterThanOrEqual(2);
        expect(premises[0].confidence).toBeGreaterThan(0);
    });

    it('high overlap gives higher confidence', () => {
        const args = [
            { id: 'a1', agentId: 'alice', content: 'the quick brown fox jumps over the lazy dog', round: 1 },
            { id: 'b1', agentId: 'bob', content: 'the quick brown fox jumps over the lazy dog', round: 1 },
        ];
        const premises = svc.findSharedPremises(args);
        expect(premises[0].confidence).toBe(1);
    });
});
