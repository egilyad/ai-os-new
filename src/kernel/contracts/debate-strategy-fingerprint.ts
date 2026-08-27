import type { DebateArgument } from './debate-types';

export interface InferredStrategy {
    name: string;
    confidence: number;
    observedRounds: number[];
    traits: string[];
    counterTactic: string;
}

export interface IStrategyFingerprintService {
    analyzeOpponent(
        opponentId: string,
        opponentName: string,
        previousArguments: DebateArgument[],
        allParticipants: Array<{ id: string; name: string; role: string }>,
    ): Map<string, InferredStrategy>;

    getFingerprintPrompt(
        myId: string,
        inferences: Map<string, InferredStrategy>,
        language: string,
    ): string | undefined;

    reset(): void;
}
