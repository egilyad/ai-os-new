/**
 * Junction domain types.
 *
 * A Junction is a cross-domain synthesis: a structural connection between two
 * or more knowledge sources (crystals, debates, forum threads) from different
 * domains that produces new knowledge S' = f(A, B).
 *
 * Lifecycle: candidate (detected) → pending (published) → validated / rejected.
 */

export type JunctionSynthesisType =
    'structural_analogy' | 'contradiction' | 'abstraction' | 'pattern_completion';

export type JunctionStatus = 'pending' | 'validated' | 'rejected' | 'superseded';

export type JunctionSourceKind = 'debate' | 'forum' | 'crystal';

export type JunctionAgentRole = 'bridge-builder' | 'contradiction-miner' | 'abstraction-elevator';

/** A single input reference to a junction. */
export interface JunctionSource {
    kind: JunctionSourceKind;
    /** Source id: debate://sessionId, crystal://crystalId, forum://threadId. */
    id: string;
    /** Human-readable label for the UI. */
    label: string;
    /** Domain of the source (e.g. 'arch', 'llm', 'gov'). */
    domain: string;
    /** The core claim/statement text from the source. */
    statement: string;
}

/** A structural link detected between sources — not yet persisted. */
export interface JunctionCandidate {
    candidateId: string;
    inputs: JunctionSource[];
    synthesisType: JunctionSynthesisType;
    confidence: number;
    rationale: string;
    agentRole: JunctionAgentRole;
    createdAt: number;
}

/** A persisted junction with lifecycle + cognitive debt. */
export interface Junction {
    id: string;
    inputs: JunctionSource[];
    synthesisType: JunctionSynthesisType;
    confidence: number;
    content: string;
    status: JunctionStatus;
    cognitiveDebt: string;
    rationale: string;
    agentRole: JunctionAgentRole;
    createdAt: number;
    validatedAt?: number;
    rejectedAt?: number;
}

export type JunctionId = string;

export interface JunctionQuery {
    status?: JunctionStatus;
    synthesisType?: JunctionSynthesisType;
    domain?: string;
    limit?: number;
}
