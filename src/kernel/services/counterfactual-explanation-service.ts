import type { DecisionPayload, ScoringComponents } from '../events/system-events';
import type {
  ICounterfactualExplanationService,
  DecisionExplanation,
  ProviderExplanation,
  ScoreComponentDelta,
  DecisiveComponent,
} from '../contracts/counterfactual-explanation';

const COMPONENT_KEYS: (keyof ScoringComponents)[] = [
  'raw',
  'stabilityBonus',
  'reputationBonus',
  'explorationBonus',
  'keyReputationBonus',
  'affinityBonus',
  'priorityBonus',
  'costPenalty',
  'latencyPenalty',
  'budgetPenalty',
];

/** Parse abbreviated DecisionPayload scores back to usable form */
function parseScore(entry: { p: string; s: string; c?: ScoringComponents }) {
  return {
    provider: entry.p,
    score: parseFloat(entry.s),
    components: entry.c ?? null,
  };
}

function computeComponentDiffs(
  origComponents: ScoringComponents | null,
  simComponents: ScoringComponents | null,
): ScoreComponentDelta[] {
  if (!origComponents) return [];
  if (!simComponents) return COMPONENT_KEYS.map(c => ({
    component: c,
    original: origComponents[c],
    simulated: 0,
    delta: -origComponents[c],
  }));
  return COMPONENT_KEYS.map(c => ({
    component: c,
    original: origComponents[c],
    simulated: simComponents[c],
    delta: simComponents[c] - origComponents[c],
  }));
}

function buildProviderExplanation(
  provider: string,
  origEntry: { score: number; components: ScoringComponents | null } | undefined,
  simEntry: { score: number; components: ScoringComponents | null } | undefined,
): ProviderExplanation {
  const totalOriginal = origEntry?.score ?? 0;
  const totalSimulated = simEntry?.score ?? 0;
  const componentDiffs = computeComponentDiffs(
    origEntry?.components ?? null,
    simEntry?.components ?? null,
  );
  return { provider, totalOriginal, totalSimulated, componentDiffs };
}

export class CounterfactualExplanationService implements ICounterfactualExplanationService {
  explain(original: DecisionPayload, simulated: DecisionPayload): DecisionExplanation {
    const origWinners = original.scores.map(parseScore);
    const simWinners = simulated.scores.map(parseScore);

    const origMap = new Map(origWinners.map(s => [s.provider, s]));
    const simMap = new Map(simWinners.map(s => [s.provider, s]));

    const allProviders = new Set([...origMap.keys(), ...simMap.keys()]);

    const providerExplanations: ProviderExplanation[] = [];
    for (const provider of allProviders) {
      providerExplanations.push(buildProviderExplanation(
        provider,
        origMap.get(provider),
        simMap.get(provider),
      ));
    }

    // Sort by impact magnitude (largest abs delta first)
    providerExplanations.sort((a, b) => {
      const aDelta = Math.abs(a.totalSimulated - a.totalOriginal);
      const bDelta = Math.abs(b.totalSimulated - b.totalOriginal);
      return bDelta - aDelta;
    });

    const originalWinner = original.selected;
    const simulatedWinner = simulated.selected;
    const switched = originalWinner !== simulatedWinner;

    // Decisive components — top-3 by abs delta across all providers
    const allDiffs: { provider: string; component: keyof ScoringComponents; delta: number }[] = [];
    for (const pe of providerExplanations) {
      for (const cd of pe.componentDiffs) {
        allDiffs.push({ provider: pe.provider, component: cd.component, delta: cd.delta });
      }
    }
    allDiffs.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const decisiveComponents: DecisiveComponent[] = allDiffs.slice(0, 3).map(d => ({
      provider: d.provider,
      component: d.component,
      contribution: d.delta,
    }));

    // Margin shift: difference between original winner's winning margin and simulated
    const origWinnerScore = origMap.get(originalWinner)?.score ?? 0;
    const origRunnerUp = Math.max(...origWinners.filter(s => s.provider !== originalWinner).map(s => s.score), 0);
    const origMargin = origWinnerScore - origRunnerUp;

    const simWinnerScore = simMap.get(simulatedWinner)?.score ?? 0;
    const simRunnerUp = Math.max(...simWinners.filter(s => s.provider !== simulatedWinner).map(s => s.score), 0);
    const simMargin = simWinnerScore - simRunnerUp;

    const marginShift = switched ? simMargin - origMargin : 0;

    return {
      originalWinner,
      simulatedWinner,
      switched,
      providerExplanations,
      decisiveComponents,
      marginShift,
    };
  }
}
