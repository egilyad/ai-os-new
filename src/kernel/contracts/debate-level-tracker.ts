// ── Abstraction Ladder Switcher (P2.20) ───────────────────────────────
// Hayakawa ladder: detects current abstraction level (concrete ↔ abstract)
// and forces a switch with justification. Prevents getting stuck at one level.

export type AbstractionLevel = 'concrete' | 'moderate' | 'abstract';

export interface LevelAnalysis {
    readonly currentLevel: AbstractionLevel;
    readonly recommendedLevel: AbstractionLevel;
    readonly instruction: string;
}

export interface ILevelTracker {
    analyze(agentId: string, recentClaims: string[], round: number): LevelAnalysis;
}
