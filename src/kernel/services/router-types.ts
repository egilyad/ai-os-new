import type { RouterWeights, SystemState, ScoringComponents } from '../types/metrics-types';
export type { ScoringComponents } from '../types/metrics-types';
import type { ScoringConfig } from '../types/routing-types';

export type RequestIntent = 'code' | 'creative' | 'factual' | 'math' | 'analysis' | 'general';
export type RequestLanguage = 'en' | 'ru' | 'other';

export type RoutingStrategy =
  | 'broadcast'
  | 'performance'
  | 'reliability'
  | 'latency'
  | 'auto'
  | 'race'
  | 'cost'
  | 'free_first'
  | 'content';

export interface SkippedKeyEntry {
  provider: string;
  keyLabel: string;
  keyId?: string;
  reason: string;
  stage:
    | 'status'
    | 'policy'
    | 'quota'
    | 'score'
    | 'budget'
    | 'unavailable'
    | 'circuit'
    | 'ratelimit'
    | 'backoff'
    | 'normalization'
    | 'exclusion';
}

export type DecisionOrigin = 'live' | 'simulation' | 'replay';

export interface PipelineStep {
  name: string;
  status: 'passed' | 'blocked' | 'retried' | 'cached' | 'fallback';
  provider?: string;
  detail?: string;
  durationMs?: number;
}

export interface RequestClassification {
  complexity: 'simple' | 'medium' | 'complex';
  isCode: boolean;
  isLong: boolean;
  isMultimodal: boolean;
  intent: RequestIntent;
  language: RequestLanguage;
}

export interface RouterDecision {
  requestId: string;
  strategy: RoutingStrategy;
  classification: RequestClassification;
  weights: RouterWeights;
  selected: string;
  secondBest: string | null;
  scores: { provider: string; score: number; components: ScoringComponents }[];
  skipped: SkippedKeyEntry[];
  steps: PipelineStep[];
  timestamp: number;
  promptLength: number;
  estimatedCost?: number;
  origin: DecisionOrigin;
}

export interface ScoreProviderInput {
  providerId: string;
  state: SystemState;
  weights: RouterWeights;
  scoring: ScoringConfig;
}
