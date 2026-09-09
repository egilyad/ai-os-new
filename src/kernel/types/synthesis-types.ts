/**
 * Synthesis domain types.
 *
 * A Synthesis is a multi-perspective consensus over a question:
 * pairs (role × lens) produce perspectives, which collide in a cross-
 * perspective debate, and an orchestrator (meta:navigator) separates the
 * result into consensus / dissent / uncertainty zones. Dissent with
 * `irreducible: true` is explicitly preserved, not suppressed (plan §4).
 */

export type SynthesisStatus = 'running' | 'completed' | 'failed' | 'refined';

export type SynthesisDepth = 'quick' | 'standard' | 'deep';

export type ZoneKind = 'consensus' | 'dissent' | 'uncertainty';

export interface SynthesisInput {
    /** The central question being synthesized. */
    question: string;
    /** Optional background context fed to every perspective. */
    context?: string;
    /** Roles participating in the synthesis (roleIds). */
    roleIds: string[];
    /** Lenses applied to each perspective (lensIds). */
    lensIds: string[];
    /** Debate strategy used for the cross-perspective debate (one of 13). */
    debateStrategy?: string;
    /** Depth controls how many sub-questions / perspectives are generated. */
    depth?: SynthesisDepth;
    /** When true, irreducible dissent is preserved in the statement. */
    preserveDissent?: boolean;
    /** Max tokens to spend on the whole synthesis. */
    costBudget?: number;
}

/** A single role × lens perspective. */
export interface Perspective {
    id: string;
    roleId: string;
    roleName: string;
    lensId: string;
    lensName: string;
    /** The argument this perspective contributes. */
    argument: string;
    /** Self-assessed confidence 0..1. */
    confidence: number;
    /** Atomic claims the perspective asserts. */
    keyClaims: string[];
    /** Points where the perspective concedes ground to opponents. */
    concessions: string[];
    /** Sub-questions the perspective raised during decomposition. */
    subQuestions: string[];
    tokensUsed: number;
}

export interface ConsensusZone {
    id: string;
    kind: 'consensus';
    claim: string;
    supportingPerspectiveIds: string[];
    /** 0..1 — strength of agreement. */
    confidence: number;
}

export interface DissentZone {
    id: string;
    kind: 'dissent';
    claim: string;
    /** Opposing positions keyed by perspective. */
    positions: Array<{ perspectiveId: string; stance: string }>;
    /** True when the disagreement cannot be resolved with current data. */
    irreducible: boolean;
}

export interface UncertaintyZone {
    id: string;
    kind: 'uncertainty';
    claim: string;
    why: string;
    neededEvidences: string[];
}

export type SynthesisZone = ConsensusZone | DissentZone | UncertaintyZone;

/** Distribution of the output across zones. */
export interface ConfidenceDist {
    consensus: number;
    dissent: number;
    uncertainty: number;
}

export interface Synthesis {
    id: string;
    status: SynthesisStatus;
    input: SynthesisInput;
    subQuestions: string[];
    perspectives: Perspective[];
    consensusZones: ConsensusZone[];
    dissentZones: DissentZone[];
    uncertaintyZones: UncertaintyZone[];
    synthesizedStatement: string;
    confidenceDistribution: ConfidenceDist;
    supportingCrystals: string[];
    contradictingCrystals: string[];
    generatedCrystalId?: string;
    debateIds: string[];
    totalTokensSpent: number;
    createdAt: number;
    completedAt?: number;
    /** Parent synthesis id when this record is a refinement. */
    refinedFrom?: string;
}

export type SynthesisId = string;

export interface SynthesisFeedback {
    comments?: string;
    focusAreas?: string[];
}

/** Persistence record — synthesis session header. */
export interface SynthesisSessionRecord {
    id: string;
    question: string;
    status: SynthesisStatus;
    depth: SynthesisDepth;
    preserveDissent: boolean;
    lensIds: string[];
    roleIds: string[];
    synthesizedStatement?: string;
    createdAt: number;
    /** Full synthesis object for round-trip reads. */
    synthesis?: Synthesis;
}

/** Persistence record — single perspective row. */
export interface SynthesisPerspectiveRecord {
    id: string;
    synthesisId: string;
    roleId: string;
    lensId: string;
    argument: string;
    confidence: number;
    tokensUsed: number;
}

export interface SynthesisQuery {
    status?: SynthesisStatus;
    limit?: number;
}
