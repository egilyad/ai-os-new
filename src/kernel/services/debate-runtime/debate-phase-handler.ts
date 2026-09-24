import type { IEventBus } from '../../types/interfaces';

// Ленивый require для разрыва циклов: tsconfig app без node-типов.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Node require shim for lazy cycle-safe registration
declare const require: (id: string) => any;
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
import type { IArgTechService } from '../../contracts/debateplus';

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
    argTech?: IArgTechService;
    consensusEngine?: import('./debate-consensus').DebateConsensusEngine;
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

            // N4b: completed → scoring + finalize, paused → interim scoring (persist, no finalize), failed/cancelled unchanged
            const isCompleted = to === 'completed';
            const isPaused = to === 'paused';
            const isFailedOrCancelled = to === 'failed' || to === 'cancelled';
            if (isCompleted || isFailedOrCancelled || isPaused) {
                // Emit terminal events only for completed/failed/cancelled — paused has its own DEBATE_SESSION_PAUSED (engine emits)
                if (!isPaused) {
                    deps.eventBus.emit(
                        isCompleted
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
                }
                // N4b: common scoring path (completed + early-exit via completed + paused interim) — avoid double scoring, no new runtime
                const shouldScore = isCompleted || isPaused;
                // For early-exit, pipeline continues to completed (so scoring via completed, not duplicate)
                if (shouldScore) {
                    const tl = getters.getTimeline(sessionId);

                    if (deps.memoryExtractor) {
                        const extracted = deps.memoryExtractor.extractFromTimeline(sessionId, tl);
                        LOGGER.info(
                            'DebatePhaseHandler',
                            `Memory extraction complete${logSuffix ?? ''} (${to})`,
                            {
                                sessionId,
                                units: extracted.units.length,
                                ...extracted.summary,
                            },
                        );

                        if (deps.evaluator) {
                            // N1: ArgTech → Consensus wiring (existing bridge, no new runtime) — fire-and-forget bounded
                            if (deps.argTech) {
                                try {
                                    const { applyArgTechToConsensus } = require('../debateplus/argtech-consensus-bridge') as typeof import('../debateplus/argtech-consensus-bridge');
                                    // Fire-and-forget: sets setArgTechBonus on DebateConsensusEngine (cache invalidated) for this evaluate
                                    void applyArgTechToConsensus(deps.evaluator as unknown as import('./debate-consensus').DebateConsensusEngine, deps.argTech).catch(() => {});
                                } catch { /* bridge optional */ }
                            }
                            // N4a: explicit sessionId — no globalThis (J-3 fix)
                            (deps.evaluator as unknown as { setCurrentSessionId?: (id: string | null) => void }).setCurrentSessionId?.(sessionId);
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
                                        // clear thread-local after first use? Keep for all participants in this evaluation batch
                                        // will be cleared at end of block

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
                            // N3: correlation Consensus confidence ↔ Evaluator overall + factuality via QualityCollector (existing canonical boundary, no global, no new score)
                            if (deps.qualityCollector) {
                                try {
                                    const consensusEngine = deps.consensusEngine ?? new (require('./debate-consensus').DebateConsensusEngine)();
                                    const consensusForCorrelation = consensusEngine.evaluate(claims);
                                    // For paused: record interim correlation (not finalize), for completed: same (finalize after)
                                    const isPausedCorrelation = isPaused;
                                    // Record attribution: consensus confidence + evaluator scores (factuality already in evaluator)
                                    deps.qualityCollector.record({
                                        id: `${sessionId}-judging-correlation-${Date.now()}-${isPaused ? 'paused' : 'completed'}`,
                                        sessionId,
                                        techniqueId: isPausedCorrelation ? 'judging-correlation-interim' : 'judging-correlation',
                                        timestamp: Date.now(),
                                        eventType: 'SCORE_CHANGED',
                                        round: session.round,
                                        agentId: 'system',
                                        payload: {
                                            prior: consensusForCorrelation.confidence,
                                            posterior: consensusForCorrelation.confidence, // correlation, not new score
                                            delta: 0,
                                            dimension: 'consensus-evaluator-correlation',
                                            // attribution: keep both signals without merging into third score
                                            consensusConfidence: consensusForCorrelation.confidence,
                                            contradictionDensity: consensusForCorrelation.contradictionDensity,
                                            unresolvedCount: consensusForCorrelation.unresolved.length,
                                            // evaluator overall avg is already in qualityCollector via SCORE_CHANGED per agent above
                                        },
                                    });
                                } catch { /* correlation best-effort, no new score */ }
                            }
                            // N4b: completed → scoring + finalizeSession (Engine-only path was missing Q-01), paused → interim scoring, without finalize
                            // Guard against double scoring early-exit → completed (completed fires once per StateMachine, but paused→resume→completed is interim+final, intended)
                            if (isCompleted && deps.qualityCollector) {
                                try {
                                    const snap = session.snapshot();
                                    void deps.qualityCollector.finalizeSession(sessionId, {
                                        enabledTechniques: [],
                                        topic: snap.topic,
                                        strategy: 'debate',
                                        participantCount: session.participants.length,
                                        roundCount: session.round,
                                        totalTokens: snap.totalTokens ?? 0,
                                        durationMs: Date.now() - snap.startedAt,
                                    }).catch(() => {});
                                } catch { /* finalize best-effort */ }
                            }
                            // clear explicit sessionId (for CouncilAware)
                            try { (deps.evaluator as unknown as { setCurrentSessionId?: (id: string | null) => void }).setCurrentSessionId?.(null); } catch { /* ignore */ }
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
