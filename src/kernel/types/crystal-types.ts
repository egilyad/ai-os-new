/**
 * Crystal domain types.
 *
 * A Crystal is an immutable, versioned unit of distilled knowledge with a
 * lifecycle: liquid (proposed) → semi → crystal → superseded/refuted.
 *
 * Unlike a MemoryEntry (raw observation), a Crystal is validated through
 * debates, has explicit provenance and negation form, and can be linked to
 * lenses and roles (see IMPLEMENTATION_PLAN module 2).
 */

export type CrystalStatus = 'semi' | 'crystal' | 'superseded' | 'refuted';

export type CrystalOriginKind = 'debate' | 'observation' | 'synthesis' | 'human' | 'imported';

export type CrystalDomain =
    'arch' | 'prompt' | 'routing' | 'gov' | 'llm' | 'security' | 'economics' | 'general';

export interface CrystalContent {
    /** The core proposition — concise, falsifiable. */
    statement: string;
    /** Optional expansion / justification. */
    elaboration?: string;
    /** Supporting evidence refs (memory ids, URLs, doc paths). */
    evidence?: string[];
    /** Stated assumptions the crystal relies on. */
    assumptions?: string[];
    /** Explicit negation — used for contradiction detection. */
    negationForm?: string;
    /** Bounds of applicability (when NOT to apply). */
    applicabilityBounds?: string;
}

export interface CrystalProvenance {
    originKind: CrystalOriginKind;
    originId: string;
    contributingAgents: string[];
    modelIds: string[];
    totalTokensSpent: number;
}

export interface CrystalValidation {
    debateId?: string;
    proArguments: string[];
    conArguments: string[];
    reviewers: string[];
    humanApproved: boolean;
}

export interface Crystal {
    crystalId: string;
    version: number;
    content: CrystalContent;
    provenance: CrystalProvenance;
    validation: CrystalValidation;
    confidence: number;
    status: CrystalStatus;
    supersededBy?: string;
    contradictingCrystalIds: string[];
    supportingCrystalIds: string[];
    linkedLensIds: string[];
    linkedRoleIds: string[];
    applicableDomain: CrystalDomain;
    createdAt: number;
    crystallizedAt?: number;
    /** sha256(content) for integrity checks. */
    contentHash: string;
}

export type CrystalId = string;

export interface ProposeCrystalInput {
    content: CrystalContent;
    originKind: CrystalOriginKind;
    originId: string;
    contributingAgents?: string[];
    modelIds?: string[];
    totalTokensSpent?: number;
    applicableDomain?: CrystalDomain;
    supportingCrystalIds?: string[];
    linkedLensIds?: string[];
    linkedRoleIds?: string[];
}

export interface CrystalQuery {
    query?: string;
    status?: CrystalStatus;
    domain?: CrystalDomain;
    minConfidence?: number;
    originKind?: CrystalOriginKind;
    lensId?: string;
    limit?: number;
    /** Return latest version only. */
    latestOnly?: boolean;
}

export interface CrystalSearchHit {
    crystal: Crystal;
    score: number;
}
