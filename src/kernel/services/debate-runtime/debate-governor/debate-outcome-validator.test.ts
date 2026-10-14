import { describe, it, expect } from 'vitest';
import { DebateGovernor } from './debate-governor';
import { resolveContradiction } from './contradiction-detector';
import type { SynthesisResult } from './types';

const POINT_A =
    'Nuclear energy expansion provides reliable baseload electricity generation for national power grids today.';
const POINT_B =
    'However wind and solar farms cannot match nuclear baseload electricity generation for national power grids.';

function blankSynthesis(resolvedPoints: string[]): SynthesisResult {
    return {
        consensus: '',
        coreDisagreement: '',
        resolvedPoints,
        unresolvedPoints: [],
        phase: 'consensus',
    };
}

describe('validateOutcome (track C: C1 groundedness, C2 contradiction consistency)', () => {
    it('C1: passes a resolved point taken from the debate', () => {
        const g = new DebateGovernor();
        g.ingestArgument(POINT_A, 'a1', 's1', 'pro', 1);
        const result = g.validateSynthesis(blankSynthesis([POINT_A]));
        expect(result.ok).toBe(true);
        expect(result.issues).toEqual([]);
    });

    it('C1: flags a resolved point with no source claim', () => {
        const g = new DebateGovernor();
        g.ingestArgument(POINT_A, 'a1', 's1', 'pro', 1);
        const result = g.validateSynthesis(
            blankSynthesis([
                'Secret lunar colonies already trade helium with Martian settlements today.',
            ]),
        );
        expect(result.ok).toBe(false);
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0]!.check).toBe('groundedness');
    });

    it('C2: flags a contradiction marked resolved while still detected', () => {
        const g = new DebateGovernor();
        g.ingestArgument(POINT_A, 'a1', 's1', 'pro', 1);
        g.ingestArgument(POINT_B, 'b1', 's2', 'con', 1);
        const found = g.updateContradictions();
        expect(found.length).toBeGreaterThanOrEqual(1);
        const state = g.getState();
        state.contradictions = resolveContradiction(state.contradictions, found[0]!.id);
        const result = g.validateSynthesis(g.generateSynthesis());
        expect(result.ok).toBe(false);
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0]!.check).toBe('contradiction-consistency');
    });

    it('C2: stays silent when the resolved pair is genuinely gone', () => {
        const g = new DebateGovernor();
        g.ingestArgument(POINT_A, 'a1', 's1', 'pro', 1);
        g.ingestArgument(POINT_B, 'b1', 's2', 'con', 1);
        expect(g.updateContradictions().length).toBeGreaterThanOrEqual(1);
        // Move on: rounds 2-3 leave the round-1 pair outside the detection window.
        g.ingestArgument(
            'Public libraries lend books freely to every resident of the municipality all year round.',
            'a2',
            's1',
            'pro',
            2,
        );
        g.ingestArgument(
            'Urban parks need regular maintenance funding from the municipal budget every single year.',
            'a3',
            's1',
            'pro',
            3,
        );
        const merged = g.updateContradictions();
        expect(merged.some((c) => c.status === 'resolved')).toBe(true);
        const result = g.validateSynthesis(g.generateSynthesis());
        expect(result.issues).toEqual([]);
        expect(result.ok).toBe(true);
    });
});
