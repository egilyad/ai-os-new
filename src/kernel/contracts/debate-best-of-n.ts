// ── Best-of-N Selection (P2.4) ──────────────────────────────────────────
// Generates N argument variants with different temperature/persona,
// selects best by novelty + rebuttal strength.

export interface VariantScore {
    readonly variantIndex: number;
    readonly temperature: number;
    readonly content: string;
    readonly noveltyScore: number;
    readonly rebuttalStrength: number;
    readonly overallScore: number;
}

export interface BestOfNResult {
    readonly variants: VariantScore[];
    readonly selectedIndex: number;
    readonly selectedContent: string;
    readonly improvementRatio: number;
}

export type LlmCallFn = (prompt: string, temperature?: number) => Promise<string>;

export interface IBestOfNSelector {
    selectBest(generateVariant: LlmCallFn, basePrompt: string, n: number): Promise<BestOfNResult>;
}
