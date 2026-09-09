import type { DecisionPayload, ScoringComponents } from '../events/system-events';

/** Delta for a single scoring component between original and simulated */
export interface ScoreComponentDelta {
  component: keyof ScoringComponents;
  original: number;
  simulated: number;
  delta: number;
}

/** Per-provider breakdown of score changes */
export interface ProviderExplanation {
  provider: string;
  totalOriginal: number;
  totalSimulated: number;
  componentDiffs: ScoreComponentDelta[];
}

/** Which components were decisive in a switch decision */
export interface DecisiveComponent {
  provider: string;
  component: keyof ScoringComponents;
  contribution: number;
}

/** Top-level explanation of a counterfactual run */
export interface DecisionExplanation {
  originalWinner: string;
  simulatedWinner: string;
  switched: boolean;
  providerExplanations: ProviderExplanation[];
  decisiveComponents: DecisiveComponent[];
  marginShift: number;
}

export interface ICounterfactualExplanationService {
  explain(
    original: DecisionPayload,
    simulated: DecisionPayload,
  ): DecisionExplanation;
}
