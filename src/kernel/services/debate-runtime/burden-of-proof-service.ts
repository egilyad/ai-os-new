import type {
    IBurdenOfProofService,
    UnsupportedClaim,
} from '../../contracts/debate-burden-of-proof';

/**
 * BurdenOfProofService — P0
 * Flags opponent claims lacking evidence markers (numbers, URLs,
 * citations, "study", "research", etc.).
 */
export class BurdenOfProofService implements IBurdenOfProofService {
    private readonly evidencePattern =
        /\d|https?:\/\/|www\.|source|study|research|according to|citation|data|evidence|statistics|survey|report/i;

    isSupported(text: string): boolean {
        return this.evidencePattern.test(text);
    }

    getUnsupportedClaims(
        agentId: string,
        previousArguments: Array<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
    ): UnsupportedClaim[] {
        return previousArguments
            .filter((a) => a.agentId !== agentId)
            .filter((a) => !this.isSupported(a.content))
            .map((a) => ({
                claimId: a.id,
                claimText: a.content.slice(0, 350),
                agentId: a.agentId,
                agentName: a.agentName,
                round: a.round,
            }));
    }
}
