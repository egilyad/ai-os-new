import { getPrompt } from '../prompt-store';
import { DEBATE_MODEL_PRIORITY } from './debate-query-engine';
import { rootLogger } from '../logger-service';
import { sanitizePromptVar } from '../../../shared/utils/sanitize';
import { EVENTS } from '../../events/event-names';
import type { IDebateSession, ParticipantConfig } from '../../contracts/debate-runtime';
import type { DebateArgument, DebateParticipant } from '../../contracts/debate-types';
import { buildDebateSystemContent } from './debate-llm-prompt-context';
import { isValidDebateResponse } from './debate-llm-validation';
import {
    getHeapMB,
    logMemory,
    getMaxRetries,
    MAX_DUPLICATE_REJECTIONS,
    getModelTimeout,
} from './debate-llm-backoff';
import { stripSpeakerPrefix, isCrossAgentDuplicate } from './debate-llm-utils';
import { enrichSuccessfulDebateResponse } from './debate-llm-enrichment';
import { handleDebateCallError, type DebateCallErrorState } from './debate-llm-error-handler';
import type { LlmCallerDeps } from './debate-llm-caller-deps';

export type { LlmCallerDeps } from './debate-llm-caller-deps';
export { cleanupSessionMaps } from './debate-llm-session-maps';
export { estimateConfidence } from './debate-llm-utils';

const LOGGER = rootLogger.child('DebateLlmCaller');

/**
 * B-11: assemble the per-call prompt context (participant display-name map,
 * role-alternating history, prior arguments, and the rich system prompt) so the
 * `debateCallLlm` retry loop stays focused on Resolve → Call → Classify →
 * Retry/Failover orchestration. Pure — reads memory + builds the system content
 * via the existing `buildDebateSystemContent` helper; no retry/abort side effects.
 */
type DebateCallContext = {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    currentName: string;
    systemContent: string;
    entanglementConstraint: Awaited<
        ReturnType<typeof buildDebateSystemContent>
    >['entanglementConstraint'];
    recentSteps: ReturnType<ReturnType<LlmCallerDeps['getMemory']>['getRecentSteps']>;
};

async function buildDebateCallContext(args: {
    session: IDebateSession;
    participant: ParticipantConfig;
    sessionId: string;
    deps: LlmCallerDeps;
    isQ: (id: string) => boolean;
    controller: AbortController;
}): Promise<DebateCallContext> {
    const { session, participant, sessionId, deps, isQ, controller } = args;

    // Build participant display name map — uses human-readable labels from
    // topology nodes, never raw internal nodeIds like "agent-database".
    const topologyLabelById = new Map<string, string>(
        session.topology.nodes.map((n) => [n.id, n.label || n.id]),
    );
    const participantNameMap = new Map<string, string>(
        session.participants.map((p) => {
            const label = topologyLabelById.get(p.nodeId) ?? topologyLabelById.get(p.agentId);
            return [
                p.agentId,
                label && label !== p.agentId ? label : p.role || `Agent ${p.agentId.slice(0, 8)}`,
            ];
        }),
    );
    const currentName = participantNameMap.get(participant.agentId) || participant.agentId;

    const recentSteps = deps.getMemory(sessionId).getRecentSteps(2);
    const historyMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> =
        recentSteps.map((s, i) => ({
            // HIGH-4.1e: Alternate user/assistant roles to prevent 4-agent debate
            // collapsing to 2-party format. Each agent gets its own label in the
            // content prefix, and roles alternate to help the LLM distinguish speakers.
            role:
                s.agentId === participant.agentId
                    ? ('assistant' as const)
                    : i % 2 === 0
                      ? ('user' as const)
                      : ('assistant' as const),
            content: `[${participantNameMap.get(s.agentId) || s.agentId} (${s.agentId === participant.agentId ? 'self' : 'opponent'})]: ${sanitizePromptVar(s.content).slice(0, 800)}`,
        }));

    const mem = deps.getMemory(sessionId);

    // Convert memory steps to DebateArguments for the rich prompt builder
    // Limit to last 50 steps to prevent unbounded memory growth (~50KB per 10 agents × 5 rounds)
    const allSteps = mem.getAllSteps().slice(-50);
    const previousArguments: DebateArgument[] = allSteps.map((s, i) => ({
        id: `${sessionId}-${s.agentId}-${i}`,
        agentId: s.agentId,
        agentName: participantNameMap.get(s.agentId) || s.agentId,
        content: s.content,
        confidence: s.confidence,
        timestamp: s.timestamp,
        round: s.round ?? 1,
        position: (session.participants.find((p) => p.agentId === s.agentId)?.role ||
            'neutral') as DebateArgument['position'],
        role: (session.participants.find((p) => p.agentId === s.agentId)?.role ||
            'neutral') as DebateArgument['role'],
        source: 'llm' as const,
    }));

    // Build participants list for prompt builder
    const allDebateParticipants: DebateParticipant[] = session.participants.map((p) => ({
        id: p.agentId,
        agentId: p.agentId,
        name: participantNameMap.get(p.agentId) || p.agentId,
        role: (p.role || 'neutral') as DebateParticipant['role'],
        systemPrompt: p.systemPrompt,
    }));

    const { systemContent, entanglementConstraint } = await buildDebateSystemContent({
        deps,
        session,
        participant,
        sessionId,
        isQ,
        currentName,
        previousArguments,
        allDebateParticipants,
        mem,
        controller,
    });

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemContent },
        ...historyMessages,
    ];

    return { messages, currentName, systemContent, entanglementConstraint, recentSteps };
}

