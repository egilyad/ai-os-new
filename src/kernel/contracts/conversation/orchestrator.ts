import type { TurnProposal } from './turn';

export interface IConversationOrchestrator {
    // Жизненный цикл сессии
    abortSession(sessionId: string): void;
    clearAbort(sessionId: string): void;
    clearAbortAll(): void;
    isAborted(sessionId: string): boolean;
    getAbortSignal(sessionId: string): AbortSignal;
    pause(): void;
    resume(): void;

    // Управление потоком
    processNextStep(sessionId: string): Promise<void>;
    overrideTurn(proposal: TurnProposal): void;
    skipNext(): void;
}
