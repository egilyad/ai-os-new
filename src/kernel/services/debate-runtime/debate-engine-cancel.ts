import type { IDebateSession, IDebateBudget } from '../../contracts/debate-runtime';
import type { IEventBus } from '../../types/interfaces';
import type { IDistributedLock } from '../../contracts/cross-tab-lock';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import { cleanupSessionMaps } from './debate-llm-caller';
import { DebateBudget } from './debate-budget';
import { DebateSessionContext } from './debate-session-context';
import { DebateMemory } from './debate-memory';
import { DebateProviderResolver } from './debate-query-engine';

const LOGGER = rootLogger.child('DebateEngine');

export interface CancelContext {
    sessions: Map<string, IDebateSession>;
    budgets: Map<string, IDebateBudget>;
    memories: Map<string, DebateMemory>;
    sessionContexts: Map<string, DebateSessionContext>;
    sessionAbortControllers: Map<string, Map<string, AbortController>>;
    sessionPhaseControllers: Map<string, AbortController>;
    sessionTimeoutTimers: Map<string, ReturnType<typeof setTimeout>>;
    sessionStartTimes: Map<string, number>;
    runningSessions: Set<string>;
    preflightDone: Set<string>;
    _cancelledSessionIds: Set<string>;
    providerResolver: DebateProviderResolver;
    eventBus: IEventBus;
    distributedLock?: IDistributedLock;
}

function cleanupSessionMapsFromCtx(
    sessionId: string,
    ctx: CancelContext,
    session: IDebateSession,
): void {
    ctx._cancelledSessionIds.add(sessionId);
    const budget = ctx.budgets.get(sessionId);
    if (budget) (budget as DebateBudget).destroy();
    ctx.budgets.delete(sessionId);
    const mem = ctx.memories.get(sessionId);
    if (mem) mem.destroy();
    ctx.memories.delete(sessionId);
    const sessCtx = ctx.sessionContexts.get(sessionId);
    if (sessCtx) sessCtx.destroy();
    ctx.sessionContexts.delete(sessionId);
    session.destroy();
    ctx.sessions.delete(sessionId);
    ctx.providerResolver.clearSession(sessionId);
    ctx.preflightDone.delete(sessionId);
    ctx.runningSessions.delete(sessionId);
    const timer = ctx.sessionTimeoutTimers.get(sessionId);
    if (timer) {
        clearTimeout(timer);
        ctx.sessionTimeoutTimers.delete(sessionId);
    }
    ctx.sessionStartTimes.delete(sessionId);
    ctx.sessionPhaseControllers.get(sessionId)?.abort();
    ctx.sessionPhaseControllers.delete(sessionId);
    const abortCtls = ctx.sessionAbortControllers.get(sessionId);
    if (abortCtls) {
        for (const [, c] of abortCtls) c.abort(new Error('SessionCancelled'));
        abortCtls.clear();
    }
    ctx.sessionAbortControllers.delete(sessionId);
    cleanupSessionMaps(sessionId);
    // The orphan cleanup loop has been removed because getContext() now
    // checks _cancelledSessionIds and returns a throwaway context instead
    // of recreating one in the sessionContexts map. Async pipeline events
    // that fire after cleanupMaps will get a minimal context that doesn't
    // persist and has no side effects.
    // RE-CHECK: async pipeline events may recreate sessionAbortControllers
    // after the initial delete above. Schedule a deferred cleanup to catch
    // any leaked entries. This is a defense-in-depth measure — the primary
    // defense is the isSessionCancelled check in debateCallLlm() that
    // prevents NEW calls from creating entries after cancellation.
    queueMicrotask(() => {
        const recreated = ctx.sessionAbortControllers.get(sessionId);
        if (recreated && recreated.size > 0) {
            LOGGER.warn('DebateEngine', 'cleanupMaps re-check caught leaked abort controllers', {
                sessionId,
                count: recreated.size,
            });
            recreated.clear();
            ctx.sessionAbortControllers.delete(sessionId);
        }
    });
}

