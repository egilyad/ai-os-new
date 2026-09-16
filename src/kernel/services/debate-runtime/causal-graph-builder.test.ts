import { describe, it, expect } from 'vitest';
import { CausalGraphBuilder } from './causal-graph-builder';

describe('CausalGraphBuilder', () => {
    it('ingest and analyze linear chain', () => {
        const svc = new CausalGraphBuilder();
        svc.ingestClaim('s1', 'alice', 'Higher taxes causes reduced spending', 1);
        svc.ingestClaim('s1', 'bob', 'Reduced spending leads to lower growth', 2);
        const analysis = svc.getAnalysis('s1');
        expect(analysis).toBeDefined();
        expect(analysis!.totalClaims).toBeGreaterThanOrEqual(2);
    });

    it('returns undefined for unknown session', () => {
        const svc = new CausalGraphBuilder();
        expect(svc.getAnalysis('unknown')).toBeUndefined();
        expect(svc.getCausalContext('unknown', 'alice', ['alice', 'bob'], 1, 'English')).toBeUndefined();
    });

    it('reset clears session', () => {
        const svc = new CausalGraphBuilder();
        svc.ingestClaim('s2', 'alice', 'X causes Y', 1);
        svc.reset('s2');
        expect(svc.getAnalysis('s2')).toBeUndefined();
    });
});
