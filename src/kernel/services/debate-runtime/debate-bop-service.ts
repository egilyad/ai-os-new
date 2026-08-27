import type { IBoPTrackerService, BurdenEntry, UnmetBurden } from '../../contracts/debate-bop';

/**
 * BoPTrackerService — P0.10
 *
 * Tracks burden of proof for claims: every new claim automatically assigns
 * burden to its author. Tracks whether burden has been met (evidence provided),
 * remains unmet, or has been explicitly shifted.
 *
 * Complexity: 3/5 — lightweight in-memory tracker, no LLM calls.
 */
export class BoPTrackerService implements IBoPTrackerService {
    private entries = new Map<string, BurdenEntry>();
    private burdenAgents = new Map<string, Set<string>>();

    recordClaim(
        claimId: string,
        agentId: string,
        agentName: string,
        claimText: string,
        round: number,
    ): void {
        this.entries.set(claimId, {
            claimId,
            agentId,
            agentName,
            claimText: claimText.slice(0, 400),
            round,
            status: 'assigned',
        });

        if (!this.burdenAgents.has(agentId)) {
            this.burdenAgents.set(agentId, new Set());
        }
        this.burdenAgents.get(agentId)!.add(claimId);
    }

    meetBurden(claimId: string): void {
        const entry = this.entries.get(claimId);
        if (entry && entry.status === 'assigned') {
            this.entries.set(claimId, { ...entry, status: 'met' });
        }
    }

    getUnmetForAgent(agentId: string): UnmetBurden[] {
        const agentClaimIds = this.burdenAgents.get(agentId);
        if (!agentClaimIds || agentClaimIds.size === 0) return [];

        const result: UnmetBurden[] = [];
        for (const claimId of agentClaimIds) {
            const entry = this.entries.get(claimId);
            if (entry && (entry.status === 'assigned' || entry.status === 'unmet')) {
                result.push({
                    claimId: entry.claimId,
                    agentName: entry.agentName,
                    claimText: entry.claimText,
                    round: entry.round,
                });
            }
        }
        return result;
    }

    getMetRatio(agentId: string): number {
        const agentClaimIds = this.burdenAgents.get(agentId);
        if (!agentClaimIds || agentClaimIds.size === 0) return 1; // no claims = ratio 1 (no penalty)

        let met = 0;
        let total = 0;
        for (const claimId of agentClaimIds) {
            const entry = this.entries.get(claimId);
            if (entry) {
                total++;
                if (entry.status === 'met') met++;
            }
        }
        return total > 0 ? met / total : 1;
    }

    reset(): void {
        this.entries.clear();
        this.burdenAgents.clear();
    }
}