export function cancelDebateSession(sessionId: string, ctx: CancelContext): void {
    LOGGER.debug('DebateEngine', 'cancelSession ENTER', {
        sessionId,
        hasSession: ctx.sessions.has(sessionId),
        activeSessions: ctx.sessions.size,
    });
    const session = ctx.sessions.get(sessionId);
    if (!session) {
        LOGGER.warn('DebateEngine', 'cancelSession session not found', {
            sessionId,
            sessionsKeys: [...ctx.sessions.keys()],
        });
        return;
    }

    const lockSvc = ctx.distributedLock;
    if (lockSvc) {
        lockSvc
            .acquire(`debate:${sessionId}`, { ttl: 10_000 })
            .then((result) => {
                if (result.lock) {
                    lockSvc
                        .release(result.lock)
                        .catch((err) =>
                            LOGGER.error(
                                'DebateEngine',
                                'Failed to release cancel lock',
                                { sessionId },
                                err,
                            ),
                        );
                }
            })
            .catch((err) =>
                LOGGER.error('DebateEngine', 'Failed to acquire cancel lock', { sessionId }, err),
            );
    }
    LOGGER.debug(
        'DebateEngine',
        `cancelSession phase=${session.phase}, runningSessions=${ctx.runningSessions.size}`,
        { sessionId },
    );

    // Shared cleanup for terminal phases — destroys all engine-internal
    // maps/controllers to prevent memory leaks. Does NOT emit events
    // (the event was already emitted when phase first transitioned).
    const cleanupMaps = () => cleanupSessionMapsFromCtx(sessionId, ctx, session);

    if (session.phase === 'cancelled') {
        LOGGER.debug('DebateEngine', 'cancelSession already cancelled — cleaning up maps', {
            sessionId,
        });
        cleanupMaps();
        LOGGER.debug('DebateEngine', 'cancelSession cleanup done (cancelled path)', {
            sessionId,
            sessionsLeft: ctx.sessions.size,
        });
        return;
    }
    if (session.phase === 'completed' || session.phase === 'failed') {
        LOGGER.debug(
            'DebateEngine',
            `cancelSession terminal phase ${session.phase} — cleaning up maps`,
            { sessionId },
        );
        cleanupMaps();
        LOGGER.debug('DebateEngine', 'cancelSession cleanup done (terminal path)', {
            sessionId,
            sessionsLeft: ctx.sessions.size,
        });
        return;
    }
    // Active phase — abort agents, transition, emit, then clean up maps
    LOGGER.debug('DebateEngine', `cancelSession active phase ${session.phase} — aborting agents`, {
        sessionId,
    });
    const agentControllers = ctx.sessionAbortControllers.get(sessionId);
    if (agentControllers) {
        for (const [, controller] of agentControllers)
            controller.abort(new Error('SessionCancelled'));
        agentControllers.clear();
    }
    ctx.sessionAbortControllers.delete(sessionId);
    // Save orchestrator reference BEFORE cleanupMaps() — ctx.destroy() calls
    // orchestrator.destroy() which removes the session from the `aborted` Set.
    // Without this, the async generator continues yielding events after cancel.
    const sessCtx = ctx.sessionContexts.get(sessionId);
    const orchestrator = sessCtx?.orchestrator;
    orchestrator?.abort(sessionId);
    session.transition('cancelled');
    LOGGER.debug('DebateEngine', `cancelSession transition done, phase=${session.phase}`, {
        sessionId,
    });
    ctx.sessionPhaseControllers.get(sessionId)?.abort();
    ctx.eventBus.emit(EVENTS.DEBATE_SESSION_CANCELLED, { sessionId });
    cleanupMaps();
    // Re-establish abort signal since ctx.destroy() removed it.
    // The async generator may still be running (await in executor), and needs
    // the signal to stop at the next `if (this.aborted.has(sessionId)) return;` check.
    orchestrator?.abort(sessionId);
    LOGGER.debug('DebateEngine', 'cancelSession cleanup done (active path)', {
        sessionId,
        sessionsLeft: ctx.sessions.size,
    });
}

export function cleanupStaleSessions(ctx: CancelContext): void {
    const staleTimeout = 30 * 60 * 1000;
    const now = Date.now();
    for (const [sessionId, session] of ctx.sessions) {
        const snap = session.snapshot();
        if (
            snap.phase === 'completed' ||
            snap.phase === 'failed' ||
            snap.phase === 'cancelled' ||
            snap.phase === 'paused'
        ) {
            if (now - snap.updatedAt > staleTimeout) {
                ctx._cancelledSessionIds.add(sessionId);
                session.destroy();
                ctx.sessions.delete(sessionId);
                const budget = ctx.budgets.get(sessionId);
                if (budget) (budget as DebateBudget).destroy();
                ctx.budgets.delete(sessionId);
                const mem = ctx.memories.get(sessionId);
                if (mem) mem.destroy();
                ctx.memories.delete(sessionId);
                const sessCtx = ctx.sessionContexts.get(sessionId);
                if (sessCtx) sessCtx.destroy();
                ctx.sessionContexts.delete(sessionId);
                ctx.providerResolver.clearSession(sessionId);
                const timer = ctx.sessionTimeoutTimers.get(sessionId);
                if (timer) clearTimeout(timer);
                ctx.sessionTimeoutTimers.delete(sessionId);
                ctx.sessionStartTimes.delete(sessionId);
                ctx.runningSessions.delete(sessionId);
                ctx.preflightDone.delete(sessionId);
                ctx.sessionPhaseControllers.get(sessionId)?.abort();
                ctx.sessionPhaseControllers.delete(sessionId);
                const abortCtls = ctx.sessionAbortControllers.get(sessionId);
                if (abortCtls) {
                    for (const [, c] of abortCtls) c.abort(new Error('cleanup'));
                    abortCtls.clear();
                }
                ctx.sessionAbortControllers.delete(sessionId);
            }
        }
    }
}
