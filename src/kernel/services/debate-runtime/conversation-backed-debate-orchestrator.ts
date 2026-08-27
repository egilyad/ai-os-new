import type {
    DebateTopology,
    IDebateOrchestrator,
    OrchestratorEvent,
    AgentExecutor,
    AgentExecutionResult,
} from '../../contracts/debate-runtime';
import type { ITurnPolicy, PolicyState } from '../../contracts/conversation/policy';
import type { IExecutionEngine, TurnResult } from '../../contracts/conversation/execution';
import type { TurnProposal } from '../../contracts/conversation/turn';
import type { ConversationContext } from '../../contracts/conversation/context';
import { ConversationOrchestrator } from '../conversation-orchestrator';
import { DebatePolicy } from './debate-policy';
import { DebateTopologyService } from './debate-topology';

/**
 * ExecutionEngine that maps a ConversationCore `Turn` onto the EXISTING
 * debate agent executor (AgentExecutor). This deliberately reuses the real
 * debate LLM path — routing / budget / ExecutionGovernor / retry / failover /
 * timeout — unchanged. Only the DECISION layer (who speaks when) moves to Core.
 */
export class DebateAgentExecutionEngine implements IExecutionEngine {
    lastProposal: TurnProposal | undefined;
    lastResult: TurnResult | undefined;
    private agentExecutor: AgentExecutor | undefined;

    setAgentExecutor(executor: AgentExecutor): void {
        this.agentExecutor = executor;
    }

    async execute(
        proposal: TurnProposal,
        context: ConversationContext,
        sessionSignal: AbortSignal,
    ): Promise<TurnResult> {
        if (!this.agentExecutor) {
            return { success: false, error: 'No agent executor set' };
        }
        this.lastProposal = proposal;
        const r: AgentExecutionResult = await this.agentExecutor({
            sessionId: (context.metadata['sessionId'] as string) ?? '',
            agentId: proposal.participantId,
            nodeId: proposal.participantId,
            signal: sessionSignal,
        });
        const result: TurnResult = {
            success: r.success,
            content: r.content,
            tokens: r.latency,
            error: r.error,
            budgetSkipped: r.budgetSkipped,
        };
        this.lastResult = result;
        return result;
    }
}

/**
 * Step A.2 — ConversationCore-backed Debate runtime (feature-flagged).
 *
 * Implements the SAME `IDebateOrchestrator` contract as the old
 * `DebateOrchestrator`, so the existing `debate-pipeline-builder` translation
 * layer (anti-corrosion layer) is untouched and keeps emitting identical
 * `DEBATE_*` events.
 *
 * What changes vs old runtime:
 *   - DECISION/ordering  → DebatePolicy (proven equivalent in A.1)
 *   - EXECUTION          → DebateAgentExecutionEngine → existing debate AgentExecutor
 *   - LIFECYCLE/abort    → ConversationOrchestrator
 *
 * What stays Debate-specific (correctly OUTSIDE Core):
 *   - round:* framing   → emitted here from DebatePolicy.roundNumber
 *   - consensus/budget  → untouched debate services
 *
 * The flag selects this class at the Debate entry point; the old
 * DebateOrchestrator remains the default (kill switch).
 */
export class ConversationBackedDebateOrchestrator implements IDebateOrchestrator {
    private policy: DebatePolicy;
    private executionEngine: DebateAgentExecutionEngine;
    private conversationOrchestrator: ConversationOrchestrator;

    constructor(private topologyService: DebateTopologyService) {
        this.policy = new DebatePolicy(topologyService);
        this.executionEngine = new DebateAgentExecutionEngine();
        this.conversationOrchestrator = new ConversationOrchestrator(
            this.policy as ITurnPolicy,
            this.executionEngine as IExecutionEngine,
            { topic: '', participants: [], history: [], metadata: {} },
        );
    }

    setAgentExecutor(executor: AgentExecutor): void {
        this.executionEngine.setAgentExecutor(executor);
    }

    async *generateRoundEvents(
        topology: DebateTopology,
        sessionId: string,
        startRound = 0,
        skipAgents?: ReadonlySet<string>,
    ): AsyncGenerator<OrchestratorEvent, void, unknown> {
        if (startRound > 0) this.policy.setRound(startRound);

        const context: ConversationContext = {
            topic: sessionId,
            participants: topology.nodes.map((n) => ({ id: n.id, role: n.label })),
            history: [],
            metadata: { topology, sessionId },
        };
        const rounds = this.topologyService.buildRounds(topology);

        let lastRound: number | null = null;
        let allErrored = true;
        let anyBudgetSkipped = false;

        while (true) {
            if (this.conversationOrchestrator.isAborted(sessionId)) return;

            const proposal = await this.policy.proposeNextTurn(context, {
                id: sessionId,
                data: {},
            } as PolicyState);
            if (!proposal) break;

            // Resume: skip agents that already responded in the restored round.
            if (skipAgents?.has(proposal.participantId)) {
                this.policy.updateStateAfterTurn(proposal.participantId, true);
                continue;
            }

            const roundNum = this.policy.roundNumber;

            if (lastRound !== roundNum) {
                if (lastRound !== null) {
                    yield {
                        type: 'round:end',
                        round: lastRound,
                        allErrored: allErrored || undefined,
                        anyBudgetSkipped: anyBudgetSkipped || undefined,
                    };
                }
                const nodes = (rounds[roundNum - 1] ?? []).map((n) => n.id);
                yield { type: 'round:start', round: roundNum, nodes };
                lastRound = roundNum;
                allErrored = true;
                anyBudgetSkipped = false;
            }

            yield { type: 'agent:thinking', agentId: proposal.participantId };

            const result = await this.executionEngine.execute(
                proposal,
                context,
                this.conversationOrchestrator.getAbortSignal(sessionId),
            );

            if (result.budgetSkipped) {
                anyBudgetSkipped = true;
            } else if (result.success) {
                yield {
                    type: 'agent:responded',
                    agentId: proposal.participantId,
                    content: result.content ?? '',
                };
                allErrored = false;
                // Mirror old generator: ordering re-sort + participation update
                // happen ONLY on success (error / budget-skip leave order untouched).
                this.policy.updateStateAfterTurn(proposal.participantId, true);
            } else {
                yield {
                    type: 'agent:error',
                    agentId: proposal.participantId,
                    error: result.error ?? 'Unknown error',
                };
            }
        }

        if (lastRound !== null) {
            yield {
                type: 'round:end',
                round: lastRound,
                allErrored: allErrored || undefined,
                anyBudgetSkipped: anyBudgetSkipped || undefined,
            };
        }
        yield { type: 'topology:complete' };
    }

    abort(sessionId: string): void {
        this.conversationOrchestrator.abortSession(sessionId);
    }

    clearAbort(sessionId: string): void {
        this.conversationOrchestrator.clearAbort(sessionId);
    }

    destroy(): void {
        this.conversationOrchestrator.clearAbortAll();
    }
}
