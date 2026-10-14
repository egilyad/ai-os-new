import type { Contradiction, GovernorState, SynthesisResult } from './types';
import { detectContradictions } from './contradiction-detector';

/**
 * Similarity cut-off for C1, reused read-only from the novelty check
 * (DebateGovernor.computeNovelty treats jaccard > 0.6 as "same claim").
 */
const GROUNDING_SIMILARITY = 0.6;

export type OutcomeCheck = 'groundedness' | 'contradiction-consistency';

export interface OutcomeIssue {
    check: OutcomeCheck;
    detail: string;
}

export interface OutcomeValidation {
    ok: boolean;
    issues: OutcomeIssue[];
}

function samePair(x: Contradiction, aId: string, bId: string): boolean {
    return (x.claimA === aId && x.claimB === bId) || (x.claimA === bId && x.claimB === aId);
}

function jaccard(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\W+/));
    const wordsB = new Set(b.toLowerCase().split(/\W+/));
    const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;
    return union > 0 ? intersection / union : 0;
}

/**
 * Post-debate outcome validation (track C, without the dropped C3 heuristic).
 *
 * C1 groundedness: every resolvedPoint must paraphrase an actual graph claim,
 * so a hallucinated consensus point is reported instead of trusted.
 * C2 contradiction consistency: a contradiction recorded as resolved that is
 * still freshly detected is reported as false-resolved.
 *
 * Pure and non-blocking: returns a report, never stops or alters the debate.
 */
export function validateOutcome(
    state: GovernorState,
    synthesis: SynthesisResult,
): OutcomeValidation {
    const issues: OutcomeIssue[] = [];
    const claims = Object.values(state.graph.claims);

    for (const point of synthesis.resolvedPoints) {
        const grounded = claims.some((c) => jaccard(point, c.text) > GROUNDING_SIMILARITY);
        if (!grounded) {
            issues.push({
                check: 'groundedness',
                detail: `resolved point has no source claim: "${point.slice(0, 120)}"`,
            });
        }
    }

    const fresh = detectContradictions(state.graph);
    for (const c of state.contradictions) {
        if (c.status !== 'resolved') continue;
        const stillOpen = fresh.some((f) => samePair(f, c.claimA, c.claimB));
        if (stillOpen) {
            issues.push({
                check: 'contradiction-consistency',
                detail: `contradiction ${c.id} marked resolved but still detected (${c.claimA} vs ${c.claimB})`,
            });
        }
    }

    return { ok: issues.length === 0, issues };
}
