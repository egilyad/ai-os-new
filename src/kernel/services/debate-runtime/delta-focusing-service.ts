import type { IDeltaFocusingService, DeltaPoint } from '../../contracts/debate-delta-focusing';

/**
 * DeltaFocusingService — P0
 * Finds disagreement points by lexical divergence from the current agent's
 * prior arguments. High divergence = likely disagreement.
 */
export class DeltaFocusingService implements IDeltaFocusingService {
    getDeltaPoints(
        agentId: string,
        previousArguments: Array<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
    ): DeltaPoint[] {
        const ownArgs = previousArguments.filter((a) => a.agentId === agentId);
        const opponentArgs = previousArguments.filter((a) => a.agentId !== agentId);
        if (opponentArgs.length === 0) return [];

        const ownTokens = new Set(
            ownArgs
                .flatMap((a) => this.tokenize(a.content))
                .map((t) => t.toLowerCase()),
        );

        const points: DeltaPoint[] = opponentArgs.map((arg) => {
            const tokens = this.tokenize(arg.content).map((t) => t.toLowerCase());
            const overlap = tokens.filter((t) => ownTokens.has(t)).length;
            const union = new Set([...tokens, ...ownTokens]).size;
            const jaccard = union === 0 ? 0 : overlap / union;
            // Low overlap => high divergence (disagreement)
            const divergence = 1 - jaccard;
            return {
                claimId: arg.id,
                claimText: arg.content.slice(0, 300),
                opponentId: arg.agentId,
                round: arg.round,
                divergenceScore: divergence,
            };
        });

        // Sort by divergence descending, filter weak divergences
        points.sort((a, b) => b.divergenceScore - a.divergenceScore);
        return points.filter((p) => p.divergenceScore > 0.45).slice(0, 5);
    }

    private tokenize(text: string): string[] {
        return text.split(/[^a-zA-Zа-яА-ЯёЁ0-9]+/).filter(Boolean);
    }
}
