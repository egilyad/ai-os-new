import type { ILLMClientService, AdapterMessage } from '../contracts/provider-adapter';
import type { ChatResponse, QueuedRequest } from '../types/chat-types';
import { EVENTS } from '../events/event-names';
import { CONFIG } from './config-registry';
import { LLMError } from '../errors';
import type { ChatServiceDeps } from '../contracts/chat';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ChatExecutor');

export class ChatExecutor {
    private deps: ChatServiceDeps;
    private llmClient: ILLMClientService;
    private activeRequests = new Map<string, { controller: AbortController; timestamp: number }>();
    private executingMessages = new Set<string>();
    private cacheInflight = new Map<string, Promise<void>>();
    private readonly MAX_CACHE_INFLIGHT = 100;
    private readonly MAX_429_RETRIES = 3;
    private readonly ACTIVE_REQUEST_TTL = 10 * 60 * 1000;
    private _staleTimer: ReturnType<typeof setInterval> | null = null;
    private _destroyed = false;
    private _initialized = false;
    private _unsubs: Array<() => void> = [];

    constructor(deps: ChatServiceDeps, llmClient: ILLMClientService) {
        this.deps = deps;
        this.llmClient = llmClient;
    }

    init(): void {
        if (this._initialized) return;
        this._initialized = true;
        this._unsubs.push(
            this.deps.eventBus.on(EVENTS.SEND_MESSAGE, (req) => {
                this.handleMessage(req as QueuedRequest);
            }),
            this.deps.eventBus.onSafe<{ requestId?: string }>(EVENTS.CANCEL_MESSAGE, (d) => {
                if (d && typeof d.requestId === 'string') this.cancelRequest(d.requestId);
            }),
        );
    }

    private startStaleTimer(): void {
        if (this._staleTimer) return;
        this._staleTimer = setInterval(() => {
            const now = Date.now();
            for (const [id, entry] of this.activeRequests) {
                if (now - entry.timestamp > this.ACTIVE_REQUEST_TTL) {
                    entry.controller.abort();
                    this.activeRequests.delete(id);
                }
            }
        }, 60000);
    }

    private stopStaleTimer(): void {
        if (this._staleTimer) {
            clearInterval(this._staleTimer);
            this._staleTimer = null;
        }
    }

    handleMessage(req: QueuedRequest): void {
        if (this._destroyed) return;
        const requestId = req.requestId || crypto.randomUUID();
        if (this.executingMessages.has(requestId)) return;
        this.executingMessages.add(requestId);
        this.executeRequest({ ...req, requestId })
            .catch((e) => LOGGER.error('ChatExecutor', 'executeRequest failed', { error: e }))
            .finally(() => this.executingMessages.delete(requestId));
    }

    cancelRequest(requestId: string): void {
        const entry = this.activeRequests.get(requestId);
        if (entry) {
            entry.controller.abort();
            this.activeRequests.delete(requestId);
        }
    }

    destroy(): void {
        this._destroyed = true;
        this.stopStaleTimer();
        for (const [, entry] of this.activeRequests) {
            try {
                entry.controller.abort();
            } catch {
                /* ignore */
            }
        }
        this.activeRequests.clear();
        this.executingMessages.clear();
        this.cacheInflight.clear();
        for (const unsub of this._unsubs) unsub();
        this._unsubs = [];
    }

