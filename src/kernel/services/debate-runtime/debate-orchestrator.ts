import type {
    DebateTopology,
    OrchestratorEvent,
    IDebateOrchestrator,
    AgentExecutor,
} from '../../contracts/debate-runtime';
import { ConversationOrchestrator } from '../conversation-orchestrator';
import { DebateTopologyService } from './debate-topology';
import { rootLogger } from '../logger-service';
const ORC_LOGGER = rootLogger.child('DebateOrchestrator');

function getHeapMB(): number {
    try {
        const mem = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        return mem ? Math.round(mem.usedJSHeapSize / (1024 * 1024)) : 0;
    } catch {
        return 0;
    }
}

// gcHint removed: allocating 128MB of strings to trigger V8 GC
// was counterproductive — it promoted those strings to old gen,
// making the memory leak WORSE. V8 GC cannot be triggered from
// user code without --expose-gc flag.

export class DebateOrchestrator implements IDebateOrchestrator {
    private conversationOrchestrator?: ConversationOrchestrator;
    private aborted = new Set<string>();
    private abortControllers = new Map<string, AbortController>();
    private executor: AgentExecutor | undefined;
    // P2.24: Track agent participation for adaptive speaking order
    private participationCount = new Map<string, number>();
    // Track which agent each agent last responded to (for responsive ordering in later rounds)
    private lastInteraction = new Map<string, string>();
    // P2.13: Bidding for Speaking Time — agents bid relevance for the floor
    private bidScores = new Map<string, number>();

    constructor(private topologyService: DebateTopologyService) {}

    // P2.13: Compute bid score for an agent based on role relevance to last argument
    private computeBid(
        agentId: string,
        role: string | undefined,
        lastArgRole: string | undefined,
        _lastArgContent: string,
        roundNum: number,
    ): number {
        let score = 0.5;

        // Role relevance: agent with opposite role to last speaker gets priority (rebuttal)
        if (role && lastArgRole && role !== lastArgRole) {
            score += 0.3;
        } else if (role && lastArgRole && role === lastArgRole) {
            score += 0.1;
        }

        // Participation balance: agents who spoke less bid higher
        const count = this.participationCount.get(agentId) ?? 0;
        score += Math.max(0, 0.2 - count * 0.05);

        // Random jitter for variety (deterministic based on agentId + round)
        const jitter =
            ((agentId.charCodeAt(0) * 7 +
                agentId.charCodeAt(agentId.length - 1) * 13 +
                roundNum * 3) %
                100) /
            1000;
        score += jitter;

        return Math.min(1, Math.max(0, score));
    }

    setAgentExecutor(executor: AgentExecutor): void {
        this.executor = executor;
    }

    private isSessionAborted(sessionId: string): boolean {
        if (this.conversationOrchestrator) {
            return this.conversationOrchestrator.isAborted(sessionId);
        }
        return this.aborted.has(sessionId);
    }

    private getSessionSignal(sessionId: string): AbortSignal {
        if (this.conversationOrchestrator) {
            return this.conversationOrchestrator.getAbortSignal(sessionId);
        }
        let ac = this.abortControllers.get(sessionId);
        if (!ac) {
            ac = new AbortController();
            this.abortControllers.set(sessionId, ac);
        }
        return ac.signal;
    }

    abort(sessionId: string): void {
        if (this.conversationOrchestrator) {
            this.conversationOrchestrator.abortSession(sessionId);
        } else {
            this.aborted.add(sessionId);
            this.abortControllers.get(sessionId)?.abort();
        }
    }

    clearAbort(sessionId: string): void {
        if (this.conversationOrchestrator) {
            this.conversationOrchestrator.clearAbort(sessionId);
        } else {
            this.aborted.delete(sessionId);
            this.abortControllers.delete(sessionId);
        }
    }

