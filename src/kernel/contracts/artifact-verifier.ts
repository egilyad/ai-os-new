import type { ILifecycle } from './lifecycle';

export interface ArtifactVerification {
    verdict: 'pass' | 'revise' | 'reject';
    score: number;
    checks: {
        nonEmpty: boolean;
        expectedOutput: boolean;
        noErrorMarkers: boolean;
        /** Output does not look like a stub/placeholder. */
        substantive: boolean;
        /** Share of expected keywords present (0..1). */
        keywordScore: number;
        llmPassed?: boolean;
    };
    reasoning: string;
    via: 'heuristic' | 'llm';
}

export interface VerifyArtifactInput {
    task: string;
    output: string;
    expectedOutput?: string;
}

export interface RefinementComparison {
    /** Overall score before and after the patch. */
    before: number;
    after: number;
    /** Per-axis deltas (axis → after - before). */
    deltas: Record<string, number>;
    totalGain: number;
    totalDrop: number;
    outcome:
        | 'ACCEPTED_SCORE_INCREASE'
        | 'REJECTED_SCORE_DECREASE'
        | 'REJECTED_CRITICAL_DEGRADATION'
        | 'REJECTED_DEGRADATION'
        | 'ACCEPTED_NEUTRAL_IMPROVEMENT';
    /** True when the patch must be reverted (score decreased or axes degraded). */
    revert: boolean;
    reasoning: string;
}

/** Verifier for agent-produced artifacts: deterministic checks + optional LLM judge. */
export interface IArtifactVerifierService extends ILifecycle {
    verify(input: VerifyArtifactInput): Promise<ArtifactVerification>;
    /**
     * Compare reviewer scores before/after a refinement (PaperOrchestra-style):
     * accept on improvement, revert when overall drops or sub-axes degrade.
     */
    compare(
        before: { overall: number; axes?: Record<string, number> },
        after: { overall: number; axes?: Record<string, number> },
    ): RefinementComparison;
}
