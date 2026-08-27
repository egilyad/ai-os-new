// ── Outcome Forecaster (P1.30) ──────────────────────────────────────────
// Predicts judge score impact for argument variants, selects
// max-expected-value option.

export interface ArgumentVariant {
    readonly variantId: string;
    readonly label: string;
    readonly angle: string;
    readonly expectedScore: number;
    readonly confidence: number;
    readonly riskFactor: number;
}

export interface ForecastResult {
    readonly variants: ArgumentVariant[];
    readonly recommendedLabel: string;
    readonly recommendedAngle: string;
    readonly expectedScoreGain: number;
}

export interface IOutcomeForecaster {
    forecast(
        previousScores: number[],
        agentRole: string,
        opponentStrengths: string[],
        topic: string,
        language?: string,
    ): ForecastResult;
}
