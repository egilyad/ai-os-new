import type { ITurnPolicy, PolicyState } from '../../contracts/conversation/policy';
import type { TurnProposal } from '../../contracts/conversation/turn';
import type { ConversationContext } from '../../contracts/conversation/context';
import type { DebatePolicyState } from './debate-policy-state';
import type { DebateTopology, TopologyNode } from '../../contracts/debate-runtime';
import { DebateTopologyService } from './debate-topology';

/**
 * DebatePolicy — Debate-specific decision logic, ported 1:1 from the old
 * DebateOrchestrator generator's speaking-order algorithm so the new Core and
 * the old runtime make equivalent CONTROL-STRUCTURE decisions on the same
 * deterministic input.
 *
 * Equivalence scope (proven by debate-shadow-equivalence.test.ts):
 *   agent chosen | TurnProposal.participantId
 *   round order  | DebatePolicyState.roundIndex (+1)
 *   termination  | proposeNextTurn() === null
 *
 * Deliberately NOT in Core: round:* / consensus / budget semantics. Those stay
 * here as Debate-specific state (per Migration Map).
 *
 * LLM text is never compared — only participant/order/round/termination.
 */
export class DebatePolicy implements ITurnPolicy {
    private state: DebatePolicyState = {
        bidScores: new Map(),
        participationCount: new Map(),
        lastInteraction: new Map(),
        lastArgRole: undefined,
        roundIndex: 0,
        nodeIndex: 0,
        orderedRound: null,
    };

    constructor(private topologyService: DebateTopologyService) {}

    /** 1-based current round, for shadow-equivalence inspection. */
    get roundNumber(): number {
        return this.state.roundIndex + 1;
    }

    async proposeNextTurn(
        context: ConversationContext,
        _state?: PolicyState,
    ): Promise<TurnProposal | null> {
        const topology = context.metadata.topology as DebateTopology | undefined;
        if (!topology) return null;

        const rounds = this.topologyService.buildRounds(topology);
        if (this.state.roundIndex >= rounds.length) return null;

        // Lazily (re)build the ordered node list for the current round.
        if (
            !this.state.orderedRound ||
            this.state.orderedRound.topologyRef !== topology ||
            this.state.orderedRound.roundIndex !== this.state.roundIndex
        ) {
            const roundNum = this.state.roundIndex + 1;
            const nodes = rounds[this.state.roundIndex]!;
            this.state.orderedRound = {
                topologyRef: topology,
                roundIndex: this.state.roundIndex,
                nodes: this.adaptiveOrder(nodes, roundNum),
            };
            this.state.nodeIndex = 0;
            // Precompute bids for the whole round (mirrors old generator precompute).
            for (const n of nodes) {
                this.state.bidScores.set(
                    n.id,
                    this.computeBid(n.id, n.label, this.state.lastArgRole, '', roundNum),
                );
            }
        }

        // Round exhausted → advance and retry (returns next round's first turn or null).
        if (this.state.nodeIndex >= this.state.orderedRound.nodes.length) {
            this.state.roundIndex++;
            this.state.orderedRound = null;
            return this.proposeNextTurn(context);
        }

        const candidate = this.state.orderedRound.nodes[this.state.nodeIndex]!;
        this.state.nodeIndex++;

        return {
            participantId: candidate.id,
            objective: {
                type: 'RESPOND',
                description: `Ответ агента ${candidate.id} в раунде ${this.state.roundIndex + 1}`,
                constraints: ['Придерживаться роли', 'Соблюдать правила дебатов'],
            },
        };
    }

    /**
     * Signal that a proposed turn was executed. Mirrors the old generator's
     * post-response bookkeeping: participation increment, last-arg tracking,
     * and within-round bid re-sort (for round >= 2).
     */
    updateStateAfterTurn(participantId: string, success: boolean): void {
        if (success) {
            this.state.participationCount.set(
                participantId,
                (this.state.participationCount.get(participantId) ?? 0) + 1,
            );
            this.state.lastArgRole = participantId;
            this.state.lastInteraction.set(participantId, participantId);
        }

        const roundNum = this.state.roundIndex + 1;
        if (this.state.orderedRound && roundNum >= 2) {
            const head = this.state.orderedRound.nodes.slice(0, this.state.nodeIndex);
            const tail = this.state.orderedRound.nodes.slice(this.state.nodeIndex);
            tail.sort((a, b) => {
                const scoreA = this.state.bidScores.get(a.id) ?? 0;
                const scoreB = this.state.bidScores.get(b.id) ?? 0;
                if (scoreA !== scoreB) return scoreB - scoreA;
                return a.id.localeCompare(b.id);
            });
            this.state.orderedRound.nodes = [...head, ...tail];
            // Refresh bids for the re-sorted tail against updated participation.
            for (const n of tail) {
                this.state.bidScores.set(
                    n.id,
                    this.computeBid(n.id, n.label, this.state.lastArgRole, '', roundNum),
                );
            }
        }
    }

    /** Resume support: jump the policy to a specific round (0-based). */
    setRound(roundIndex: number): void {
        this.state.roundIndex = roundIndex;
        this.state.nodeIndex = 0;
        this.state.orderedRound = null;
    }

    private adaptiveOrder(nodes: TopologyNode[], roundNum: number): TopologyNode[] {
        return [...nodes].sort((a, b) => {
            const countA = this.state.participationCount.get(a.id) ?? 0;
            const countB = this.state.participationCount.get(b.id) ?? 0;
            if (roundNum <= 3) {
                if (countA !== countB) return countA - countB;
            } else {
                const interactionDiff =
                    (this.state.lastInteraction.get(b.id) ? 1 : 0) -
                    (this.state.lastInteraction.get(a.id) ? 1 : 0);
                if (interactionDiff !== 0) return interactionDiff;
                if (countA !== countB) return countA - countB;
            }
            return a.id.localeCompare(b.id);
        });
    }

    private computeBid(
        agentId: string,
        role: string | undefined,
        lastArgRole: string | undefined,
        _lastArgContent: string,
        roundNum: number,
    ): number {
        let score = 0.5;
        if (role && lastArgRole && role !== lastArgRole) score += 0.3;
        else if (role && lastArgRole && role === lastArgRole) score += 0.1;

        const count = this.state.participationCount.get(agentId) ?? 0;
        score += Math.max(0, 0.2 - count * 0.05);

        const jitter =
            ((agentId.charCodeAt(0) * 7 +
                agentId.charCodeAt(agentId.length - 1) * 13 +
                roundNum * 3) %
                100) /
            1000;
        score += jitter;

        return Math.min(1, Math.max(0, score));
    }
}
