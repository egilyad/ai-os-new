export type ReasoningPattern =
  | 'deductive'
  | 'inductive'
  | 'analogical'
  | 'causal'
  | 'adversarial'
  | 'synthesis-heavy';

export interface ReasoningSignature {
  pattern: ReasoningPattern;
  confidence: number;
}

export interface AgentDiversityProfile {
  agentId: string;
  semanticDiversityScore: number;
  reasoningDiversityScore: number;
  influenceUniquenessScore: number;
  redundancyScore: number;
  overallScore: number;
  clusterId: string;
  reasoningSignature: ReasoningSignature;
  claimCount: number;
  lastUpdated: number;
}

export interface ClusterGroup {
  id: string;
  agentIds: string[];
  centroid: number[];
  members: AgentDiversityProfile[];
}

export interface DiversityState {
  profiles: Record<string, AgentDiversityProfile>;
  clusters: ClusterGroup[];
  globalDiversityIndex: number;
  redundantPairs: Array<{ agentA: string; agentB: string; similarity: number }>;
  lastUpdated: number;
}

export interface DiversityConfig {
  semanticWeight: number;
  reasoningWeight: number;
  influenceWeight: number;
  redundancyPenalty: number;
  redundancyThreshold: number;
  clusterSimilarityThreshold: number;
}
