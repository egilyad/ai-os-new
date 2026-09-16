import type { MinimaxMove, IMinimaxPlanner } from '../../contracts/debate-minimax';
import type { IArgumentGraphService } from '../../contracts/debate-argument-graph';

const CENTRALITY_WEIGHT = 0.4;
const SUPPORT_RATIO_WEIGHT = 0.3;

/**
 * P0.7 Argumentation Graph Minimax.
 *
 * Strategic move planning: evaluates candidate attack/defense actions
 * using 2-ply minimax on the argument graph. Recommends the move with
 * the best worst-case outcome.
 *
 * No LLM calls — purely heuristic graph analysis.
 */
export class MinimaxPlanner implements IMinimaxPlanner {
    private graph: IArgumentGraphService;

    constructor(graph: IArgumentGraphService) {
        this.graph = graph;
    }

    plan(agentId: string, _agentName: string, currentRound: number): MinimaxMove | null {
        if (!this.graph.initialized || this.graph.getAllNodes().length < 3) {
            return null;
        }

        const candidates = this._generateCandidates(agentId, currentRound);
        if (candidates.length === 0) return null;

        // 2-ply minimax: for each candidate, compute opponent's best response
        let bestMove: MinimaxMove | null = null;
        let bestMinimaxValue = -Infinity;

        for (const candidate of candidates) {
            const ourValue = this._evaluateMove(candidate, agentId);
            const opponentResponse = this._simulateOpponentResponse(
                candidate,
                agentId,
                currentRound,
            );
            // Minimax: we maximize our minimum gain
            const minimaxValue = opponentResponse
                ? ourValue - opponentResponse.score * 0.5
                : ourValue;

            if (minimaxValue > bestMinimaxValue) {
                bestMinimaxValue = minimaxValue;
                bestMove = candidate;
            }
        }

        return bestMove;
    }

    // ── Candidate generation ──

