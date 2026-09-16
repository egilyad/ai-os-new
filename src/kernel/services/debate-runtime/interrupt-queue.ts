// ── InterruptQueue (P1.17) ──────────────────────────────────────────────────
// Manages micro-interrupt requests between participants.
// Allows short clarification questions without consuming a full turn.

import type { IInterruptQueue, InterruptRequest } from '../../contracts/debate-interrupt';

const MAX_INTERRUPTS_PER_ROUND = 3;
const MAX_QUESTION_LENGTH = 300;

let nextId = 0;
function genId(): string {
    return `int-${Date.now()}-${++nextId}`;
}

export class InterruptQueue implements IInterruptQueue {
    private requests: InterruptRequest[] = [];
    /** Tracks how many interrupts each agent has used per round: `${agentId}:${round}` */
    private usageCount = new Map<string, number>();

    requestInterrupt(
        fromAgentId: string,
        toAgentId: string,
        question: string,
        round: number,
    ): InterruptRequest | null {
        const key = `${fromAgentId}:${round}`;
        const count = this.usageCount.get(key) || 0;
        if (count >= MAX_INTERRUPTS_PER_ROUND) return null;

        const truncated = question.slice(0, MAX_QUESTION_LENGTH);
        const request: InterruptRequest = {
            id: genId(),
            fromAgentId,
            toAgentId,
            question: truncated,
            status: 'requested',
            round,
        };

        this.requests.push(request);
        this.usageCount.set(key, count + 1);
        return request;
    }

    approveNext(agentId: string, round: number): InterruptRequest | null {
        const idx = this.requests.findIndex(
            (r) => r.toAgentId === agentId && r.round === round && r.status === 'requested',
        );
        if (idx === -1) return null;

        this.requests[idx]!.status = 'approved';
        return this.requests[idx]!;
    }

    recordResponse(requestId: string, response: string): void {
        const req = this.requests.find((r) => r.id === requestId);
        if (req) {
            req.response = response.slice(0, 200);
            req.status = 'completed';
        }
    }

    getPendingForAgent(agentId: string, round: number): InterruptRequest[] {
        return this.requests.filter(
            (r) => r.toAgentId === agentId && r.round === round && r.status === 'requested',
        );
    }

    getFormattedInterrupts(agentId: string, round: number, language = 'Russian'): string {
        const pending = this.getPendingForAgent(agentId, round);
        if (pending.length === 0) return '';

        const lines = pending.map(
            (r) => `- "${r.question.slice(0, 120)}" (from ${r.fromAgentId.slice(0, 12)}...)`,
        );

        if (language === 'Russian') {
            return (
                '\n\n### Clarification Requests (Answer Briefly)\n' +
                'The following participants asked for a quick clarification. Answer in 1-2 sentences:\n' +
                lines.join('\n')
            );
        }

        return (
            '\n\n### Clarification Requests (Answer Briefly)\n' +
            'The following participants asked for a quick clarification. Answer in 1-2 sentences:\n' +
            lines.join('\n')
        );
    }

    clearSession(): void {
        this.requests = [];
        this.usageCount.clear();
    }
}
