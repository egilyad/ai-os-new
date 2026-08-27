import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import type { DebateSession as DebateSessionClass } from './debate-session';
import type { DebateSessionContext } from './debate-session-context';
import type { DebateMemory } from './debate-memory';
import type { TimelineEntry } from '../../contracts/debate-runtime';
import type { DebateStore } from '../../contracts/storage/debate-store';
import type { DebateMemoryExtractor } from './debate-memory-extractor';
import type { IDebateEvaluator } from '../../contracts/debate-runtime';
import type { IBlindEvaluationService } from '../../contracts/debate-blind-eval';
import type { IBayesianJudge } from '../../contracts/debate-bayesian';
import type { IStanceDriftTracker } from '../../contracts/debate-stance-drift';
import type { IQualityImpactCollector } from '../../contracts/quality-impact';

const LOGGER = rootLogger.child('DebatePhaseHandler');

interface PhaseHandlerDeps {
    eventBus: IEventBus;
    debateStore?: DebateStore;
    memoryExtractor?: DebateMemoryExtractor;
    evaluator?: IDebateEvaluator;
    bayesianJudge?: IBayesianJudge;
    stanceDriftTracker?: IStanceDriftTracker;
    blindEval?: IBlindEvaluationService;
    qualityCollector?: IQualityImpactCollector;
}

interface PhaseHandlerGetters {
    getContext: (id: string) => DebateSessionContext;
    getMemory: (id: string) => DebateMemory;
    getTimeline: (id: string) => TimelineEntry[];
    saveSnapshot: (id: string) => Promise<void>;
}