    private _generateCandidates(agentId: string, currentRound: number): MinimaxMove[] {
        const candidates: MinimaxMove[] = [];
        const allNodes = this.graph.getAllNodes();
        const ownNodes = allNodes.filter((n) => n.agentId === agentId);
        const opponentNodes = allNodes.filter((n) => n.agentId !== agentId);

        // 1. Attack high-centrality opponent nodes
        const centralOpponents = [...opponentNodes]
            .map((n) => ({
                node: n,
                centrality: this.graph.getCentrality(n.id),
                balance: this.graph.getEdgeBalance(n.id),
            }))
            .filter(
                (c) =>
                    c.centrality > 0.3 &&
                    c.balance.attack < c.balance.support &&
                    currentRound - c.node.round < 3,
            )
            .sort((a, b) => b.centrality - a.centrality)
            .slice(0, 3);

        for (const c of centralOpponents) {
            const expectedDamage = c.centrality * (1 - c.balance.ratio);
            candidates.push({
                type: 'attack_high_centrality',
                targetNodeId: c.node.id,
                targetClaim: c.node.content.slice(0, 150),
                score: expectedDamage,
                rationale: `This claim has high centrality (${c.centrality.toFixed(2)}) in the argument graph. Attacking it would weaken the opponent's overall position.`,
                expectedDamage,
            });
        }

        // 2. Attack opponent nodes with weak support
        const weakOpponents = [...opponentNodes]
            .map((n) => ({
                node: n,
                balance: this.graph.getEdgeBalance(n.id),
            }))
            .filter((c) => c.balance.ratio < 0.4 && currentRound - c.node.round < 4)
            .sort((a, b) => a.balance.ratio - b.balance.ratio)
            .slice(0, 2);

        for (const c of weakOpponents) {
            const expectedDamage = (1 - c.balance.ratio) * 0.6;
            candidates.push({
                type: 'attack_low_support',
                targetNodeId: c.node.id,
                targetClaim: c.node.content.slice(0, 150),
                score: expectedDamage,
                rationale: `This claim has weak support (support ratio ${c.balance.ratio.toFixed(2)}). It is vulnerable to attack.`,
                expectedDamage,
            });
        }

        // 3. Defend own weak nodes
        const ownWeak = ownNodes
            .map((n) => ({
                node: n,
                balance: this.graph.getEdgeBalance(n.id),
                centrality: this.graph.getCentrality(n.id),
            }))
            .filter((c) => c.balance.attack > c.balance.support && c.centrality > 0.2)
            .sort((a, b) => b.centrality - a.centrality)
            .slice(0, 2);

        for (const c of ownWeak) {
            candidates.push({
                type: 'defend_own_weak',
                targetNodeId: c.node.id,
                targetClaim: c.node.content.slice(0, 150),
                score: c.centrality * 0.7,
                rationale: `Your claim with centrality ${c.centrality.toFixed(2)} is under heavy attack (${c.balance.attack} attacks vs ${c.balance.support} supports). Defend it.`,
                expectedDamage: 0,
            });
        }

        // 4. Support own strong claims
        const ownStrong = ownNodes
            .map((n) => ({
                node: n,
                balance: this.graph.getEdgeBalance(n.id),
                centrality: this.graph.getCentrality(n.id),
            }))
            .filter((c) => c.centrality > 0.4 && c.balance.support < c.balance.attack + 1)
            .sort((a, b) => b.centrality - a.centrality)
            .slice(0, 2);

        for (const c of ownStrong) {
            candidates.push({
                type: 'support_own_strong',
                targetNodeId: c.node.id,
                targetClaim: c.node.content.slice(0, 150),
                score: c.centrality * 0.5,
                rationale: `Your high-centrality claim (${c.centrality.toFixed(2)}) needs more supporting evidence. Strengthen it preemptively.`,
                expectedDamage: 0,
            });
        }

        // 5. Challenge unattacked opponent claims
        const unattacked = this.graph.getUnattackedClaims(currentRound, 2);
        const targetableUnattacked = unattacked.filter((u) => u.node.agentId !== agentId);
        for (const u of targetableUnattacked.slice(0, 2)) {
            candidates.push({
                type: 'challenge_unattacked',
                targetNodeId: u.node.id,
                targetClaim: u.node.content.slice(0, 150),
                score: 0.5 + u.roundsSince * 0.1,
                rationale: `This opponent claim has gone unchallenged for ${u.roundsSince} rounds. Challenge it now before it gains perceived acceptance.`,
                expectedDamage: 0.3 + u.roundsSince * 0.05,
            });
        }

        return candidates;
    }

    // ── Move evaluation ──

    private _evaluateMove(move: MinimaxMove, _agentId: string): number {
        const node = this.graph.getNode(move.targetNodeId);
        if (!node) return 0;

        let score: number;

        switch (move.type) {
            case 'attack_high_centrality':
            case 'attack_low_support':
                score =
                    this.graph.getCentrality(move.targetNodeId) * CENTRALITY_WEIGHT +
                    (1 - this.graph.getEdgeBalance(move.targetNodeId).ratio) * SUPPORT_RATIO_WEIGHT;
                break;
            case 'defend_own_weak':
                score = this.graph.getCentrality(move.targetNodeId) * CENTRALITY_WEIGHT;
                break;
            case 'support_own_strong':
                score = this.graph.getCentrality(move.targetNodeId) * 0.6 * CENTRALITY_WEIGHT;
                break;
            case 'challenge_unattacked':
                score = 0.5;
                break;
            default:
                score = 0.3;
        }

        return score;
    }

    // ── Opponent response simulation ──

    private _simulateOpponentResponse(
        _ourMove: MinimaxMove,
        agentId: string,
        _currentRound: number,
    ): { score: number } | null {
        const allNodes = this.graph.getAllNodes();
        const ourNodes = allNodes.filter((n) => n.agentId === agentId);

        if (ourNodes.length === 0) return null;

        // Opponent's best response: attack our highest-centrality claim
        let worstDamage = 0;

        for (const node of ourNodes) {
            const centrality = this.graph.getCentrality(node.id);
            const balance = this.graph.getEdgeBalance(node.id);
            const damage = centrality * 0.5 + (1 - balance.ratio) * 0.3;
            if (damage > worstDamage) worstDamage = damage;
        }

        return { score: worstDamage };
    }
}
