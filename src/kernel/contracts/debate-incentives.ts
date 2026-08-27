// ── Hidden Incentives Mining (P0.17) ───────────────────────────────────
// Analyzes who benefits from stated positions, forces disclosure
// of conflicts of interest.

export interface IncentiveProfile {
    readonly stakeholder: string;
    readonly stake: string;
    readonly direction: 'for' | 'against' | 'neutral';
    readonly estimatedValue: string;
    readonly credibilityImpact: number;
}

export interface IncentiveAnalysis {
    readonly agentId: string;
    readonly agentName: string;
    readonly profiles: IncentiveProfile[];
    readonly conflictOfInterest: boolean;
    readonly disclosurePrompt: string;
}

export interface IIncentiveDetector {
    analyze(
        agentId: string,
        agentName: string,
        content: string,
        topic: string,
    ): IncentiveAnalysis | null;
}
