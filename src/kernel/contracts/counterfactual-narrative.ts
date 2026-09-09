import type { DecisionExplanation } from './counterfactual-explanation';

/** Human-readable narrative explaining a counterfactual decision change */
export interface NarrativeExplanation {
  summary: string;
  confidence: number;
  causalChain: string[];
  /** Human-readable label for the primary trigger factor */
  primaryFactor: string;
  /** Whether the simulation is stable (change was material) */
  stable: boolean;
}

export interface ICounterfactualNarrativeService {
  generate(explanation: DecisionExplanation): NarrativeExplanation;
}
