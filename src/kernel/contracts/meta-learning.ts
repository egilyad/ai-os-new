export type LearningSignal =
    | 'routing_success'
    | 'routing_failure'
    | 'debate_outcome'
    | 'provider_latency'
    | 'provider_cost'
    | 'budget_breach'
    | 'user_feedback';

export interface LearningObservation {
    id: string;
    signal: LearningSignal;
    features: Record<string, number | string>;
    outcome: number; // 0-1 score
    timestamp: number;
    weight: number; // importance of this observation
}

export interface LearnedPattern {
    id: string;
    description: string;
    confidence: number; // 0-1
    impact: 'positive' | 'negative' | 'neutral';
    suggestedAction: string;
    affectedParam: string;
    affectedValue: number;
    observationCount: number;
    lastUpdated: number;
    timesApplied?: number;
}

export interface MetaLearningState {
    totalObservations: number;
    patternsFound: number;
    adjustmentsApplied: number;
    learningRate: number;
    explorationRate: number;
    recentPatterns: LearnedPattern[];
    accuracy: number; // how well predictions match outcomes
}

export interface IMetaLearningService {
    getState(): MetaLearningState;
    recordObservation(
        signal: LearningSignal,
        features: Record<string, number | string>,
        outcome: number,
    ): void;
    getSuggestions(): LearnedPattern[];
    applySuggestion(patternId: string): Promise<void>;
    setLearningRate(rate: number): void;
    setExplorationRate(rate: number): void;
}
