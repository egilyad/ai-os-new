import type { ISteelmanService, SteelmanTarget } from '../../contracts/debate-steelman';

/**
 * SteelmanService — P0.9
 *
 * Selects the opponent's claim most worth steelmanning before rebuttal.
 * Heuristic: prefers claims that are central (appear in recent rounds),
 * substantive (longer = more developed argument), and from opponents
 * the current agent hasn't yet engaged.
 *
 * Complexity: 2/5 — purely heuristic, no LLM calls.
 */
export class SteelmanService implements ISteelmanService {
    selectTarget(
        agentId: string,
        previousArguments: Array<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
    ): SteelmanTarget | null {
        // Need at least one opponent argument to steelman
        const opponentArgs = previousArguments.filter((a) => a.agentId !== agentId);
        if (opponentArgs.length === 0) return null;

        // Score each opponent argument: prefer recent rounds + substantive content
        // + high engagement potential (not too short, not too long)
        const maxRound = Math.max(...opponentArgs.map((a) => a.round));
        const scored = opponentArgs.map((a) => {
            const recency = a.round / Math.max(1, maxRound);
            const length = a.content.length;
            const substance = Math.min(1, Math.max(0, (length - 50) / 500)); // 50-550 char sweet spot
            const score = recency * 0.5 + substance * 0.5;
            return { arg: a, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const best = scored[0];

        return {
            opponentId: best!.arg.agentId,
            opponentName: best!.arg.agentName,
            claimText: best!.arg.content.slice(0, 400),
            claimId: best!.arg.id,
            round: best!.arg.round,
        };
    }
}
