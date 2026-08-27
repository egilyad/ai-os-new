// ── Humility Scoring (P1) ────────────────────────────────────────
// Reward acknowledging uncertainty and limitations.
// Heuristic: detect humility markers vs overconfidence.

export interface HumilityScore {
    readonly text: string;
    readonly humility: number; // 0-1, higher = more humble
    readonly overconfidence: number; // 0-1
    readonly hasHedge: boolean;
}

export interface IHumilityScoringService {
    score(text: string): HumilityScore;
    isHumble(text: string): boolean;
}
