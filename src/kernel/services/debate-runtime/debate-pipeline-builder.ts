import { DebatePipeline } from './debate-pipeline';
import { createAgentExecutor } from './debate-agent-executor';
import { gatherClaims } from './debate-consensus';
import { estimateConfidence } from './debate-llm-caller';
import { executePolicyActions } from './debate-policy-engine';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import { getRoundDelayMs } from './debate-round-constants';
import type {
    IDebateSession,
    IDebateBudget,
    ParticipantConfig,
} from '../../contracts/debate-runtime';
import type { IEventBus } from '../../types/interfaces';
import type { IAdapterRegistry } from '../../contracts/provider-adapter';
import type { DebatePolicyEngine } from './debate-policy-engine';
import type { DebateRAGRetriever } from './debate-rag-retriever';
import type { DebateMemoryExtractor } from './debate-memory-extractor';
import type { IDebateEvaluator } from '../../contracts/debate-runtime';
import type { DebateMemory } from './debate-memory';
import type { DebateSessionContext } from './debate-session-context';
import { DebateProviderResolver } from './debate-query-engine';
import { validateAndSaveVerdict } from './debate-conclusion-engine';
import type { DebateSessionSnapshot } from '../../contracts/debate-runtime';
const LOGGER = rootLogger.child('DebatePipelineBuilder');

interface KeyServiceLike {
    getKeys(): Array<{
        id: string;
        key: string;
        provider: string;
        status: string;
        model?: string;
        availableModels?: string[];
    }>;
    recordUsage(
        keyId: string,
        latency: number,
        tokens: number,
        modelId: string,
        metadata?: Record<string, unknown>,
    ): void;
    updateKeyStatus(keyId: string, status: string): void;
}

export interface PipelineEngineDeps {
    readonly eventBus: IEventBus;
    readonly policyEngine?: DebatePolicyEngine;
    readonly ragRetriever?: DebateRAGRetriever;
    readonly memoryExtractor?: DebateMemoryExtractor;
    readonly evaluator?: IDebateEvaluator;
    getKeyService(): KeyServiceLike;
    getAdapterRegistry(): IAdapterRegistry;
    getKeyStateStore?(): {
        get(
            id: string,
        ):
            | { flags: { authFailed: boolean; circuitOpen: boolean; rateLimited: boolean } }
            | undefined;
        update(id: string, patch: { flags: Record<string, boolean> }): void;
    };
}

export interface PipelineEngine {
    readonly sessions: Map<string, IDebateSession>;
    readonly budgets: Map<string, IDebateBudget>;
    readonly deps: PipelineEngineDeps;
    getMemory(id: string): DebateMemory;
    getContext(id: string): DebateSessionContext;
    runProviderPreflight(sessionId: string): Promise<void>;
    callLLM(
        sessionId: string,
        session: IDebateSession,
        participant: ParticipantConfig,
        signal?: AbortSignal,
    ): Promise<string>;
    pauseSession(sessionId: string): void;
    providerResolver: DebateProviderResolver;
    sessionAbortControllers: Map<string, Map<string, AbortController>>;
}

