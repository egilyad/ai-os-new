import { EVENTS } from '../../events/event-names';
import { DebateInterpreter } from './debate-interpreter';
import {
    computeGraphMetrics,
    computeActivityMetrics,
    computeQualityMetrics,
} from './debate-metrics';
import type { DebateSession } from '../../contracts/debate-types';
import type { IEventBus } from '../../types/interfaces';

export interface FinalizerDeps {
    interpreter: DebateInterpreter;
    eventBus: IEventBus;
}

const ACTIVE_STATUSES = new Set(['active', 'deliberating', 'consensus', 'summarizing']);

export function finalizeDebateState(session: DebateSession, deps: FinalizerDeps): void {
    if (ACTIVE_STATUSES.has(session.status)) {
        session.status = 'completed';
    }
    const metrics = computeGraphMetrics(session.arguments, session.strategy);
    if (metrics) session.graphMetrics = metrics;
    const activity = computeActivityMetrics(session.arguments, session.participants);
    if (activity) session.activityMetrics = activity;
    const quality = computeQualityMetrics(session.arguments, session.topic);
    if (quality) session.qualityMetrics = quality;
    session.interpretation = deps.interpreter.interpret(session);
}

export function emitFinalizeEvents(session: DebateSession, deps: FinalizerDeps): void {
    deps.eventBus.emitOnce(EVENTS.DEBATE_UPDATED, session.id, session);
    deps.eventBus.emit(EVENTS.DEBATE_ENDED, {
        sessionId: session.id,
        topic: session.topic,
        rounds: session.currentRound,
        durationMs: Date.now() - session.createdAt,
        consensus: session.consensus,
    });
}
