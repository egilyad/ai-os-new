// ── Cognitive Bias Profiler (P1.18) ───────────────────────────────────────
// Detects cognitive biases in agent arguments and opponent statements.
// Provides exploit/mitigation prompts based on bias profile.
// Affects all debate modes — infrastructure service.

export type BiasType =
    | 'confirmation_bias'
    | 'anchoring'
    | 'dunning_kruger'
    | 'availability_heuristic'
    | 'false_dilemma'
    | 'slippery_slope'
    | 'strawman'
    | 'ad_hominem'
    | 'appeal_to_authority'
    | 'appeal_to_nature'
    | 'survivorship_bias'
    | 'hindsight_bias'
    | 'optimism_bias'
    | 'status_quo_bias'
    | 'bandwagon'
    | 'unknown';

export interface BiasScore {
    type: BiasType;
    score: number; // 0-1 how strongly present
    evidence: string; // excerpt from text
    isExploitable: boolean; // can opponent use this against the speaker
}

export interface BiasProfile {
    agentId: string;
    round: number;
    biases: BiasScore[];
    dominantBias: BiasType; // the strongest bias detected
    overallScore: number; // 0-1 aggregate bias intensity
}

export interface IBiasProfiler {
    analyzeArgument(agentId: string, round: number, content: string): BiasProfile;

    getProfile(agentId: string, round: number): BiasProfile | undefined;

    getExploitPrompt(opponentId: string, round: number, language?: string): string;

    getMitigationPrompt(agentId: string, round: number, language?: string): string;

    clearSession(): void;
}
