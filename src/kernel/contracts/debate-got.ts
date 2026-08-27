// ── Graph-of-Thoughts Deliberation (P1.28) ──────────────────────────────
// Agent generates 3 reasoning branches internally, then synthesizes
// the strongest into a public argument.

export type GoTBranchType =
    'deductive' | 'inductive' | 'abductive' | 'analogical' | 'consequentialist';

export interface GoTBranch {
    readonly type: GoTBranchType;
    readonly premise: string;
    readonly reasoning: string;
    readonly conclusion: string;
    readonly confidence: number;
    readonly novelty: number;
}

export interface GoTResult {
    readonly branches: GoTBranch[];
    readonly selectedType: GoTBranchType;
    readonly synthesis: string;
    readonly diversityScore: number;
}

export interface IGoTDeliberation {
    deliberate(
        topic: string,
        perspective: string,
        opposingClaims: string[],
    ): Promise<GoTResult | null>;
}