export async function debateCallLlm(
    sessionId: string,
    session: IDebateSession,
    participant: ParticipantConfig,
    deps: LlmCallerDeps,
    externalSignal?: AbortSignal,
): Promise<string> {
    const keyService = deps.getKeyService();
    const adapterRegistry = deps.getAdapterRegistry();
    let retries = 0;
    let resolvedKey:
        { id: string; key: string; provider: string; availableModels?: string[] } | undefined;
    let modelId = 'auto';
    // DR-4: Reset per-call failure count so previous callLLM failures don't accumulate
    const failKey = deps.providerResolver.providerKey(sessionId, participant.agentId);
    deps.providerResolver.deleteLlmFailureCount(failKey);
    const triedModels = new Set<string>();
    const triedKeys = new Set<string>();
    // Track (provider|model|keyId) combos that produced cross-agent duplicate
    // responses. The resolver consults this set to avoid re-picking the same
    // (provider, model) on a different key — same model = same content = same
    // duplicate. Without this guard, brute-force fallback loops forever.
    const rejectedCombos = new Set<string>();
    let duplicateRejectCount = 0;
    let noProviderSpinCount = 0;
    // Global loop iteration guard: prevents infinite CPU spin when any catch
    // path does `continue` without incrementing retries/noProviderSpinCount.
    // Covers cross-agent duplicate, entanglement, validation, and any future
    // error type that might bypass existing counters.
    let callLlmIterations = 0;
    const MAX_CALL_LLM_ITERATIONS = 50;

    // Quality settings: check if a specific technique is enabled
    // (default: enabled if not explicitly disabled)
    const isQ = (id: string): boolean => session.qualitySettings?.[id] !== false;

    // If session was cancelled by the time this call starts, bail out early.
    // Prevents re-creating sessionAbortControllers after cleanupMaps() deleted
    // them, which would leave a leaked entry in the map.
    if (deps.isSessionCancelled?.(sessionId)) {
        return 'cancelled';
    }

    // Catch-all error boundary: any unexpected error escaping the inner retry
    // loop (line 2092 catch) or the final throw after max retries (line 2392)
    // is caught here, abort controllers are cleaned up, and a normalized Error
    // is re-thrown. Without this, a leaked AbortController entry or raw throw
    // (non-Error) would corrupt subsequent debate rounds.
    try {
        while (retries < getMaxRetries()) {
            callLlmIterations++;
            // Hard safety net: any `continue` path that forgets to increment retries
            // (cross-agent duplicate, entanglement, model fallback, alt key, etc.)
            // will hit this limit and throw instead of spinning forever. 50 iterations
            // gives ample room: 3 retries × ~5 fallback models + alt keys + overhead.
            if (callLlmIterations > MAX_CALL_LLM_ITERATIONS) {
                throw new Error(
                    `callLLM exceeded max iterations (${MAX_CALL_LLM_ITERATIONS}) — infinite loop prevented`,
                );
            }
            // C6: Check cancellation on each retry iteration — the session can be
            // cancelled mid-retry-loop (e.g. another agent errored out, or user hit stop).
            // Without this guard, a cancelled session's abort controller entries get
            // recreated after cleanupMaps() deletes them, causing tiny leaks.
            if (deps.isSessionCancelled?.(sessionId)) {
                return 'cancelled';
            }

            // Merge session-level failed models so cross-agent cache is effective
            // (e.g., Agent A got 413 on llama-3.1-8b-instant → session.markModelFailed →
            //  Agent B skips it without re-trying)
            for (const m of session.failedModels) triedModels.add(m);
            const controller = new AbortController();
            if (!deps.sessionAbortControllers.has(sessionId))
                deps.sessionAbortControllers.set(sessionId, new Map());
            deps.sessionAbortControllers.get(sessionId)!.set(participant.agentId, controller);

            LOGGER.debug('DebateLlmCaller', 'Retry loop iteration', {
                retries,
                participantProvider: participant.provider,
                triedModelsCount: triedModels.size,
                triedKeysCount: triedKeys.size,
                llmFailureCount: deps.providerResolver.getLlmFailureCount(failKey),
            });

            const onExternalAbort = () => controller.abort(new Error('CancelledByUser'));
            if (externalSignal) {
                externalSignal.addEventListener('abort', onExternalAbort, { once: true });
            }

            let timeout: ReturnType<typeof setTimeout> | undefined;
            let modelTimeout = 0;
            let startedAt = 0;

            let cleanupGov: (() => void) | undefined;

            try {
                const resolved = deps.providerResolver.resolveProvider(
                    session,
                    participant,
                    sessionId,
                    triedModels,
                    triedKeys,
                    rejectedCombos,
                );
                if (!resolved) {
                    // Fast-fail: if ALL providers are already dead, skip retry loop
                    const allKeys = keyService.getKeys();
                    const isModelRejected = (provider: string, model: string): boolean => {
                        for (const c of rejectedCombos) {
                            const [p, m] = c.split('|');
                            if (p === provider && m === model) return true;
                        }
                        return false;
                    };
                    const hasUntriedModel = (k: {
                        provider: string;
                        availableModels?: string[];
                    }): boolean => {
                        const priority = DEBATE_MODEL_PRIORITY[k.provider.toLowerCase()] ?? [];
                        const avail = k.availableModels ?? [];
                        const allM = new Set([...priority, ...avail]);
                        if (allM.size === 0) return true;
                        for (const m of allM) {
                            if (!triedModels.has(m) && !isModelRejected(k.provider, m)) return true;
                        }
                        return false;
                    };
                    const anyWorking = allKeys.some(
                        (k) =>
                            k.status === 'active' &&
                            deps.providerResolver.providerCanBeUsed(k.provider, session) &&
                            !deps.providerResolver.isKeyAuthFailed(k.id) &&
                            !triedKeys.has(k.id) &&
                            hasUntriedModel(k),
                    );
                    const fp = Array.from(
                        (session as { _failedProviders?: Set<string> })._failedProviders ?? [],
                    );
                    LOGGER.warn('DebateLlmCaller', 'resolveProvider returned null', {
                        anyWorking,
                        allKeysCount: allKeys.length,
                        failedProviders: fp,
                    });
                    if (!anyWorking) {
                        throw new Error('All LLM providers unavailable — debate cannot proceed');
                    }
                    throw new Error('No available API keys for debate');
                }
                const prevProvider = resolvedKey?.provider;
                resolvedKey = resolved.key;
                modelId = resolved.modelId;
                if (prevProvider && prevProvider !== resolvedKey.provider) {
                    LOGGER.info('DebateLlmCaller', 'PROVIDER SWITCH', {
                        from: prevProvider,
                        to: resolvedKey.provider,
                        model: modelId,
                        agentId: participant.agentId,
                    });
                }

                // Set per-model timeout AFTER modelId is resolved (large models need longer)
                modelTimeout = getModelTimeout(modelId);
                startedAt = performance.now();
                timeout = setTimeout(
                    () => controller.abort(new Error('RequestTimedOut')),
                    modelTimeout,
                );

                const adapter = adapterRegistry.getAdapter(resolvedKey.provider);
                if (!adapter) throw new Error(`No adapter for provider: ${resolvedKey.provider}`);

                // B-11: assemble the per-call prompt context in a dedicated helper so
                // this retry loop stays focused on Resolve → Call → Classify → Retry/Failover.
                const {
                    messages,
                    currentName,
                    systemContent,
                    entanglementConstraint,
                    recentSteps,
                } = await buildDebateCallContext({
                    session,
                    participant,
                    sessionId,
                    deps,
                    isQ,
                    controller,
                });

                const gov = deps.getExecutionGovernor?.();
                let govOp:
                    { complete(): void; fail(e: Error): void; signal: AbortSignal } | undefined;
                if (gov && resolvedKey) {
                    govOp = gov.start({
                        type: 'debate',
                        // Gov budget must exceed the caller's own timeout (getModelTimeout)
                        // by a generous margin so the caller's RequestTimedOut (retried)
                        // normally wins the race — mirroring the HTTP-layer timeout fix.
                        // The gov op is a backstop only for abort propagation failures;
                        // and since onGovAbort now forwards OperationTimedOut, even a gov
                        // win is classified as a retryable timeout, not a turn loss.
                        timeoutMs: getModelTimeout(modelId) + 15000,
                        metadata: {
                            provider: resolvedKey.provider,
                            model: modelId,
                            sessionId,
                            agentId: participant.agentId,
                        },
                    });
                    const onGovAbort = () => {
                        if (controller.signal.aborted) return;
                        // Propagate the governor's actual reason (OperationTimedOut when
                        // the op budget expired) instead of hardcoding CancelledByGovernor.
                        // This lets the caller's isTimeout classification (includes
                        // 'TimedOut') treat a governor budget expiry as a retryable timeout
                        // instead of a no-retry user abort — otherwise the agent silently
                        // loses its turn.
                        controller.abort(
                            govOp!.signal.reason instanceof Error
                                ? govOp!.signal.reason
                                : new Error('CancelledByGovernor'),
                        );
                    };
                    govOp.signal.addEventListener('abort', onGovAbort, { once: true });
                    cleanupGov = () => govOp!.signal.removeEventListener('abort', onGovAbort);
                }

                LOGGER.debug('DebateLlmCaller', 'Calling adapter', {
                    provider: resolvedKey.provider,
                    model: modelId,
                    keyId: resolvedKey?.id?.slice(0, 8) ?? 'unknown',
                    agentId: participant.agentId,
                    msgCount: messages.length,
                    mode: adapter.streamMessage ? 'stream' : 'single',
                });
                const heapBeforeSendMsg = getHeapMB();
                let response: { content: string };
                try {
                    if (adapter.streamMessage) {
                        // P1.20: Real-time token streaming — forward each chunk to the
                        // live store as it is generated, so the user sees the response
                        // instead of waiting 30s+ for the full reply without feedback.
                        let streamed = '';
                        await adapter.streamMessage(
                            messages,
                            modelId,
                            resolvedKey.key,
                            (chunk) => {
                                if (!chunk) return;
                                streamed += chunk;
                                deps.eventBus.emit(EVENTS.DEBATE_AGENT_CHUNK, {
                                    sessionId: session.id,
                                    agentId: participant.agentId,
                                    chunk,
                                });
                            },
                            controller.signal,
                            {
                                cacheScope: {
                                    agentId: participant.agentId,
                                    sessionId: session.id,
                                    role: participant.role,
                                },
                            },
                        );
                        response = { content: streamed };
                    } else {
                        response = await adapter.sendMessage(
                            messages,
                            modelId,
                            resolvedKey.key,
                            controller.signal,
                            {
                                cacheScope: {
                                    agentId: participant.agentId,
                                    sessionId: session.id,
                                    role: participant.role,
                                },
                            },
                        );
                        // Non-streaming adapter (e.g. mock): emit the full response as a
                        // single chunk to preserve the existing live feedback behaviour.
                        deps.eventBus.emit(EVENTS.DEBATE_AGENT_CHUNK, {
                            sessionId: session.id,
                            agentId: participant.agentId,
                            chunk: response.content,
                        });
                    }
                    logMemory(
                        `sendMsg[${participant.agentId.slice(0, 8)}] ${resolvedKey.provider}/${modelId}`,
                        heapBeforeSendMsg,
                    );
                    LOGGER.debug('DebateLlmCaller', 'adapter call OK', {
                        provider: resolvedKey.provider,
                        model: modelId,
                        contentLen: response.content?.length,
                    });
                } catch (e) {
                    LOGGER.debug('DebateLlmCaller', 'adapter call FAILED', {
                        provider: resolvedKey.provider,
                        model: modelId,
                        error: e instanceof Error ? e.message : String(e),
                    });
                    govOp?.fail(e instanceof Error ? e : new Error(String(e)));
                    throw e;
                }
                govOp?.complete();
                cleanupGov?.();

                // Strip speaker label prefix — agents sometimes copy the history
                // format `[Name (self/opponent)]: content` with wrong speaker name.
                const filtered = stripSpeakerPrefix(response.content);
                let content = filtered || response.content;

                // Cross-agent duplicate check — reject content copied verbatim
                // from other agents' recent responses.
                if (isCrossAgentDuplicate(content, recentSteps, participant.agentId)) {
                    duplicateRejectCount++;
                    LOGGER.warn('DebateLlmCaller', 'Response rejected — cross-agent duplicate', {
                        agentId: participant.agentId,
                        provider: resolvedKey?.provider,
                        model: modelId,
                        keyId: resolvedKey?.id?.slice(0, 8),
                        rejectCount: duplicateRejectCount,
                        maxRejects: MAX_DUPLICATE_REJECTIONS,
                        preview: content.slice(0, 120),
                    });
                    if (resolvedKey) {
                        triedModels.add(modelId);
                        triedKeys.add(resolvedKey.id);
                        // Mark this exact (provider, model, key) combo as rejected so
                        // the resolver skips it on the next retry. Same model on a
                        // different key would produce the same content — we mark the
                        // (provider, model) pair as rejected across all keys via the
                        // wildcard combo `${provider}|${model}|*`. The resolver's
                        // isModelRejectedAnyKey() matches this regardless of keyId.
                        rejectedCombos.add(`${resolvedKey.provider}|${modelId}|${resolvedKey.id}`);
                        rejectedCombos.add(`${resolvedKey.provider}|${modelId}|*`);
                    }
                    // Bail out cleanly if the LLM cluster is producing pathological
                    // duplicates — better to fail loudly than spin forever. The
                    // engine handles the error by skipping this argument and moving
                    // on to the next agent.
                    if (duplicateRejectCount >= MAX_DUPLICATE_REJECTIONS) {
                        throw new Error(
                            `Cross-agent duplicate produced ${duplicateRejectCount} times consecutively — aborting callLLM (provider=${resolvedKey?.provider}, model=${modelId})`,
                        );
                    }
                    // Note: do NOT call session.markProviderFailed() here. A cross-
                    // agent duplicate is a content-level failure, not a provider
                    // failure. Marking the provider as failed would prevent ALL
                    // other agents from using it for the rest of the session.
                    throw new Error('Response validation failed: cross-agent duplicate');
                }

                // Validate response — reject instruction leakage, meta-commentary,
                // and empty/vacuous responses. This prevents the cascade failure
                // where one agent's broken output poisons the context for others.
                const validation = isValidDebateResponse(content);
                if (!validation.valid) {
                    LOGGER.warn('DebateLlmCaller', 'Response rejected by validation', {
                        agentId: participant.agentId,
                        provider: resolvedKey?.provider,
                        model: modelId,
                        reason: validation.reason,
                        preview: content.slice(0, 120),
                    });
                    // Throw so the catch block retries via fallback logic
                    if (resolvedKey) {
                        triedModels.add(modelId);
                        triedKeys.add(resolvedKey.id);
                        rejectedCombos.add(`${resolvedKey.provider}|${modelId}|${resolvedKey.id}`);
                        rejectedCombos.add(`${resolvedKey.provider}|${modelId}|*`);
                    }
                    throw new Error(`Response validation failed: ${validation.reason}`);
                }

                // P0.1: Validate entanglement — check if agent actually engaged with target claim
                if (entanglementConstraint && deps.entanglementEngine) {
                    try {
                        const entResult = deps.entanglementEngine.validateEntanglement(
                            content,
                            entanglementConstraint,
                        );
                        if (!entResult.engaged) {
                            LOGGER.warn(
                                'DebateLlmCaller',
                                'Response rejected — entanglement validation',
                                {
                                    agentId: participant.agentId,
                                    reason: entResult.reason,
                                    targetAgent: entanglementConstraint.opponentName,
                                },
                            );
                            if (resolvedKey) {
                                triedModels.add(modelId);
                                triedKeys.add(resolvedKey.id);
                                rejectedCombos.add(
                                    `${resolvedKey.provider}|${modelId}|${resolvedKey.id}`,
                                );
                                rejectedCombos.add(`${resolvedKey.provider}|${modelId}|*`);
                            }
                            throw new Error(`Entanglement validation failed: ${entResult.reason}`);
                        }
                    } catch (e) {
                        // Re-throw if it's already an Error (our validation throw)
                        if (
                            e instanceof Error &&
                            e.message.startsWith('Entanglement validation failed')
                        ) {
                            throw e;
                        }
                        LOGGER.warn('DebateLlmCaller', 'Entanglement validation error', {
                            agentId: participant.agentId,
                            error: String(e),
                        });
                    }
                }

                deps.qualityCollector?.record({
                    id: `${sessionId}-arg-${participant.agentId}-${Date.now()}`,
                    sessionId,
                    techniqueId: 'response-features',
                    timestamp: Date.now(),
                    eventType: 'ARGUMENT_FEATURE',
                    round: session.round,
                    agentId: participant.agentId,
                    payload: {
                        feature: 'responseLength',
                        detected: true,
                        strength: Math.min(content.length / 1000, 1),
                    },
                });

                deps.providerResolver.deleteLlmFailureCount(failKey);

                LOGGER.debug('DebateEngine', 'ENGINE_MODEL', {
                    agent: participant.agentId,
                    provider: resolvedKey.provider,
                    model: modelId,
                });

                // B-11: post-success enrichment (recordUsage + shadow-opponent +
                // redundancy + drift + RToM + causal-graph) extracted to keep this
                // retry loop focused on Resolve → Call → Classify → Retry/Failover.
                content = await enrichSuccessfulDebateResponse({
                    sessionId,
                    session,
                    participant,
                    deps,
                    content,
                    systemContent,
                    currentName,
                    modelId,
                    resolvedKey,
                    adapter,
                    controller,
                    isQ,
                });

                clearTimeout(timeout);
                deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
                if (externalSignal) {
                    externalSignal.removeEventListener('abort', onExternalAbort);
                }
                return content;
            } catch (e) {
                if (timeout !== undefined) clearTimeout(timeout);
                if (externalSignal) {
                    externalSignal.removeEventListener('abort', onExternalAbort);
                }
                cleanupGov?.();
                // B-11: the entire classification / failover block extracted into a
                // typed `DebateCallErrorHandler` (debate-llm-error-handler.ts) over an
                // explicit loop-state object. Behavior is preserved exactly: every
                // `continue` / `throw` branch maps to `{ kind: 'continue' }` /
                // `{ kind: 'throw', error }`, the handler mutates `retries` /
                // `noProviderSpinCount` and we copy them back out before continuing.
                const errorState: DebateCallErrorState = {
                    sessionId,
                    session,
                    participant,
                    deps,
                    resolvedKey,
                    modelId,
                    controller,
                    externalSignal,
                    startedAt,
                    modelTimeout,
                    retries,
                    triedModels,
                    triedKeys,
                    rejectedCombos,
                    noProviderSpinCount,
                    failKey,
                };
                const r = await handleDebateCallError(e, errorState);
                retries = errorState.retries;
                noProviderSpinCount = errorState.noProviderSpinCount;
                if (r.kind === 'throw') throw r.error;
                continue;
            }
        }

        deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
        deps.deadLetterQueue
            ?.push({
                event: 'debate:llm_max_retries',
                payload: { sessionId, agentId: participant.agentId },
                error: 'LLM call failed after max retries',
                context: { retries },
                retryCount: retries,
            })
            .catch((err) => LOGGER.error('DebateLlmCaller', 'DLQ push failed', err));
        throw new Error('LLM call failed after max retries');
    } catch (outerErr) {
        // Catch-all error boundary: clean up abort controllers and normalize.
        // Any error that escapes both the retry loop and the inner catch is caught
        // here to prevent leaked AbortController entries and raw throw values.
        deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
        if (externalSignal) {
            // best-effort: listener already added via { once: true } in inner loops
        }
        LOGGER.error('DebateLlmCaller', 'debateCallLlm unhandled error', {
            sessionId,
            agentId: participant.agentId,
            error: outerErr instanceof Error ? outerErr.message : String(outerErr),
        });
        throw outerErr instanceof Error ? outerErr : new Error(String(outerErr));
    }
}

export async function debateGetDefaultPrompt(
    nodeId: string,
    session: IDebateSession,
): Promise<string> {
    const node = session.topology.nodes.find((n) => n.id === nodeId);
    return (await getPrompt(node?.role)) + `\nRespond in ${session.language}.`;
}