export function createPhaseChangeHandler(
    sessionId: string,
    session: DebateSessionClass,
    deps: PhaseHandlerDeps,
    getters: PhaseHandlerGetters,
    abortSignal?: AbortSignal,
    logSuffix?: string,
): (from: string, to: string) => void {
    return (from: string, to: string) => {
        try {
            const ctx = getters.getContext(sessionId);
            if (!ctx) return;
            ctx.timeline?.record({
                sessionId,
                type: `session:${to}`,
                payload: { from, to },
            });
            deps.eventBus.emit(EVENTS.DEBATE_PHASE_CHANGED, {
                sessionId,
                from,
                to,
            });

            if (to === 'completed' || to === 'failed' || to === 'cancelled') {
                deps.eventBus.emit(
                    to === 'completed'
                        ? EVENTS.DEBATE_SESSION_COMPLETED
                        : to === 'failed'
                          ? EVENTS.DEBATE_SESSION_FAILED
                          : EVENTS.DEBATE_SESSION_CANCELLED,
                    {
                        sessionId,
                        error:
                            to === 'failed'
                                ? session.snapshot().agentStates.find((s) => s.error)?.error
                                : undefined,
                    },
                );
                if (to === 'completed') {
                    const tl = getters.getTimeline(sessionId);

                    if (deps.memoryExtractor) {
                        const extracted = deps.memoryExtractor.extractFromTimeline(sessionId, tl);
                        LOGGER.info(
                            'DebatePhaseHandler',
                            `Memory extraction complete${logSuffix ?? ''}`,
                            {
                                sessionId,
                                units: extracted.units.length,
                                ...extracted.summary,
                            },
                        );

                        if (deps.evaluator) {
                            const claims = deps.memoryExtractor.extractClaims(extracted.units);

                            const bayesianEnabled =
                                session.qualitySettings?.['bayesian-judges'] !== false;

                            if (bayesianEnabled && deps.bayesianJudge) {
                                deps.bayesianJudge.reset(
                                    session.participants.map((p) => p.agentId),
                                );
                            }

                            if (deps.blindEval) {
                                try {
                                    const blindScores = deps.blindEval.evaluateBlindly(
                                        session.participants.map((p) => p.agentId),
                                        claims,
                                        (agentId: string) =>
                                            getters.getMemory(sessionId).getChain(agentId),
                                    );
                                    for (const p of session.participants) {
                                        const score = blindScores.get(p.agentId) ?? {
                                            agentId: p.agentId,
                                            overall: 0,
                                            argumentQuality: 0,
                                            rebuttalStrength: 0,
                                            coherence: 0,
                                            persuasiveness: 0,
                                            factuality: 0,
                                        };

                                        if (bayesianEnabled && deps.bayesianJudge) {
                                            deps.bayesianJudge.update(
                                                p.agentId,
                                                score.overall * 2 - 1,
                                            );
                                        }
                                        const driftPenalty = deps.stanceDriftTracker
                                            ? deps.stanceDriftTracker.getDriftPenalty(p.agentId)
                                            : 1.0;
                                        const bayesianAdjusted =
                                            bayesianEnabled && deps.bayesianJudge
                                                ? deps.bayesianJudge.getAdjustedScore(
                                                      p.agentId,
                                                      score.overall,
                                                  )
                                                : score.overall;
                                        const adjustedOverall = bayesianAdjusted * driftPenalty;

                                        deps.eventBus.emit(EVENTS.DEBATE_AGENT_SCORED, {
                                            sessionId,
                                            agentId: p.agentId,
                                            overall: adjustedOverall,
                                            argumentQuality: score.argumentQuality,
                                            rebuttalStrength: score.rebuttalStrength,
                                            coherence: score.coherence,
                                            persuasiveness: score.persuasiveness,
                                            factuality: score.factuality,
                                        });
                                        deps.qualityCollector?.record({
                                            id: `${sessionId}-score-blind-${p.agentId}-${Date.now()}`,
                                            sessionId,
                                            techniqueId: 'scoring',
                                            timestamp: Date.now(),
                                            eventType: 'SCORE_CHANGED',
                                            round: session.round,
                                            agentId: p.agentId,
                                            payload: {
                                                prior: 0,
                                                posterior: adjustedOverall,
                                                delta: adjustedOverall,
                                                dimension: 'overall',
                                            },
                                        });
                                    }
                                } catch (e) {
                                    LOGGER.warn(
                                        'DebatePhaseHandler',
                                        'Blind evaluation failed, falling back to standard evaluation',
                                        { error: e, sessionId },
                                    );
                                }
                            } else {
                                for (const p of session.participants) {
                                    try {
                                        const chain = getters
                                            .getMemory(sessionId)
                                            .getChain(p.agentId);
                                        const score = deps.evaluator.scoreArguments(
                                            p.agentId,
                                            claims,
                                            chain,
                                        );

                                        if (bayesianEnabled && deps.bayesianJudge) {
                                            deps.bayesianJudge.update(
                                                p.agentId,
                                                score.overall * 2 - 1,
                                            );
                                        }

                                        const driftPenalty = deps.stanceDriftTracker
                                            ? deps.stanceDriftTracker.getDriftPenalty(p.agentId)
                                            : 1.0;

                                        const bayesianAdjusted =
                                            bayesianEnabled && deps.bayesianJudge
                                                ? deps.bayesianJudge.getAdjustedScore(
                                                      p.agentId,
                                                      score.overall,
                                                  )
                                                : score.overall;

                                        const adjustedOverall = bayesianAdjusted * driftPenalty;

                                        deps.eventBus.emit(EVENTS.DEBATE_AGENT_SCORED, {
                                            sessionId,
                                            agentId: p.agentId,
                                            overall: adjustedOverall,
                                            argumentQuality: score.argumentQuality,
                                            rebuttalStrength: score.rebuttalStrength,
                                            coherence: score.coherence,
                                            persuasiveness: score.persuasiveness,
                                            factuality: score.factuality,
                                        });
                                        deps.qualityCollector?.record({
                                            id: `${sessionId}-score-std-${p.agentId}-${Date.now()}`,
                                            sessionId,
                                            techniqueId: 'scoring',
                                            timestamp: Date.now(),
                                            eventType: 'SCORE_CHANGED',
                                            round: session.round,
                                            agentId: p.agentId,
                                            payload: {
                                                prior: 0,
                                                posterior: adjustedOverall,
                                                delta: adjustedOverall,
                                                dimension: 'overall',
                                            },
                                        });
                                    } catch (scoreErr) {
                                        LOGGER.warn(
                                            'DebatePhaseHandler',
                                            'Standard evaluation failed for agent, skipping',
                                            { error: scoreErr, sessionId, agentId: p.agentId },
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
                if (abortSignal?.aborted) {
                    return;
                }
                // DEFENSE: skip saveSnapshot for cancelled/failed — the session's
                // internal data structures (maps, agentStates) may already be destroyed
                // by engine.cancelSession() which runs before the phase transition handler
                // fires. saveSnapshot() calls session.snapshot() which accesses those
                // structures and will crash with undefined/null access.
                if (to === 'failed' || to === 'cancelled' || to === 'completed') {
                    LOGGER.info('DebatePhaseHandler', `Skipping saveSnapshot for ${to}`, {
                        sessionId,
                    });
                } else {
                    getters.saveSnapshot(sessionId).catch((e) => {
                        LOGGER.error(
                            'DebatePhaseHandler',
                            `auto-checkpoint failed during ${from}→${to}`,
                            {
                                error: e,
                                sessionId,
                            },
                        );
                    });
                }
                if (to === 'failed' || to === 'cancelled') {
                    /* terminal — no scoring needed */
                }
            }
        } catch (e) {
            LOGGER.error(
                'DebatePhaseHandler',
                `Unhandled error in phase handler for ${from}→${to}${logSuffix ?? ''}`,
                { error: e, sessionId },
            );
            deps.eventBus.emitOnce(EVENTS.DEBATE_SESSION_FAILED, sessionId, {
                sessionId,
                error: `ScoringError: ${e instanceof Error ? e.message : String(e)}`,
            });
        }
    };
}