    private async executeRequest(initialReq: QueuedRequest): Promise<void> {
        let req = initialReq;
        let depth = 0;
        const excludedProviders = new Set<string>();

        if (this.activeRequests.has(req.requestId)) {
            LOGGER.warn('ChatExecutor', 'executeRequest ignored — duplicate requestId', {
                requestId: req.requestId,
            });
            return;
        }

        const sessionController = new AbortController();
        this.activeRequests.set(req.requestId, {
            controller: sessionController,
            timestamp: Date.now(),
        });
        this.startStaleTimer();

        try {
            while (depth < this.MAX_429_RETRIES) {
                const { requestId, messages, keyId } = req;

                const agentId = req.options?.metadata?.agentId as string | undefined;

                // C-83: Policy check on ALL paths, not just race
                const checkProvider =
                    req.provider && req.provider !== 'auto' && req.provider !== 'race'
                        ? req.provider
                        : undefined;
                if (agentId && checkProvider) {
                    const policyCheck = this.deps.policyService.checkAgentPolicy(
                        agentId,
                        checkProvider,
                        req.model,
                    );
                    if (!policyCheck.allowed) {
                        throw new LLMError(
                            'PolicyError',
                            policyCheck.reason || 'Agent policy blocked provider',
                            403,
                        );
                    }
                }

                const promptText = messages
                    .map((m) => {
                        if (typeof m.content === 'string') return m.content;
                        if (m.content && typeof m.content === 'object' && 'text' in m.content)
                            return String((m.content as { text: string }).text);
                        return '';
                    })
                    .filter(Boolean)
                    .join(' ');

                // B-016: Security scan before any LLM call
                const scanResult = this.deps.promptSecurityService.scan(promptText);
                if (
                    !scanResult.safe &&
                    scanResult.score >= this.deps.promptSecurityService.getConfig().blockOnScore
                ) {
                    this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                        type: 'warning',
                        message: `Prompt blocked by security scan: ${scanResult.summary}`,
                    });
                    await this.deps.promptSecurityService
                        .addEvent({
                            timestamp: Date.now(),
                            prompt: promptText.slice(0, 200),
                            result: scanResult,
                            blocked: true,
                        })
                        .catch((err) =>
                            LOGGER.error('ChatExecutor', 'Security addEvent (blocked) failed', {
                                error: err,
                            }),
                        );
                    throw new LLMError(
                        'SecurityError',
                        `Prompt blocked: ${scanResult.summary}`,
                        400,
                    );
                }

                const useRace =
                    req.options?.strategy === 'race' ||
                    (req.provider && req.provider.toLowerCase() === 'race');

                if (useRace && this.deps.raceExecutor) {
                    const raceCandidates =
                        this.deps.routerService.getRaceCandidateDetails(promptText);
                    if (raceCandidates.length >= 2) {
                        const raced = await this.executeRaceRequest(
                            req,
                            messages,
                            raceCandidates,
                            agentId,
                            sessionController.signal,
                        );
                        if (raced) return;
                    }
                }

                let resolvedProvider = req.provider;
                if (
                    !resolvedProvider ||
                    resolvedProvider.toLowerCase() === 'auto' ||
                    resolvedProvider.toLowerCase() === 'race'
                ) {
                    const sessionId = req.options?.sessionId;
                    const ranked = this.deps.routerService.getRankedProviders(
                        'content',
                        promptText,
                        req.priority,
                        agentId,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        sessionId,
                    );
                    if (ranked.length > 0) {
                        resolvedProvider = ranked[0]!.provider;
                        this.deps.logger.info(
                            'ChatExecutor',
                            `Auto-routed to ${resolvedProvider}`,
                            {
                                requestId,
                            },
                        );
                    } else {
                        this.emitError(req, 'No providers available for auto-routing');
                        return;
                    }
                }

                // L07 — fallback retry: on failure try next best provider
                let currentProvider = resolvedProvider;
                let attemptsForProvider = 0;
                const maxAttemptsPerProvider = 1;

                let lastError: string | null = null;

                while (currentProvider) {
                    if (sessionController.signal.aborted) return;

                    if (excludedProviders.has(currentProvider)) {
                        const fallback = this.deps.routerService.resolveWithFallback(
                            'content',
                            excludedProviders,
                        );
                        if (!fallback) break;
                        currentProvider = fallback.provider;
                        continue;
                    }

                    const effectiveModel = req.model || 'default';
                    const effectiveMessages = messages;

                    const startTime = performance.now();

                    try {
                        // S-04: Security scan prompt before any LLM call
                        if (this.deps.promptSecurityService.getConfig().enabled) {
                            const scanResult = this.deps.promptSecurityService.scan(promptText);
                            if (!scanResult.safe) {
                                LOGGER.warn('ChatExecutor', 'Prompt blocked by security scan', {
                                    requestId,
                                    score: scanResult.score,
                                    summary: scanResult.summary,
                                });
                                this.deps.eventBus.emit(EVENTS.MESSAGE_RESPONSE, {
                                    id: `err-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
                                    requestId,
                                    provider: currentProvider,
                                    model: effectiveModel,
                                    keyId: req.keyId,
                                    content: '',
                                    latency: 0,
                                    status: 'error',
                                    error: `Prompt blocked by security policy (score: ${scanResult.score}/10)`,
                                } satisfies ChatResponse);
                                return;
                            }
                            this.deps.promptSecurityService
                                .addEvent({
                                    timestamp: Date.now(),
                                    prompt: promptText.slice(0, 200),
                                    result: scanResult,
                                    blocked: false,
                                })
                                .catch((err) =>
                                    LOGGER.error(
                                        'ChatExecutor',
                                        'Security addEvent (permitted) failed',
                                        { error: err },
                                    ),
                                );
                        }

                        let result: Awaited<ReturnType<ILLMClientService['sendMessage']>>;

                        const cacheKey = this.deps.cacheService
                            ? await this.deps.cacheService.generateKey(
                                  effectiveMessages as unknown as Array<{
                                      role: string;
                                      content: string;
                                  }>,
                                  effectiveModel,
                              )
                            : null;

                        if (cacheKey) {
                            const cached = this.deps.cacheService.get(cacheKey);
                            if (cached) {
                                this.emitStatus(req, 'cached');
                                const res: ChatResponse = {
                                    id: crypto.randomUUID(),
                                    requestId,
                                    provider: currentProvider,
                                    model: effectiveModel,
                                    keyId: req.keyId,
                                    content: cached.response,
                                    latency: 0,
                                    status: 'done',
                                    tokens: cached.completionTokens,
                                    strategy: 'auto' as const,
                                };
                                this.deps.eventBus.emit(EVENTS.MESSAGE_RESPONSE, res);
                                return;
                            }

                            const onChunk = (chunk: string) => {
                                this.deps.eventBus.emit(EVENTS.STREAM_CHUNK, {
                                    requestId,
                                    provider: currentProvider,
                                    chunk,
                                    keyId: req.keyId,
                                });
                            };

                            const inflightKey = `${currentProvider}:${cacheKey}`;
                            const existingInflight = this.cacheInflight.get(inflightKey);
                            if (existingInflight) {
                                await existingInflight;
                                const recheck = this.deps.cacheService.get(cacheKey);
                                if (recheck) {
                                    this.emitStatus(req, 'cached');
                                    const res: ChatResponse = {
                                        id: crypto.randomUUID(),
                                        requestId,
                                        provider: currentProvider,
                                        model: effectiveModel,
                                        keyId: req.keyId,
                                        content: recheck.response,
                                        latency: 0,
                                        status: 'done',
                                        tokens: recheck.completionTokens,
                                        strategy: 'auto' as const,
                                    };
                                    this.deps.eventBus.emit(EVENTS.MESSAGE_RESPONSE, res);
                                    return;
                                }
                                // Inflight resolved with cache miss — keep going with new request
                            }

                            this.deps.eventBus.emit(EVENTS.STREAM_START, {
                                requestId,
                                provider: currentProvider,
                                model: effectiveModel,
                                keyId: req.keyId,
                            });

                            // Atomic: set inflight BEFORE first await to prevent duplicate requests
                            const inflightPromise = this.llmClient.sendMessage(effectiveMessages, {
                                provider: currentProvider,
                                model: effectiveModel,
                                temperature: req.options?.temperature,
                                maxTokens: req.options?.maxTokens,
                                signal: sessionController.signal,
                                onChunk,
                            });
                            const inflightEntry = inflightPromise
                                .then(() => {})
                                .catch((err) =>
                                    LOGGER.error('ChatExecutor', 'Inflight request failed', {
                                        cacheKey,
                                        error: err,
                                    }),
                                );
                            if (this.cacheInflight.size >= this.MAX_CACHE_INFLIGHT) {
                                const firstKey = this.cacheInflight.keys().next().value;
                                if (firstKey) this.cacheInflight.delete(firstKey);
                            }
                            this.cacheInflight.set(inflightKey, inflightEntry);
                            try {
                                result = await inflightPromise;
                            } finally {
                                if (this.cacheInflight.get(inflightKey) === inflightEntry) {
                                    this.cacheInflight.delete(inflightKey);
                                }
                            }
                        } else {
                            this.deps.eventBus.emit(EVENTS.STREAM_START, {
                                requestId,
                                provider: currentProvider,
                                model: effectiveModel,
                                keyId: req.keyId,
                            });
                            result = await this.llmClient.sendMessage(effectiveMessages, {
                                provider: currentProvider,
                                model: effectiveModel,
                                temperature: req.options?.temperature,
                                maxTokens: req.options?.maxTokens,
                                signal: sessionController.signal,
                                onChunk: (chunk: string) => {
                                    this.deps.eventBus.emit(EVENTS.STREAM_CHUNK, {
                                        requestId,
                                        provider: currentProvider,
                                        chunk,
                                        keyId: req.keyId,
                                    });
                                },
                            });
                        }

                        const latencyMs = Math.round(performance.now() - startTime);
                        const tps =
                            latencyMs > 0 && result?.tokens
                                ? Math.round((result.tokens / (latencyMs / 1000)) * 10) / 10
                                : 0;

                        // H-119: Scan LLM response for sensitive content before emitting
                        if (
                            result?.content &&
                            this.deps.promptSecurityService.getConfig().enabled
                        ) {
                            const outputScan = this.deps.promptSecurityService.scan(result.content);
                            if (!outputScan.safe) {
                                LOGGER.warn('ChatExecutor', 'Response blocked by security scan', {
                                    requestId,
                                    score: outputScan.score,
                                    summary: outputScan.summary,
                                });
                                this.deps.eventBus.emit(EVENTS.MESSAGE_RESPONSE, {
                                    id: `err-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
                                    requestId,
                                    provider: currentProvider,
                                    model: effectiveModel,
                                    keyId: req.keyId,
                                    content: '[Response blocked by content security policy]',
                                    latency: latencyMs,
                                    status: 'error',
                                    error: `Response blocked by security policy (score: ${outputScan.score}/10)`,
                                } satisfies ChatResponse);
                                this.deps.promptSecurityService
                                    .addEvent({
                                        timestamp: Date.now(),
                                        prompt: promptText.slice(0, 200),
                                        result: outputScan,
                                        blocked: true,
                                    })
                                    .catch((err) =>
                                        LOGGER.error(
                                            'ChatExecutor',
                                            'Security addEvent (response blocked) failed',
                                            { error: err },
                                        ),
                                    );
                                return;
                            }
                        }

                        if (result && result.content !== undefined && result.content !== null) {
                            this.deps.eventBus.emit(EVENTS.MESSAGE_RESPONSE, {
                                id: crypto.randomUUID(),
                                requestId,
                                provider: currentProvider,
                                model: effectiveModel,
                                keyId: req.keyId,
                                content: result.content,
                                latency: latencyMs,
                                status: 'done',
                                tokens: result.tokens,
                                tps,
                                finishReason: result.finishReason,
                            } satisfies ChatResponse);

                            this.deps.keyService.recordUsage(
                                currentProvider,
                                latencyMs,
                                result.tokens,
                                effectiveModel,
                                { requestId },
                            );

                            if (cacheKey && this.deps.cacheService) {
                                try {
                                    this.deps.cacheService.set(
                                        cacheKey,
                                        result.content,
                                        effectiveModel,
                                        currentProvider,
                                        result.tokens || 0,
                                        result.tokens || 0,
                                    );
                                } catch {
                                    // cache set failure is non-critical
                                }
                            }

                            // C-69: removed per-request session creation — sessions leaked
                            // ProviderRuntime.createSession() is for long-lived connections,
                            // not per-request tracking. Cost tracking via STREAM_END → BudgetService.

                            this.deps.eventBus.emitOnce(EVENTS.STREAM_END, requestId, {
                                requestId,
                                fullContent: result.content,
                                provider: currentProvider,
                                model: effectiveModel,
                                latency: latencyMs,
                                tokens: result.tokens || 0,
                                agentId,
                                invocationId: req.options?.metadata?.invocationId as
                                    string | undefined,
                            });

                            return;
                        }

                        const finishReason = result?.finishReason;
                        if (finishReason && !['stop', 'length', 'done'].includes(finishReason)) {
                            LOGGER.warn('ChatExecutor', `Unhandled finishReason: ${finishReason}`, {
                                provider: currentProvider,
                                requestId,
                            });
                            this.deps.eventBus.emit(EVENTS.MESSAGE_RESPONSE, {
                                id: `err-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
                                requestId,
                                provider: currentProvider,
                                model: effectiveModel,
                                keyId: req.keyId,
                                content: '',
                                latency: latencyMs,
                                status: 'error',
                                error: `Unexpected finish reason: ${finishReason}`,
                            } satisfies ChatResponse);

                            return;
                        }

                        lastError = 'Empty or invalid response from provider';
                        this.deps.keyService.handleProviderError(
                            keyId || currentProvider,
                            lastError,
                        );
                        this.deps.eventBus.emit(EVENTS.MESSAGE_RESPONSE, {
                            id: `err-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
                            requestId,
                            provider: currentProvider,
                            model: effectiveModel,
                            keyId: req.keyId,
                            content: '',
                            latency: latencyMs,
                            status: 'error',
                            error: lastError,
                        } satisfies ChatResponse);
                        return;
                    } catch (error: unknown) {
                        const errMsg = error instanceof Error ? error.message : String(error);
                        LOGGER.warn(
                            'ChatExecutor',
                            `Provider ${currentProvider} failed: ${errMsg}`,
                            {
                                requestId,
                                provider: currentProvider,
                            },
                        );

                        const isAbort =
                            error instanceof DOMException && error.name === 'AbortError';
                        if (isAbort) {
                            this.deps.eventBus.emit(EVENTS.MESSAGE_RESPONSE, {
                                id: `err-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
                                requestId,
                                provider: currentProvider,
                                model: effectiveModel,
                                keyId: req.keyId,
                                content: '',
                                latency: Math.round(performance.now() - startTime),
                                status: 'cancelled',
                                error: 'Request cancelled by user',
                            } satisfies ChatResponse);
                            return;
                        }

                        const isRateLimit =
                            /\b429\b/.test(errMsg) ||
                            (error instanceof LLMError && error.statusCode === 429);

                        this.deps.keyService.handleProviderError(keyId || currentProvider, errMsg);

                        if (isRateLimit && depth < this.MAX_429_RETRIES - 1) {
                            depth++;
                            excludedProviders.add(currentProvider);
                            const fallback = this.deps.routerService.resolveWithFallback(
                                'content',
                                excludedProviders,
                            );
                            if (fallback) {
                                excludedProviders.add(fallback.provider);
                                currentProvider = fallback.provider;
                                // C-23: no session creation in fallback path —
                                // session is created only on actual success (line ~359)
                                continue;
                            }
                        }

                        if (isRateLimit) {
                            this.deps.eventBus.emit(EVENTS.MESSAGE_RESPONSE, {
                                id: `err-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
                                requestId,
                                provider: currentProvider,
                                model: effectiveModel,
                                keyId: req.keyId,
                                content: '',
                                latency: Math.round(performance.now() - startTime),
                                status: 'error',
                                error: 'Rate limited. Please try again later.',
                            } satisfies ChatResponse);
                            return;
                        }

                        lastError = errMsg;
                        excludedProviders.add(currentProvider);
                        attemptsForProvider++;

                        if (attemptsForProvider >= maxAttemptsPerProvider) {
                            const fallback = this.deps.routerService.resolveWithFallback(
                                'content',
                                excludedProviders,
                            );
                            if (fallback) {
                                currentProvider = fallback.provider;
                                attemptsForProvider = 0;
                                continue;
                            }
                            const downgraded =
                                this.deps.routerService.getDowngradedModel(effectiveModel);
                            if (downgraded) {
                                req = { ...req, model: downgraded, provider: currentProvider };
                                excludedProviders.delete(currentProvider);
                                attemptsForProvider = 0;
                                continue;
                            }
                            break;
                        }
                    }
                }

                if (lastError) {
                    this.emitError(req, lastError);
                }
                break;
            }
        } finally {
            this.activeRequests.delete(req.requestId);
        }
    }

    private async executeRaceRequest(
        req: QueuedRequest,
        messages: AdapterMessage[],
        candidates: Array<{ provider: string; model: string; keyId: string }>,
        agentId?: string,
        parentSignal?: AbortSignal,
    ): Promise<boolean> {
        const { requestId } = req;
        const controller = new AbortController();

        let onParentAbort: (() => void) | null = null;
        if (parentSignal) {
            if (parentSignal.aborted) {
                controller.abort();
            } else {
                onParentAbort = () => controller.abort();
                parentSignal.addEventListener('abort', onParentAbort, { once: true });
            }
        }

        try {
            let allowedCandidates = candidates;
            if (agentId) {
                allowedCandidates = candidates.filter((c) => {
                    const policyCheck = this.deps.policyService.checkAgentPolicy(
                        agentId,
                        c.provider,
                        c.model,
                    );
                    if (!policyCheck.allowed) {
                        this.deps.logger.warn('ChatExecutor', `Race candidate filtered by policy`, {
                            provider: c.provider,
                            reason: policyCheck.reason,
                        });
                        return false;
                    }
                    return true;
                });
                if (allowedCandidates.length === 0) {
                    this.emitError(req, 'All race candidates blocked by policy');
                    return false;
                }
            }

            const result = await this.deps.raceExecutor!.race(messages, allowedCandidates, {
                signal: controller.signal,
                timeoutMs: req.options?.timeout ?? CONFIG?.keys?.defaultRules?.timeoutMs ?? 15000,
                adapterOptions: {
                    temperature: req.options?.temperature,
                    maxOutputTokens: req.options?.maxTokens,
                },
                keyResolver: (keyId: string) => this.deps.keyService.getKey?.(keyId)?.key,
            });

            const { winner, response } = result;
            const keyObj =
                this.deps.keyService.getKey?.(winner.keyId) ??
                this.deps.keyService.getKeys().find((k) => k.provider === winner.provider);

            const raceTps =
                result.latency > 0 && response.tokens
                    ? Math.round((response.tokens / (result.latency / 1000)) * 10) / 10
                    : 0;
            const res: ChatResponse = {
                id: crypto.randomUUID(),
                requestId,
                provider: winner.provider,
                model: winner.model,
                keyId: keyObj?.id,
                content: response.content,
                latency: result.latency,
                status: 'done',
                tokens: response.tokens,
                tps: raceTps,
                strategy: 'race',
            };

            this.deps.eventBus.emit(EVENTS.MESSAGE_RESPONSE, res);
            this.deps.keyService.recordUsage(
                winner.provider,
                result.latency,
                response.tokens,
                winner.model,
            );
            this.deps.budgetService?.recordSpend(
                agentId || null,
                winner.provider,
                (response.tokens || 0) * 0.000002,
            );

            if (result.failures.length > 0) {
                this.deps.logger.info(
                    'ChatExecutor',
                    `Race won by ${winner.provider}; ${result.failures.length} slower/failed`,
                    {
                        winner: winner.provider,
                        failures: result.failures.map((f) => f.candidate.provider),
                    },
                );
            }
            return true;
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            this.deps.logger.warn('ChatExecutor', `Provider race failed: ${errMsg}`, {
                error: errMsg,
            });
            return false;
        } finally {
            // H-34: Remove parent abort listener to prevent leak
            if (parentSignal && onParentAbort) {
                parentSignal.removeEventListener('abort', onParentAbort);
            }
            controller.abort();
        }
    }

    private emitError(req: QueuedRequest, error: string) {
        this.deps.eventBus.emitOnce(EVENTS.MESSAGE_RESPONSE, req.requestId, {
            id: `err-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
            requestId: req.requestId,
            provider: req.provider,
            model: req.model,
            keyId: req.keyId,
            content: '',
            latency: 0,
            status: 'error',
            error,
        });
        this.deps.eventBus.emit(EVENTS.STREAM_ERROR, {
            requestId: req.requestId,
            provider: req.provider,
            keyId: req.keyId,
            error,
        });
    }

    private emitStatus(req: QueuedRequest, status: ChatResponse['status']) {
        this.deps.eventBus.emitOnce(EVENTS.MESSAGE_RESPONSE, req.requestId || crypto.randomUUID(), {
            id: `st-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
            requestId: req.requestId || crypto.randomUUID(),
            provider: req.provider || 'unknown',
            model: req.model || 'unknown',
            keyId: req.keyId,
            content: '',
            latency: 0,
            status,
        });
    }
}
