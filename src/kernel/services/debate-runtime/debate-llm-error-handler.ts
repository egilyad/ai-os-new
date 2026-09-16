import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import type { IDebateSession, ParticipantConfig } from '../../contracts/debate-runtime';
import type { LlmCallerDeps } from './debate-llm-caller-deps';
import type { ResolvedDebateKey } from './debate-llm-enrichment';
import { getAllModelsForProvider } from './debate-query-engine';
import {
    getDebateTimeoutMs,
    getBaseBackoffMs,
    getMaxBackoffMs,
    getMaxRetries,
    backoffWait,
} from './debate-llm-backoff';
import { classifyLlmError } from './debate-llm-errors';

const LOGGER = rootLogger.child('DebateLlmErrorHandler');

/**
 * B-11: the error-classification / failover block extracted out of the
 * `debateCallLlm` retry loop. Pure orchestration over an explicit loop-state
 * object — every branch preserves the original control flow exactly:
 *   - `continue`  → `{ kind: 'continue' }`
 *   - `throw err` → `{ kind: 'throw', error: err }`
 * The caller copies the mutated `retries` / `noProviderSpinCount` back out of
 * `state` and either re-throws or `continue`s the retry loop. No behavior change:
 * same branch order, same side effects (markProviderFailed / markModelFailed /
 * deadLetterQueue / eventBus emits / awaited backoffWait), same log paths.
 */
export interface DebateCallErrorState {
    sessionId: string;
    session: IDebateSession;
    participant: ParticipantConfig;
    deps: LlmCallerDeps;
    resolvedKey: ResolvedDebateKey | undefined;
    modelId: string;
    controller: AbortController;
    externalSignal?: AbortSignal;
    startedAt: number | undefined;
    modelTimeout: number | undefined;
    retries: number;
    triedModels: Set<string>;
    triedKeys: Set<string>;
    rejectedCombos: Set<string>;
    noProviderSpinCount: number;
    failKey: string;
    cleanupGov?: () => void;
}

export type DebateCallErrorAction = { kind: 'continue' } | { kind: 'throw'; error: Error };