export function buildPipeline(engine: PipelineEngine, isResume: boolean): DebatePipeline {
    const pipeline = new DebatePipeline();

    pipeline.addStage({
        name: 'preflight',
        run: async (sessionId) => {
            if (isResume) return { ok: true };
            const session = engine.sessions.get(sessionId)!;
            engine.deps.eventBus.emit(EVENTS.DEBATE_SESSION_STARTED, { sessionId });
            await engine.runProviderPreflight(sessionId);

            const keyService = engine.deps.getKeyService();
            const allKeys = keyService.getKeys();
            const hasWorkingProvider = allKeys.some(
                (k) =>
                    k.status === 'active' &&
                    !session.hasProviderFailed(k.provider) &&
                    !engine.providerResolver.isKeyAuthFailed(k.id),
            );
            if (!hasWorkingProvider) {
                const msg = 'All LLM providers failed preflight — no working keys available';
                LOGGER.warn('DebatePipeline', msg, { sessionId });
                session.transition('failed');
                engine.deps.eventBus.emitOnce(EVENTS.DEBATE_SESSION_FAILED, sessionId, {
                    sessionId,
                    error: msg,
                });
                return { ok: false, error: msg };
            }
            return { ok: true };
        },
    });

    pipeline.addStage({
        name: 'setupExecutor',
        run: async (sessionId) => {
            const session = engine.sessions.get(sessionId)!;
            engine.getContext(sessionId).orchestrator.setAgentExecutor(
                createAgentExecutor(sessionId, {
                    getSession: (id) => engine.sessions.get(id),
                    getBudget: (id) => engine.budgets.get(id),
                    eventBus: engine.deps.eventBus,
                    getKeyService: () => engine.deps.getKeyService(),
                    callLLM: (id, s, p, signal) => engine.callLLM(id, s, p, signal),
                    providerResolver:
                        engine.providerResolver as import('./debate-query-engine').DebateProviderResolver,
                    findParticipant: (_id, nodeId) =>
                        session.participants.find((p) => p.nodeId === nodeId),
                }),
            );
            return { ok: true };
        },
    });

    pipeline.addStage({
        name: 'roundLoop',
        run: async (sessionId) => {
            const session = engine.sessions.get(sessionId)!;
            let earlyExit = false;

            try {
                // On resume, session.round was already incremented by the previous
                // round:start handler. Subtract 1 to resume the same round.
                const startRound = isResume ? Math.max(0, session.round - 1) : session.round;
                // Build set of agentIds that already spoke in the resumed round
                // (from arguments restored via snapshot). The generator's roundNum = r+1,
                // so the current round number is startRound + 1.
                const skipAgents: Set<string> | undefined = isResume
                    ? new Set(
                          (session.arguments ?? [])
                              .filter((a) => a.round === startRound + 1)
                              .map((a) => a.agentId),
                      )
                    : undefined;
                for await (const event of engine
                    .getContext(sessionId)
                    .orchestrator.generateRoundEvents(
                        session.topology,
                        sessionId,
                        startRound,
                        skipAgents,
                    )) {
                    // agent:responded is recorded with richer payload (including round) in
                    // the case handler below — skip the generic recording to avoid duplicates.
                    if (event.type !== 'agent:responded') {
                        engine
                            .getContext(sessionId)
                            .timeline.record({ sessionId, type: event.type, payload: event });
                    }

                    switch (event.type) {
                        case 'round:start': {
                            // On resume, the round was already started — skip
                            // transition, round counter increment, and budget increment.
                            if (!isResume) {
                                session.transition('deliberating');
                                session.incrementRound();
                                engine.budgets.get(sessionId)?.incrementRound(sessionId);
                            }
                            engine.deps.eventBus.emit(EVENTS.DEBATE_ROUND_STARTED, {
                                sessionId,
                                round: event.round,
                                nodes: event.nodes,
                            });
                            break;
                        }
                        case 'agent:thinking': {
                            const p = session.participants.find((p) => p.nodeId === event.agentId);
                            if (p) {
                                session.setAgentPhase(p.agentId, 'thinking');
                                engine.deps.eventBus.emit(EVENTS.DEBATE_AGENT_THINKING, {
                                    sessionId,
                                    agentId: p.agentId,
                                });
                            }
                            break;
                        }
                        case 'agent:responded': {
                            const pR = session.participants.find((p) => p.nodeId === event.agentId);
                            if (!pR) break;
                            session.setAgentPhase(pR.agentId, 'streaming');
                            const stepConfidence = estimateConfidence(event.content);
                            engine.getMemory(sessionId).recordStep({
                                agentId: pR.agentId,
                                content: event.content,
                                type: 'claim',
                                confidence: stepConfidence,
                                timestamp: Date.now(),
                                round: session.round,
                            });
                            engine.getContext(sessionId).timeline.record({
                                sessionId,
                                type: 'agent:responded',
                                payload: {
                                    agentId: pR.agentId,
                                    content: event.content,
                                    round: session.round,
                                },
                            });
                            engine.deps.eventBus.emit(EVENTS.DEBATE_AGENT_RESPONDED, {
                                sessionId,
                                agentId: pR.agentId,
                                content: event.content,
                            });
                            break;
                        }
                        case 'agent:error': {
                            const pE = session.participants.find((p) => p.nodeId === event.agentId);
                            if (!pE) break;
                            session.setAgentPhase(pE.agentId, 'errored');
                            session.setAgentError(pE.agentId, event.error);
                            engine.getContext(sessionId).timeline.record({
                                sessionId,
                                type: 'agent:error',
                                payload: { agentId: pE.agentId, error: event.error },
                            });
                            engine.deps.eventBus.emit(EVENTS.DEBATE_AGENT_ERROR, {
                                sessionId,
                                agentId: pE.agentId,
                                error: event.error,
                            });
                            break;
                        }
                        case 'round:end': {
                            engine.deps.eventBus.emit(EVENTS.DEBATE_ROUND_ENDED, {
                                sessionId,
                                round: event.round,
                            });

                            // Trim old step content after each round to cap memory.
                            // Keep last 8 steps with full content for LLM context;
                            // older steps retain structure but get empty content strings.
                            engine.getMemory(sessionId).trimContent(8);

                            if (event.allErrored) {
                                const msg = event.anyBudgetSkipped
                                    ? 'Budget exceeded — debate paused'
                                    : 'All providers unavailable — debate cannot proceed';
                                LOGGER.warn('DebatePipeline', msg, { sessionId });
                                session.transition(event.anyBudgetSkipped ? 'paused' : 'failed');
                                if (event.anyBudgetSkipped) {
                                    engine.deps.eventBus.emit(EVENTS.DEBATE_SESSION_PAUSED, {
                                        sessionId,
                                        reason: msg,
                                    });
                                }
                                // Phase handler emits DEBATE_SESSION_FAILED for 'failed' transition
                                earlyExit = true;
                                break;
                            }

                            const interimClaims = gatherClaims(
                                sessionId,
                                session.participants,
                                (sid) => engine.getMemory(sid),
                                session.round,
                            );
                            let interimConfidence = 0.5;
                            if (interimClaims.length > 1) {
                                const interim = engine
                                    .getContext(sessionId)
                                    .consensus.evaluate(interimClaims);
                                interimConfidence = interim.confidence;
                                if (interim.confidence >= 0.85) {
                                    engine.deps.eventBus.emit(EVENTS.DEBATE_ROUND_EARLY_EXIT, {
                                        sessionId,
                                        confidence: interim.confidence,
                                        round: event.round,
                                    });
                                    earlyExit = true;
                                }
                            }

                            if (!earlyExit && getRoundDelayMs() > 0) {
                                await new Promise<void>((resolve) =>
                                    setTimeout(resolve, getRoundDelayMs()),
                                );
                                if (session.phase === 'cancelled' || session.phase === 'failed') {
                                    earlyExit = true;
                                }
                            }

                            if (engine.deps.policyEngine && !earlyExit) {
                                const budgetSnap = engine.budgets.get(sessionId)?.snapshot();
                                const agentErrorRates = new Map<string, number>();
                                for (const p of session.participants) {
                                    const state = session.agentStates.get(p.agentId);
                                    if (state?.error)
                                        agentErrorRates.set(
                                            p.agentId,
                                            (agentErrorRates.get(p.agentId) || 0) + 1,
                                        );
                                }
                                const ctx = engine.deps.policyEngine.buildContext(
                                    session.phase,
                                    event.round,
                                    session.totalTokens,
                                    session.totalCost,
                                    interimConfidence,
                                    budgetSnap?.pressure ?? 'low',
                                    agentErrorRates,
                                    [],
                                );
                                const policyActions = engine.deps.policyEngine.evaluate(ctx);
                                executePolicyActions(policyActions, sessionId, {
                                    pauseSession: (id) => engine.pauseSession(id),
                                    emitEvent: (name, payload) =>
                                        engine.deps.eventBus.emit(name, payload),
                                    skipAgent: (agentId) => {
                                        const state = session.agentStates.get(agentId);
                                        if (state) {
                                            session.setAgentPhase(agentId, 'errored');
                                            session.setAgentError(agentId, 'Skipped by policy');
                                        }
                                    },
                                    log: (level, message) =>
                                        LOGGER[level]('PolicyEngine', message, { sessionId }),
                                });
                            }
                            break;
                        }
                    }
                    if (earlyExit) break;
                }
            } catch (e) {
                session.transition('failed');
                engine.deps.eventBus.emitOnce(EVENTS.DEBATE_SESSION_FAILED, sessionId, {
                    sessionId,
                    error: String(e),
                });
                return { ok: false, error: String(e) };
            }

            if (
                session.phase === 'completed' ||
                session.phase === 'failed' ||
                session.phase === 'cancelled' ||
                session.phase === 'paused'
            ) {
                if (session.phase !== 'paused' && session.phase !== 'cancelled')
                    engine.getContext(sessionId).orchestrator.clearAbort(sessionId);
                return { ok: true, earlyExit: true };
            }

            return { ok: true };
        },
    });

    pipeline.addStage({
        name: 'consensusAndFinalize',
        run: async (sessionId) => {
            try {
                const session = engine.sessions.get(sessionId)!;
                session.transition('consensus');
                const claims = gatherClaims(
                    sessionId,
                    session.participants,
                    (sid) => engine.getMemory(sid),
                    session.round,
                );
                const result = engine.getContext(sessionId).consensus.evaluate(claims);
                engine.deps.eventBus.emit(EVENTS.DEBATE_CONSENSUS_REACHED, {
                    sessionId,
                    confidence: result.confidence,
                    agreements: result.agreements.length,
                    conflicts: result.conflicts.length,
                });
                session.transition('summarizing');

                // C2: Generate verdict with LLM BEFORE transitioning to completed.
                // Previously this was fire-and-forget in the phase handler — the
                // pipeline could complete and session data get cleaned up before
                // the async verdict resolved, causing silent data loss.
                const ctx = engine.getContext(sessionId);
                const conclusionEngine = ctx?.conclusionEngine;
                if (conclusionEngine) {
                    const verdictController = new AbortController();
                    const verdictTimer = setTimeout(
                        () => verdictController.abort(new Error('VerdictTimedOut')),
                        30_000,
                    );
                    try {
                        const snap = session.snapshot() as DebateSessionSnapshot;
                        const tl = ctx.timeline.getEntries(sessionId);
                        const verdict = await conclusionEngine.generateVerdictWithLLM(
                            snap,
                            tl,
                            verdictController.signal,
                        );
                        clearTimeout(verdictTimer);
                        const debateStore = (engine as unknown as Record<string, unknown>)
                            .debateStore as
                            import('../../contracts/storage/debate-store').DebateStore | undefined;
                        if (debateStore && verdict) {
                            await validateAndSaveVerdict(debateStore, {
                                sessionId: verdict.sessionId,
                                topic: verdict.topic,
                                summary: verdict.summary,
                                conclusionType: verdict.conclusionType,
                                stanceResult: verdict.stanceResult,
                                keyArguments: JSON.stringify(verdict.keyArguments),
                                reasoning: verdict.reasoning,
                                confidence: verdict.confidence,
                                generatedAt: verdict.generatedAt,
                                roundsTotal: verdict.roundsTotal,
                                totalTokens: verdict.totalTokens,
                            });
                        }
                        engine.deps.eventBus.emitOnce(EVENTS.DEBATE_VERDICT_GENERATED, sessionId, {
                            sessionId,
                            verdict,
                        });
                    } catch (ve) {
                        clearTimeout(verdictTimer);
                        LOGGER.warn(
                            'DebatePipeline',
                            'LLM-enhanced verdict failed, using heuristic',
                            { error: ve, sessionId },
                        );
                    }
                }

                session.transition('completed');
                return { ok: true };
            } catch (e) {
                LOGGER.error('DebatePipeline', 'consensusAndFinalize threw', {
                    sessionId,
                    error: String(e),
                });
                const s = engine.sessions.get(sessionId);
                if (
                    s &&
                    s.phase !== 'cancelled' &&
                    s.phase !== 'failed' &&
                    s.phase !== 'completed'
                ) {
                    try {
                        s.transition('failed');
                    } catch {
                        /* ignore */
                    }
                }
                engine.deps.eventBus.emitOnce(EVENTS.DEBATE_SESSION_FAILED, sessionId, {
                    sessionId,
                    error: String(e),
                });
                return { ok: false, error: String(e) };
            }
        },
    });

    return pipeline;
}
