import type {
    ICrossExaminationService,
    CrossExaminationTarget,
} from '../../contracts/debate-cross-examination';

/**
 * CrossExaminationService — P0
 * Selects the most vulnerable opponent claim for questioning.
 * Heuristic: shortest + low evidence markers (no numbers, citations) + recent.
 */
export class CrossExaminationService implements ICrossExaminationService {
    selectTarget(
        agentId: string,
        previousArguments: Array<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
    ): CrossExaminationTarget | null {
        const opponentArgs = previousArguments.filter((a) => a.agentId !== agentId);
        if (opponentArgs.length === 0) return null;

        const maxRound = Math.max(...opponentArgs.map((a) => a.round));

        const scored = opponentArgs.map((a) => {
            const recency = a.round / Math.max(1, maxRound);
            const hasEvidence = /\d|https?:|source|study|research|according to/i.test(a.content);
            const evidencePenalty = hasEvidence ? 0 : 0.35; // weaker if no evidence
            const brevity = a.content.length < 80 ? 0.25 : a.content.length < 200 ? 0.15 : 0;
            const vague = /always|never|everyone|nobody|all|none/i.test(a.content) ? 0.15 : 0;
            const weakness = evidencePenalty + brevity + vague + recency * 0.15;
            return { arg: a, score: weakness };
        });

        scored.sort((a, b) => b.score - a.score);
        const best = scored[0]!;

        return {
            claimId: best.arg.id,
            claimText: best.arg.content.slice(0, 400),
            opponentId: best.arg.agentId,
            opponentName: best.arg.agentName,
            round: best.arg.round,
            weaknessScore: Math.min(1, best.score),
        };
    }
}
