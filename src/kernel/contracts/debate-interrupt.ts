// ── Micro-Interrupt Queue (P1.17) ─────────────────────────────────────────
// Allows participants to request micro-turns (1-2 sentences) for
// clarification without consuming a full turn. Max N per round.
// Makes debate dialogue more natural and responsive.

export type InterruptStatus = 'requested' | 'approved' | 'completed' | 'expired';

export interface InterruptRequest {
    id: string;
    fromAgentId: string;
    toAgentId: string;
    question: string;
    status: InterruptStatus;
    round: number;
    response?: string;
}

export interface IInterruptQueue {
    requestInterrupt(
        fromAgentId: string,
        toAgentId: string,
        question: string,
        round: number,
    ): InterruptRequest | null; // null if max interrupts reached

    approveNext(agentId: string, round: number): InterruptRequest | null;

    recordResponse(requestId: string, response: string): void;

    getPendingForAgent(agentId: string, round: number): InterruptRequest[];

    getFormattedInterrupts(agentId: string, round: number, language?: string): string;

    clearSession(): void;
}
