import type {
    TacticalDirective,
    TacticalRole,
    IMetaAgentController,
} from '../../contracts/debate-meta-agent';
import type { IArgumentGraphService } from '../../contracts/debate-argument-graph';

/**
 * P0.8 Tactical Role-Switching Meta-Agent.
 *
 * Per-round heuristic role assignment based on argument graph stats.
 * No LLM calls — pure graph analysis.
 */
export class MetaAgentController implements IMetaAgentController {
    private graph: IArgumentGraphService;

    constructor(graph: IArgumentGraphService) {
        this.graph = graph;
    }

    getDirective(
        agentId: string,
        agentName: string,
        previousArguments: ReadonlyArray<{
            id: string;
            agentId: string;
            content: string;
            round: number;
        }>,
        currentRound: number,
    ): TacticalDirective | null {
        if (currentRound <= 1 || previousArguments.length < 3) return null;

        const ownArgs = previousArguments.filter((a) => a.agentId === agentId);
        const ownArgCount = ownArgs.length;
        if (ownArgCount === 0) return null;

        const totalRoundCount = currentRound;
        const otherArgCount = previousArguments.length - ownArgCount;

        // Compute average centrality of this agent's claims from the graph
        const agentNodes = this.graph.getAgentNodes(agentId);
        const avgCentrality =
            agentNodes.length > 0
                ? agentNodes.map((n) => this.graph.getCentrality(n.id)).reduce((a, b) => a + b, 0) /
                  agentNodes.length
                : 0;

        // Compute how many different opponents this agent has engaged
        const attackedOpponents = new Set<string>();
        const allEdges = this.graph.getAllEdges();
        for (const e of allEdges) {
            if (e.sourceId.startsWith(agentId) || e.targetId.startsWith(agentId)) {
                const otherEdge = e.sourceId.startsWith(agentId) ? e.targetId : e.sourceId;
                const otherAgentId = previousArguments.find((a) => a.id === otherEdge)?.agentId;
                if (otherAgentId && otherAgentId !== agentId) attackedOpponents.add(otherAgentId);
            }
        }

        // ── Decision logic ──────────────────────────────────────────────

        // 1. Agent speaks a lot but claims have low impact → optimize rhetoric
        if (ownArgCount > totalRoundCount * 0.6 && avgCentrality < 0.25 && agentNodes.length >= 2) {
            return this._buildDirective(agentId, agentName, 'rhetoric_optimizer');
        }

        // 2. Agent rarely speaks → become evidence harvester (gather more substance)
        if (ownArgCount < Math.max(1, totalRoundCount * 0.3) && otherArgCount > 5) {
            return this._buildDirective(agentId, agentName, 'evidence_harvester');
        }

        // 3. Agent engages very few opponents → switch to devil's advocate
        //    to force cross-examination of under-challenged positions
        const allOpponents = new Set(
            previousArguments.filter((a) => a.agentId !== agentId).map((a) => a.agentId),
        );
        if (allOpponents.size >= 2 && attackedOpponents.size <= 1) {
            return this._buildDirective(agentId, agentName, 'devils_advocate');
        }

        // 4. Agent's claims have high support ratio (mostly agreeing) →
        //    switch to devil's advocate to introduce tension
        if (agentNodes.length >= 2) {
            const balances = agentNodes.map((n) => this.graph.getEdgeBalance(n.id));
            const avgSupportRatio =
                balances.reduce((s, b) => s + b.support, 0) /
                Math.max(
                    1,
                    balances.reduce((s, b) => s + b.support + b.attack, 0),
                );
            if (avgSupportRatio > 0.7) {
                return this._buildDirective(agentId, agentName, 'devils_advocate');
            }
        }

        // 5. Late rounds and own centrality is decent → synthesizer
        if (currentRound >= 4 && avgCentrality > 0.3) {
            return this._buildDirective(agentId, agentName, 'synthesizer');
        }

        return null;
    }

    private _buildDirective(
        agentId: string,
        _agentName: string,
        role: TacticalRole,
    ): TacticalDirective {
        switch (role) {
            case 'devils_advocate':
                return {
                    agentId,
                    role,
                    instruction:
                        "Adopt a devil's advocate stance. Challenge the assumptions and consensus that have formed in this debate. Question claims that have gone unchallenged for more than one round. Your job is to prevent groupthink — find the hidden flaws.",
                    emphasis: "Devil's Advocate — challenge consensus",
                };
            case 'synthesizer':
                return {
                    agentId,
                    role,
                    instruction:
                        'Synthesize the strongest arguments from all sides. Identify common ground, reconcile contradictions where possible, and build a more nuanced position that incorporates the best evidence from multiple perspectives.',
                    emphasis: 'Synthesizer — integrate opposing views',
                };
            case 'evidence_harvester':
                return {
                    agentId,
                    role,
                    instruction:
                        'Focus on gathering and presenting concrete evidence. Every claim you make must include a specific data point, study reference, statistic, or factual example. Your role is to ground the debate in verifiable reality.',
                    emphasis: 'Evidence Harvester — demand and provide data',
                };
            case 'rhetoric_optimizer':
                return {
                    agentId,
                    role,
                    instruction:
                        'Your previous arguments, while numerous, have low impact on the debate. Focus on quality over quantity. Make ONE strong, well-structured argument that targets a high-centrality opponent claim. Use vivid examples and clear logical framing.',
                    emphasis: 'Rhetoric Optimizer — one precise blow',
                };
            default:
                return {
                    agentId,
                    role,
                    instruction:
                        'Continue arguing from your assigned position with your standard approach.',
                    emphasis: 'Standard approach',
                };
        }
    }
}
