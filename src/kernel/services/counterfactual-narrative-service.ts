import type { DecisionExplanation } from '../contracts/counterfactual-explanation';
import type {
    ICounterfactualNarrativeService,
    NarrativeExplanation,
} from '../contracts/counterfactual-narrative';

const COMPONENT_LABELS: Record<string, string> = {
    raw: 'base score',
    stabilityBonus: 'stability index',
    reputationBonus: 'reputation score',
    explorationBonus: 'exploration weight',
    keyReputationBonus: 'key reputation weight',
    affinityBonus: 'affinity match',
    priorityBonus: 'priority assignment',
    costPenalty: 'cost pressure',
    latencyPenalty: 'latency degradation',
    budgetPenalty: 'budget constraint',
};

function label(component: string): string {
    return COMPONENT_LABELS[component] ?? component;
}

/** Sign: positive = helps, negative = hurts */
function direction(val: number): 'hurts' | 'helps' | 'neutral' {
    if (val > 0.01) return 'helps';
    if (val < -0.01) return 'hurts';
    return 'neutral';
}

function describeDelta(provider: string, component: string, delta: number): string {
    const dir = direction(delta);
    if (dir === 'neutral') return '';
    const lbl = label(component);
    const magnitude =
        Math.abs(delta) > 0.15
            ? 'significantly '
            : Math.abs(delta) > 0.05
              ? 'moderately '
              : 'slightly ';
    return `${provider} ${dir} by ${magnitude}(${lbl} ${delta > 0 ? '+' : ''}${delta.toFixed(3)})`;
}

function classifyMarginShift(margin: number): 'decisive' | 'moderate' | 'marginal' {
    const abs = Math.abs(margin);
    if (abs > 0.15) return 'decisive';
    if (abs > 0.05) return 'moderate';
    return 'marginal';
}

export class CounterfactualNarrativeService implements ICounterfactualNarrativeService {
    generate(explanation: DecisionExplanation): NarrativeExplanation {
        if (!explanation.switched) {
            return {
                summary: `${explanation.originalWinner} retained selection — no provider change.`,
                confidence: 0,
                causalChain: ['No switch occurred'],
                primaryFactor: 'none',
                stable: true,
            };
        }

        const { originalWinner, simulatedWinner, decisiveComponents, marginShift } = explanation;

        // Primary trigger: top decisive component
        const primary = decisiveComponents[0];
        const primaryLabel = primary
            ? `${label(primary.component)} (${primary.provider})`
            : 'unknown';

        // Causal chain: ordered from most impactful
        const chain: string[] = [];
        if (primary) {
            const desc = describeDelta(primary.provider, primary.component, primary.contribution);
            if (desc) chain.push(`Primary cause: ${desc}`);
        }

        // Amplifier: find the opposite-side contributor (helps the new winner)
        const helpingSimWinner = decisiveComponents
            .filter((d) => d.provider === simulatedWinner && d.contribution > 0)
            .sort((a, b) => b.contribution - a.contribution);

        if (helpingSimWinner.length > 0) {
            const amp = helpingSimWinner[0]!;
            chain.push(
                `Amplifier: ${simulatedWinner} gained (${label(amp.component)} +${amp.contribution.toFixed(3)})`,
            );
        }

        // Hurting original winner
        const hurtingOriginal = decisiveComponents
            .filter((d) => d.provider === originalWinner && d.contribution < 0)
            .sort((a, b) => a.contribution - b.contribution);

        if (hurtingOriginal.length > 0) {
            const hurt = hurtingOriginal[0]!;
            chain.push(
                `Downside: ${originalWinner} weakened (${label(hurt.component)} ${hurt.contribution.toFixed(3)})`,
            );
        }

        // Margin interpretation
        const marginLabel = classifyMarginShift(marginShift);
        chain.push(
            `Margin shift ${marginShift > 0 ? '+' : ''}${marginShift.toFixed(3)} — ${marginLabel} change`,
        );

        // Summary sentence
        const primaryProvider = primary?.provider ?? originalWinner;
        const primaryComponent = primary ? label(primary.component) : 'score';
        const summary =
            marginLabel === 'decisive'
                ? `${originalWinner} → ${simulatedWinner}: ${primaryComponent} in ${primaryProvider} triggered a decisive switch (margin ${marginShift > 0 ? '+' : ''}${marginShift.toFixed(3)}).`
                : marginLabel === 'moderate'
                  ? `${originalWinner} → ${simulatedWinner}: ${primaryComponent} shift caused a moderate realignment (margin ${marginShift > 0 ? '+' : ''}${marginShift.toFixed(3)}).`
                  : `${originalWinner} → ${simulatedWinner}: marginal change — near-tie condition.`;

        // Confidence: based on how clear the signal is
        const marginAbs = Math.abs(marginShift);
        const confidence =
            marginAbs > 0.2 ? 0.9 : marginAbs > 0.1 ? 0.7 : marginAbs > 0.03 ? 0.5 : 0.3;

        return {
            summary,
            confidence,
            causalChain: chain,
            primaryFactor: primaryLabel,
            stable: marginAbs > 0.02,
        };
    }
}
