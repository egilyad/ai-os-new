// ── Synthesis Engine (P1) ────────────────────────────────────────
// Combine best arguments from both sides into coherent whole.

export interface SynthesisResult {
    readonly thesisPoints: string[];
    readonly antithesisPoints: string[];
    readonly synthesis: string;
    readonly coherence: number;
}

export interface ISynthesisService {
    synthesize(
        topic: string,
        proArguments: string[],
        conArguments: string[],
    ): SynthesisResult | null;
}
