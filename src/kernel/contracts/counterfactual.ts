import type { DecisionPayload } from '../events/system-events';
import type { CausalTraceEntry } from './causal-debugger';

export interface CounterfactualOverride {
  /** Per-provider overrides keyed by provider ID */
  keys?: Record<string, {
    rateLimited?: boolean;
    latency?: number;
    quotaUsed?: number;
    health?: 'healthy' | 'degraded' | 'broken';
  }>;
  /** Global overrides */
  global?: {
    strategy?: string;
    budgetPressure?: number;
    providerHealth?: Record<string, 'healthy' | 'degraded' | 'offline'>;
  };
}

export interface CounterfactualInput {
  /** Source causal trace entry to replay from */
  baseTrace: CausalTraceEntry;
  /** What to override relative to the before snapshot */
  overrides: CounterfactualOverride;
  /** Prompt text to re-score with (defaults to empty, uses scoring-only path) */
  prompt?: string;
}

export interface CounterfactualScoreDiff {
  provider: string;
  originalScore: number;
  simulatedScore: number;
  delta: number;
  components?: {
    original: Record<string, number>;
    simulated: Record<string, number>;
  };
}

export interface CounterfactualResult {
  requestId: string;
  original: DecisionPayload;
  simulated: DecisionPayload;
  scoreDiffs: CounterfactualScoreDiff[];
  /** True if the selected provider changed */
  switchProvider: boolean;
  /** If switched, reason summary */
  switchReason?: string;
  /** Engine execution metadata */
  meta: {
    durationMs: number;
    overridesApplied: CounterfactualOverride;
  };
}

export interface ICounterfactualEngine {
  run(input: CounterfactualInput): CounterfactualResult;
}
