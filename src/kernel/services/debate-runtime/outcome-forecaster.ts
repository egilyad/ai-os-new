import type {
    IOutcomeForecaster,
    ForecastResult,
    ArgumentVariant,
} from '../../contracts/debate-forecaster';

const ANGLES: Array<{ label: string; angle: string; riskBias: number }> = [
    {
        label: 'Empirical Overload',
        angle: 'Flood the argument with statistics, studies, and hard data points',
        riskBias: 0.3,
    },
    {
        label: 'Moral High Ground',
        angle: 'Frame the argument around ethics, fairness, and universal principles',
        riskBias: 0.5,
    },
    {
        label: 'Pragmatic Compromise',
        angle: "Propose a middle-ground solution that addresses both sides' core concerns",
        riskBias: 0.2,
    },
    {
        label: 'Bold Prediction',
        angle: 'Make a specific, falsifiable prediction about future outcomes',
        riskBias: 0.8,
    },
    {
        label: 'Historical Analogy',
        angle: 'Draw a detailed parallel to a well-known historical case with clear lessons',
        riskBias: 0.4,
    },
    {
        label: 'First Principles',
        angle: 'Deconstruct the issue to foundational axioms and rebuild from there',
        riskBias: 0.3,
    },
    {
        label: 'Emotional Narrative',
        angle: 'Tell a compelling human story that illustrates the stakes',
        riskBias: 0.6,
    },
    {
        label: 'Expert Citation',
        angle: 'Defer to authoritative sources and domain experts',
        riskBias: 0.3,
    },
];

export class OutcomeForecaster implements IOutcomeForecaster {
    forecast(
        previousScores: number[],
        _agentRole: string,
        opponentStrengths: string[],
        _topic: string,
        _language?: string,
    ): ForecastResult {
        const avgScore =
            previousScores.length > 0
                ? previousScores.reduce((a, b) => a + b, 0) / previousScores.length
                : 0.5;

        const trend =
            previousScores.length >= 3
                ? previousScores[previousScores.length - 1]! - previousScores[0]!
                : 0;

        const variants: ArgumentVariant[] = ANGLES.map((a, i) => {
            const baseScore = avgScore + trend * 0.2;
            const angleNovelty = this.computeNovelty(a.label, opponentStrengths);
            const expected = baseScore + angleNovelty * 0.15 - a.riskBias * 0.1;
            const confidence = 0.5 + angleNovelty * 0.3 - a.riskBias * 0.2;

            return {
                variantId: `variant-${i}`,
                label: a.label,
                angle: a.angle,
                expectedScore: Math.max(0, Math.min(1, expected)),
                confidence: Math.max(0.1, Math.min(0.95, confidence)),
                riskFactor: a.riskBias,
            };
        });

        variants.sort((a, b) => b.expectedScore - a.expectedScore);
        const best = variants[0];

        return {
            variants,
            recommendedLabel: best!.label,
            recommendedAngle: best!.angle,
            expectedScoreGain: Math.max(0, best!.expectedScore - avgScore),
        };
    }

    private computeNovelty(label: string, opponentStrengths: string[]): number {
        const overlap = opponentStrengths.filter(
            (s) =>
                s.toLowerCase().includes(label.toLowerCase()) ||
                label.toLowerCase().includes(s.toLowerCase()),
        ).length;
        return 1 - overlap / Math.max(1, opponentStrengths.length);
    }
}