    async *generateRoundEvents(
        topology: DebateTopology,
        sessionId: string,
        startRound = 0,
        skipAgents?: ReadonlySet<string>,
    ): AsyncGenerator<OrchestratorEvent, void, unknown> {
        const rounds = this.topologyService.buildRounds(topology);
        const startHeap = getHeapMB();

        for (let r = startRound; r < rounds.length; r++) {
            if (this.isSessionAborted(sessionId)) return;

            const nodeGroup = rounds[r]!;
            const roundNum = r + 1;
            const nodeIds = nodeGroup.map((n) => n.id);
            const roundHeapMB = getHeapMB();
            ORC_LOGGER.debug('DebateOrchestrator', `Round ${roundNum} start`, {
                heapMB: roundHeapMB,
                agents: nodeIds.length,
            });
            yield { type: 'round:start', round: roundNum, nodes: nodeIds };

            // Phase 2: orchestrator drives the full agent lifecycle.
            // The executor callback (set by engine) handles LLM routing,
            // budget checks, and provider fallback.

            // P2.24: Adaptive Speaking Order — reorder agents based on
            // participation balance. Early rounds: quiet agents go first.
            // Later rounds: prioritize recently-challenged agents.
            const orderedNodes = [...nodeGroup].sort((a, b) => {
                const countA = this.participationCount.get(a.id) ?? 0;
                const countB = this.participationCount.get(b.id) ?? 0;
                if (roundNum <= 3) {
                    // Early rounds: balance participation — prioritize agents
                    // who have spoken less
                    if (countA !== countB) return countA - countB;
                } else {
                    // Later rounds: responsive ordering — agents who were
                    // recently targeted get priority
                    const interactionDiff =
                        (this.lastInteraction.get(b.id) ? 1 : 0) -
                        (this.lastInteraction.get(a.id) ? 1 : 0);
                    if (interactionDiff !== 0) return interactionDiff;
                    // Fall back to participation balance
                    if (countA !== countB) return countA - countB;
                }
                // Deterministic tiebreaker
                return a.id.localeCompare(b.id);
            });

            // P2.13: Track last argument context for bidding relevance computation
            let lastArgRole: string | undefined;
            let lastArgContent: string;

            let allErrored = true;
            let anyBudgetSkipped = false;

            // P2.13: Pre-compute bids for all agents in this round
            const remainingNodes = [...orderedNodes];
            for (let i = 0; i < remainingNodes.length; i++) {
                const bid = this.computeBid(
                    remainingNodes[i]!.id,
                    remainingNodes[i]!.label,
                    undefined,
                    '',
                    roundNum,
                );
                this.bidScores.set(remainingNodes[i]!.id, bid);
            }

            for (let ni = 0; ni < remainingNodes.length; ni++) {
                const node = remainingNodes[ni]!;
                if (this.isSessionAborted(sessionId)) return;

                // On resume, skip agents that already produced an argument in this round
                if (skipAgents?.has(node.id)) {
                    ORC_LOGGER.debug(
                        'DebateOrchestrator',
                        `Skipping ${node.id} — already responded in round ${roundNum} (resume)`,
                    );
                    continue;
                }

                if (!this.executor) {
                    yield { type: 'agent:error', agentId: node.id, error: 'No executor set' };
                    continue;
                }

                yield { type: 'agent:thinking', agentId: node.id };

                try {
                    const signal = this.getSessionSignal(sessionId);
                    const result = await this.executor({
                        sessionId,
                        agentId: node.id,
                        nodeId: node.id,
                        signal,
                    });

                    if (result.budgetSkipped) {
                        anyBudgetSkipped = true;
                        continue;
                    }

                    if (result.success) {
                        // P2.24: Track participation for adaptive ordering
                        this.participationCount.set(
                            node.id,
                            (this.participationCount.get(node.id) ?? 0) + 1,
                        );
                        // P2.13: Update last argument context for bidding relevance
                        lastArgRole = node.id;
                        lastArgContent = result.content || '';
                        // Recompute bids for remaining agents based on new last argument
                        if (roundNum >= 2) {
                            for (let ri = ni + 1; ri < remainingNodes.length; ri++) {
                                const rem = remainingNodes[ri]!;
                                const bid = this.computeBid(
                                    rem.id,
                                    rem.label,
                                    lastArgRole,
                                    lastArgContent,
                                    roundNum,
                                );
                                this.bidScores.set(rem.id, bid);
                            }
                            // Re-sort remaining nodes by bid score descending
                            const nextNodes = remainingNodes.slice(ni + 1);
                            nextNodes.sort((a, b) => {
                                const scoreA = this.bidScores.get(a.id) ?? 0;
                                const scoreB = this.bidScores.get(b.id) ?? 0;
                                if (scoreA !== scoreB) return scoreB - scoreA;
                                return a.id.localeCompare(b.id);
                            });
                            remainingNodes.splice(ni + 1);
                            remainingNodes.push(...nextNodes);
                        }
                        yield {
                            type: 'agent:responded',
                            agentId: node.id,
                            content: result.content,
                        };
                        allErrored = false;
                    } else {
                        yield {
                            type: 'agent:error',
                            agentId: node.id,
                            error: result.error ?? 'Unknown error',
                        };
                    }
                } catch (e) {
                    yield {
                        type: 'agent:error',
                        agentId: node.id,
                        error: String(e),
                    };
                }
            }

            const roundEndHeap = getHeapMB();
            if (roundEndHeap - roundHeapMB > 5) {
                ORC_LOGGER.debug('DebateOrchestrator', `Round ${roundNum} end`, {
                    heapMB: roundEndHeap,
                    deltaMB: roundEndHeap - roundHeapMB,
                });
            }
            yield {
                type: 'round:end',
                round: roundNum,
                allErrored: allErrored || undefined,
                anyBudgetSkipped: anyBudgetSkipped || undefined,
            };

            if (this.aborted.has(sessionId)) return;
        }

        const endHeap = getHeapMB();
        const totalDelta = endHeap - startHeap;
        if (Math.abs(totalDelta) > 5) {
            ORC_LOGGER.debug('DebateOrchestrator', 'Debate complete', {
                startHeapMB: startHeap,
                endHeapMB: endHeap,
                deltaMB: totalDelta,
            });
        }
        yield { type: 'topology:complete' };
    }

    destroy(sessionId?: string): void {
        if (sessionId) {
            if (this.conversationOrchestrator) {
                this.conversationOrchestrator.clearAbort(sessionId);
            } else {
                this.aborted.delete(sessionId);
            }
            this.participationCount.delete(sessionId);
            this.lastInteraction.delete(sessionId);
            this.bidScores.delete(sessionId);
        } else {
            if (this.conversationOrchestrator) {
                this.conversationOrchestrator.clearAbortAll();
            }
            this.aborted.clear();
            this.participationCount.clear();
            this.lastInteraction.clear();
            this.bidScores.clear();
        }
    }
}
