import type { IConcessionService, ConcessionOpportunity } from '../../contracts/debate-concession';

export class ConcessionService implements IConcessionService {
    findOpportunities(agentId: string, previousArguments: Array<{ id: string; agentId: string; content: string; round: number }>): ConcessionOpportunity[] {
        // Opponent's strongest claims (long, with evidence) are bad to concede; weakest are good concession opportunities (low cost)
        const opponentArgs = previousArguments.filter((a) => a.agentId !== agentId);
        return opponentArgs
            .filter((a) => a.content.length < 120 && !/\d/.test(a.content))
            .slice(0, 3)
            .map((a) => ({ claimId: a.id, claimText: a.content.slice(0, 150), opponentId: a.agentId, benefit: 0.6 }));
    }
}