export async function handleDebateCallError(
    e: unknown,
    state: DebateCallErrorState,
): Promise<DebateCallErrorAction> {
    const { sessionId, session, participant, deps } = state;
    const keyService = deps.getKeyService();
    const error = String(e);
    const isAbortError = e instanceof DOMException && e.name === 'AbortError';
    const abortReason = isAbortError
        ? state.controller.signal.reason instanceof Error
            ? state.controller.signal.reason.message
            : 'Aborted'
        : '';
    // B-12: classify the raw adapter/guard error into a stable LlmError code ONCE.
    // Previously the caller re-derived the same classification by fragile string
    // matching in four places (timeout / auth / payment / rate). The magic strings
    // now live ONLY in classifyLlmError; `classified.code` is the single source of
    // truth for the failover branching below. This also covers G-01 (governor
    // OperationTimedOut) and G-02 (SSE idle timeout) as retryable TIMEOUT.
    const errSc = (e as { statusCode?: number }).statusCode;
    const classified = classifyLlmError(e, {
        statusCode: errSc,
        isAbortError,
        abortReason,
        errorString: error,
    });
    const isTimeout = classified.code === 'TIMEOUT';
    // Fast-fail: if all providers are dead, skip retry loop entirely
    if (error.includes('All LLM providers unavailable')) {
        deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
        return { kind: 'throw', error: new Error(error, { cause: e }) };
    }

    if (isAbortError && isTimeout) {
        const elapsed =
            state.startedAt !== undefined ? (performance.now() - state.startedAt).toFixed(0) : '?';
        LOGGER.warn('DebateLlmErrorHandler', `Request timed out after ${elapsed}ms`, {
            provider: state.resolvedKey?.provider ?? 'unknown',
            model: state.modelId,
            timeoutMs: state.modelTimeout ?? 0,
            elapsedMs:
                state.startedAt !== undefined
                    ? Math.round(performance.now() - state.startedAt)
                    : -1,
            agentId: participant.agentId,
            sessionId,
        });
    }

    // Non-timeout aborts (CancelledByUser, SessionPaused, CancelledByGovernor):
    // surface immediately without retry
    if (isAbortError && !isTimeout) {
        deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
        const reason = abortReason || 'Aborted';
        return {
            kind: 'throw',
            error: new Error(`Debate LLM call ${reason}`, { cause: e }),
        };
    }

    // Try fallback models for the same provider before marking it as failed
    if (state.resolvedKey) {
        // B-12: `errSc` is still needed for the 413/404 model-level handlers
        // below; the auth/payment/rate classification now comes from the single
        // `classified.code` computed once above.
        const isPaymentRequired = classified.code === 'PAYMENT_REQUIRED';
        const isAuthError = classified.code === 'AUTH';
        const isRateLimit = classified.code === 'RATE_LIMIT';

        state.triedModels.add(state.modelId);
        state.triedKeys.add(state.resolvedKey.id);

        if (isPaymentRequired) {
            // 402 is permanent auth failure — mark immediately and move on
            LOGGER.warn(
                'DebateLlmErrorHandler',
                `Provider payment required (402): ${state.resolvedKey.provider}`,
                {
                    agentId: participant.agentId,
                    model: state.modelId,
                },
            );
            const kss = deps.getKeyStateStore?.();
            if (kss) {
                try {
                    kss.update(state.resolvedKey.id, { flags: { authFailed: true } });
                } catch {
                    /* best-effort */
                }
            }
            session.markProviderFailed(state.resolvedKey.provider);
            deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
            return { kind: 'continue' };
        }

        if (isAuthError) {
            // Auth failure (401/403/400-API-key-not-valid) is permanent for the
            // key — mark authFailed so routing excludes it, and mark the provider
            // failed for this session. Otherwise the same bad key is re-picked and
            // re-fails every turn.
            LOGGER.warn(
                'DebateLlmErrorHandler',
                `Provider auth error: ${state.resolvedKey.provider}`,
                {
                    agentId: participant.agentId,
                    model: state.modelId,
                    errSc,
                },
            );
            const kss = deps.getKeyStateStore?.();
            if (kss) {
                try {
                    kss.update(state.resolvedKey.id, { flags: { authFailed: true } });
                } catch {
                    /* best-effort */
                }
            }
            session.markProviderFailed(state.resolvedKey.provider);
            deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
            return { kind: 'continue' };
        }

        // 413 Payload Too Large — model context window exceeded (common on Groq
        // llama-3.1-8b-instant free tier ~4K context). Mark the model at session
        // level so ALL agents skip it, but DON'T mark the provider as failed
        // (different models on the same provider may work fine).
        if (errSc === 413) {
            // Groq returns 413 for TPM rate limits ("rate_limit_exceeded",
            // "tokens per minute") IN ADDITION to context overflow. TPM is
            // transient (refills ~60s) — don't permanently kill a good model;
            // context overflow is permanent → mark the model failed so ALL
            // agents skip it.
            const isTpmRateLimit =
                error.includes('rate_limit_exceeded') || error.includes('tokens per minute');
            if (isTpmRateLimit) {
                LOGGER.warn(
                    'DebateLlmErrorHandler',
                    `Model 413 TPM rate limited (transient): ${state.modelId}`,
                    {
                        agentId: participant.agentId,
                        provider: state.resolvedKey.provider,
                        sessionId,
                    },
                );
                // Fall through to the transient rate-limit backoff below —
                // the model stays available for later rounds.
            } else {
                session.markModelFailed(state.modelId);
                LOGGER.warn(
                    'DebateLlmErrorHandler',
                    `Model 413 (context exceeded): ${state.modelId}`,
                    {
                        agentId: participant.agentId,
                        provider: state.resolvedKey.provider,
                        sessionId,
                    },
                );
                deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
                return { kind: 'continue' };
            }
        }

        // 404 model_not_found — the model doesn't exist on this provider/API
        // (e.g. gemini-3.1-flash 404s via the v1beta generateContent API).
        // Mark the model failed at session level so ALL agents skip it instead
        // of burning a turn on it every round.
        if (
            errSc === 404 ||
            error.includes('model_not_found') ||
            error.includes('is not found for API version') ||
            error.includes('not supported for generateContent')
        ) {
            session.markModelFailed(state.modelId);
            LOGGER.warn('DebateLlmErrorHandler', `Model 404 (not found): ${state.modelId}`, {
                agentId: participant.agentId,
                provider: state.resolvedKey.provider,
                sessionId,
            });
            deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
            return { kind: 'continue' };
        }

        // DEATH SPIRAL GUARD: HALF-OPEN circuit breaker means the entire provider
        // is degraded — only 1 concurrent test request allowed. Don't waste time
        // trying model fallbacks or alt keys for the same provider; skip it now.
        if (error.includes('HALF-OPEN')) {
            LOGGER.warn(
                'DebateLlmErrorHandler',
                `Provider circuit HALF-OPEN — skipping: ${state.resolvedKey.provider}`,
                {
                    agentId: participant.agentId,
                    model: state.modelId,
                },
            );
            session.markProviderFailed(state.resolvedKey.provider);
            deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
            return { kind: 'continue' };
        }

        // Try same-provider model fallback (e.g., 70B → 8B)
        const allProviderModels = getAllModelsForProvider(state.resolvedKey);
        const untried = allProviderModels.filter((m) => !state.triedModels.has(m));
        if (untried.length > 0 && !isTimeout) {
            deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
            return { kind: 'continue' };
        }

        // Try alternative keys for same provider.
        // CRITICAL: do NOT call triedModels.clear() here. Same model on a
        // different key produces the same content (especially for cross-agent
        // duplicate cases where the model is generating the same boilerplate
        // regardless of API key). The dedup memory must survive key switches
        // — clearing it allows brute-force to re-pick a tried model and
        // re-trigger the same duplicate, looping forever.
        // The resolver consults rejectedCombos to skip bad (provider,model)
        // pairs, so the alt key's resolveProvider will fall through to a
        // different model on the same provider, or to Step 6 brute-force
        // for a fresh provider.
        const allKeys = keyService.getKeys();
        const altKey = allKeys.find(
            (k) =>
                k.provider === state.resolvedKey!.provider &&
                !state.triedKeys.has(k.id) &&
                k.status === 'active' &&
                !deps.providerResolver.isKeyAuthFailed(k.id),
        );
        if (altKey) {
            deps.eventBus.emit(EVENTS.DEBATE_AGENT_FALLBACK, {
                sessionId,
                agentId: participant.agentId,
                fromProvider: state.resolvedKey!.provider,
                toProvider: altKey.provider,
            });
            // Intentionally NOT clearing triedModels/rejectedCombos here —
            // see comment above. The resolver uses these to pick a fresh
            // model on the alt key, or escalate to Step 6 if the entire
            // provider is exhausted.
            deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
            return { kind: 'continue' };
        }

        // 429 is transient — don't permanently mark the provider as failed.
        // The circuit breaker handles backoff timing; providerCanBeUsed will
        // skip it while the circuit is open and allow retry when it closes.
        if (isRateLimit) {
            const rateBackoff = Math.min(
                getBaseBackoffMs() * Math.pow(2, state.retries),
                getMaxBackoffMs(),
            );
            // Add ±25% jitter to prevent thundering herd
            const jitter = rateBackoff * (0.75 + Math.random() * 0.5);
            LOGGER.warn(
                'DebateLlmErrorHandler',
                `Provider rate-limited (429): ${state.resolvedKey.provider}`,
                {
                    agentId: participant.agentId,
                    model: state.modelId,
                    backoffMs: Math.round(jitter),
                },
            );
            deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
            let _rlOnAbort: (() => void) | undefined;
            await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(resolve, jitter);
                _rlOnAbort = () => {
                    clearTimeout(timer);
                    reject(new Error('Debate cancelled during backoff'));
                };
                if (state.externalSignal)
                    state.externalSignal.addEventListener('abort', _rlOnAbort, { once: true });
            });
            if (state.externalSignal && _rlOnAbort)
                state.externalSignal.removeEventListener('abort', _rlOnAbort);
            return { kind: 'continue' };
        }

        // When resolveProvider returned null ("No available API keys"), the
        // previous resolvedKey is stale — the provider itself isn't the problem,
        // all its models are just exhausted. Don't mark it as failed; just retry.
        // But guard against infinite spin: if all providers are truly exhausted
        // for this agent, break out after MAX_NO_PROVIDER_SPIN attempts.
        if (
            error.includes('No available API keys') ||
            error.includes('All LLM providers unavailable')
        ) {
            state.noProviderSpinCount++;
            // Mark ALL keys of this provider as tried so unused keys don't
            // keep getting resolved by Step 1 only to fail at model selection
            // (e.g. 3rd groq key with all models globally rejected via * wildcards).
            if (state.resolvedKey) {
                const allKeysForProvider = keyService.getKeys();
                for (const k of allKeysForProvider) {
                    if (k.provider === state.resolvedKey.provider) state.triedKeys.add(k.id);
                }
            }
            if (state.noProviderSpinCount >= 5) {
                deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
                return {
                    kind: 'throw',
                    error: new Error(
                        'No available API keys after retries — debate cannot proceed for this agent',
                        { cause: e },
                    ),
                };
            }
            // When all models are exhausted via rejectedCombos wildcards
            // (e.g. cross-agent duplicate on the only working model),
            // clear the content-rejection state so the working model can
            // be retried. Without this, a single-provider setup with
            // cross-agent duplicates would never retry the only working
            // combo — every resolveProvider() would return null because
            // every model's wildcard entry blocks it.
            // The noProviderSpinCount guard (max 5) prevents infinite spin.
            const wildcards = Array.from(state.rejectedCombos).filter((c) => c.endsWith('|*'));
            for (const c of wildcards) {
                const model = c.split('|')[1];
                state.triedModels.delete(model!);
                state.rejectedCombos.delete(c);
            }
            // Also clear triedKeys — all provider keys were added above
            // (line ~2424), so without this, resolveProvider still returns
            // null even after clearing wildcards, because every key is in
            // triedKeys. Clearing allows retrying the same keys with now-
            // unblocked models on the next iteration.
            state.triedKeys.clear();
            await backoffWait(state.noProviderSpinCount, state.externalSignal);
            deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
            return { kind: 'continue' };
        }
        if (!state.resolvedKey) {
            deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
            return { kind: 'continue' };
        }
        // Content-level failures (validation, entanglement, consecutive
        // duplicates) reflect model output quality — not provider availability.
        // Don't mark the entire provider as failed; retry with a different
        // model/provider instead.
        if (
            error.includes('Response validation failed') ||
            error.includes('Entanglement validation failed') ||
            error.includes('Cross-agent duplicate produced')
        ) {
            deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
            return { kind: 'continue' };
        }
        session.markProviderFailed(state.resolvedKey.provider);
        LOGGER.warn('DebateLlmErrorHandler', `Provider failed: ${state.resolvedKey.provider}`, {
            agentId: participant.agentId,
            model: state.modelId,
            error: String(e).slice(0, 100),
            failedProviders: Array.from(
                (session as { _failedProviders?: Set<string> })._failedProviders ?? [],
            ),
        });
        // Fast-fail: check if ALL providers are now dead — no point retrying
        const allKeysAfter = keyService.getKeys();
        const anyWorkingAfter = allKeysAfter.some(
            (k) =>
                k.status === 'active' &&
                !session.hasProviderFailed(k.provider) &&
                !deps.providerResolver.isKeyAuthFailed(k.id),
        );
        if (!anyWorkingAfter) {
            LOGGER.error('DebateLlmErrorHandler', 'ALL providers dead — aborting', {
                failedProviders: Array.from(
                    (session as { _failedProviders?: Set<string> })._failedProviders ?? [],
                ),
            });
            deps.deadLetterQueue
                ?.push({
                    event: 'debate:all_providers_dead',
                    payload: {
                        sessionId,
                        agentId: participant.agentId,
                        provider: state.resolvedKey?.provider,
                    },
                    error: String(e).slice(0, 500),
                    context: {
                        failedProviders: Array.from(
                            (session as { _failedProviders?: Set<string> })._failedProviders ?? [],
                        ),
                    },
                    retryCount: state.retries,
                })
                .catch((err) => LOGGER.error('DebateLlmErrorHandler', 'DLQ push failed', err));
            return {
                kind: 'throw',
                error: new Error('All LLM providers unavailable — debate cannot proceed', {
                    cause: e,
                }),
            };
        }
    }

    if (isTimeout) {
        deps.eventBus.emit(EVENTS.DEBATE_AGENT_TIMEOUT, {
            sessionId,
            agentId: participant.agentId,
            timeoutMs: getDebateTimeoutMs(),
        });
        state.retries++;
        if (state.retries >= getMaxRetries()) {
            deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
            if (state.resolvedKey)
                keyService.recordUsage(state.resolvedKey.id, 0, 0, state.modelId, {
                    failed: true,
                    error: 'LLM call timed out',
                    task: 'debate',
                    round: session.round,
                });
            deps.deadLetterQueue
                ?.push({
                    event: 'debate:llm_timeout',
                    payload: {
                        sessionId,
                        agentId: participant.agentId,
                        model: state.modelId,
                        provider: state.resolvedKey?.provider,
                    },
                    error: 'LLM call timed out',
                    context: { retries: state.retries },
                    retryCount: state.retries,
                })
                .catch((err) => LOGGER.error('DebateLlmErrorHandler', 'DLQ push failed', err));
            return {
                kind: 'throw',
                error: new Error('LLM call timed out', { cause: e }),
            };
        }
        await backoffWait(state.retries, state.externalSignal);
        return { kind: 'continue' };
    }

    const count = deps.providerResolver.incrementLlmFailureCount(state.failKey);

    if (count <= getMaxRetries()) {
        await backoffWait(count, state.externalSignal);
        return { kind: 'continue' };
    }

    deps.sessionAbortControllers.get(sessionId)?.delete(participant.agentId);
    if (state.resolvedKey)
        keyService.recordUsage(state.resolvedKey.id, 0, 0, state.modelId, {
            failed: true,
            error,
            task: 'debate',
            round: session.round,
        });
    deps.deadLetterQueue
        ?.push({
            event: 'debate:llm_failure',
            payload: {
                sessionId,
                agentId: participant.agentId,
                provider: state.resolvedKey?.provider,
                model: state.modelId,
            },
            error: String(error).slice(0, 500),
            context: { retries: state.retries, round: session.round },
            retryCount: count,
        })
        .catch((err) => LOGGER.error('DebateLlmErrorHandler', 'DLQ push failed', err));
    return { kind: 'throw', error: new Error(error, { cause: e }) };
}
