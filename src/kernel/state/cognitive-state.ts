
export interface CognitiveMetricsState {
  readonly debateQuality: number;
  readonly avgContradictionDensity: number;
  readonly avgConsensusConfidence: number;
  readonly reasoningCollapseDetected: boolean;
  readonly hallucinationZoneCount: number;
  readonly sessionCount: number;
  readonly updatedAt: number;
}

export interface CognitivePressureState {
  readonly level: string;
  readonly score: number;
  readonly activeReasoningChains: number;
  readonly contentionScore: number;
  readonly complexityScore: number;
  readonly timestamp: number;
}

export interface CognitiveStateSnapshot {
  readonly metrics: CognitiveMetricsState;
  readonly pressure: CognitivePressureState;
  readonly activeIssues: number;
  readonly updatedAt: number;
}
