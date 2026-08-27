import type { IProbeService, ProbeResult, ProbeStatus } from '../contracts/probe';
import { EVENTS } from '../events/event-names';
import type { ILifecycle } from '../contracts/lifecycle';
import type { ApiKey } from '../types/metrics-types';
import type { IKeyStateStore } from '../contracts/key-state';
import type { IEventBus } from '../types/interfaces';
import { LLMError } from '../errors';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ProbeService');

const PROBE_TIMEOUT = 15000;
const PROBE_MESSAGES = [
    { role: 'user' as const, content: 'What is 2+2? Answer with just the number.' },
];

/** Per-provider overrides for SendMessageOptions in probes */
const PROBE_OPTIONS_OVERRIDES: Record<string, Partial<{ maxOutputTokens: number }>> = {
    gemini: { maxOutputTokens: 100 },
};

const PROVDER_DEFAULTS: Record<string, string> = {
    gemini: 'gemini-3.1-flash-lite',
    groq: 'llama-3.3-70b-versatile',
    openrouter: 'meta-llama/llama-3.1-8b-instruct',
    nvidia: 'meta/llama-3.1-8b-instruct',
    deepseek: 'deepseek-chat',
    cohere: 'command-r-plus',
};

/** Models to try as fallback when primary probe model fails with a retryable error */
const PROBE_FALLBACKS: Record<string, string[]> = {
    groq: ['llama-3.1-8b-instant'],
    gemini: ['gemini-3.1-flash-lite'],
    openrouter: ['openrouter/free', 'meta-llama/llama-3.1-8b-instruct'],
    nvidia: ['meta/llama-3.3-70b-instruct'],
};

/** Error indicates insufficient credits (402) — key is valid but account balance too low */
function isCreditError(e: unknown): boolean {
    const errMsg = e instanceof Error ? e.message : '';
    const errorCode = e instanceof LLMError ? e.statusCode : undefined;
    if (errorCode === 402) return true;
    if (
        errMsg.includes('402') ||
        errMsg.includes('Payment Required') ||
        errMsg.includes('insufficient credits')
    )
        return true;
    return false;
}

/** Errors that are definitely key-level, not model-level (no point trying another model) */
function isKeyLevelError(e: unknown): boolean {
    const errMsg = e instanceof Error ? e.message : '';
    const errorCode = e instanceof LLMError ? e.statusCode : undefined;
    if (errorCode === 401 || errorCode === 403) return true;
    if (
        errMsg.includes('401') ||
        errMsg.includes('403') ||
        errMsg.includes('Unauthorized') ||
        errMsg.includes('Forbidden')
    )
        return true;
    if (errMsg.includes('Invalid API Key') || errMsg.includes('Authentication failed')) return true;
    if (errMsg.includes('API key not valid') || errMsg.includes('INVALID_ARGUMENT')) return true;
    if (errMsg.includes('No adapter') || errMsg.includes('Key not found')) return true;
    return false;
}

export interface ProbeServiceDeps {
    keyService: {
        getKeys: () => ApiKey[];
        getKey: (id: string) => ApiKey | undefined;
        isProviderCircuitOpen: (provider: string) => boolean;
        isProviderRateLimited: (provider: string) => boolean;
        recordUsage: (
            keyId: string,
            latency: number,
            tokens: number,
            model: string,
            extra?: Record<string, unknown>,
        ) => void;
        pushHistory: (keyId: string, action: string, detail: string) => void;
    };
    adapterRegistry: {
        getAdapter: (provider: string) =>
            | {
                  sendMessage: (
                      messages: typeof PROBE_MESSAGES,
                      model: string,
                      apiKey: string,
                      signal?: AbortSignal,
                      options?: { maxOutputTokens?: number },
                  ) => Promise<{ content: string; latency?: number }>;
              }
            | undefined;
        resetCircuitBreaker: (provider: string) => void;
    };
    keyStateStore?: IKeyStateStore;
    eventBus?: IEventBus;
}

export class ProbeService implements IProbeService, ILifecycle {
    private deps: ProbeServiceDeps;

    constructor(deps: ProbeServiceDeps) {
        this.deps = deps;
    }

    private probeIntervalId: ReturnType<typeof setInterval> | null = null;

    async init(): Promise<void> {}
    private _started = false;
    async start(): Promise<void> {
        if (this._started) return;
        this._started = true;
        // OBS-38: periodic probe scheduling — re-probe every 5 minutes
        this.probeIntervalId = setInterval(() => {
            this.probeAll().catch((e) =>
                LOGGER.warn('ProbeService', 'Periodic probe failed', { error: e }),
            );
        }, 300_000);
    }
    destroy(): void {
        if (this.probeIntervalId) {
            clearInterval(this.probeIntervalId);
            this.probeIntervalId = null;
        }
        this._started = false;
    }

    async probeKey(keyId: string, model?: string): Promise<ProbeResult> {
        const key = this.deps.keyService.getKey(keyId);
        if (!key) {
            return {
                status: 'broken',
                provider: 'unknown',
                keyId,
                keyLabel: 'unknown',
                model: model || 'auto',
                latency: 0,
                rateLimited: false,
                circuitOpen: false,
                error: 'Key not found',
                timestamp: Date.now(),
            };
        }

        const kss = this.deps.keyStateStore?.get(keyId);
        if (kss?.flags.authFailed || kss?.flags.rateLimited || kss?.flags.circuitOpen) {
            const reason = kss.flags.authFailed
                ? 'auth failed'
                : kss.flags.rateLimited
                  ? 'rate limited'
                  : 'circuit open';
            return {
                status: 'broken',
                provider: key.provider,
                keyId,
                keyLabel: key.label || key.provider,
                model: model || 'auto',
                latency: 0,
                rateLimited: kss.flags.rateLimited,
                circuitOpen: kss.flags.circuitOpen,
                error: `Skipped — ${reason} on previous probe`,
                timestamp: Date.now(),
            };
        }

        const provider = key.provider;
        const primaryModel =
            model || PROVDER_DEFAULTS[provider.toLowerCase()] || key.availableModels?.[0] || 'auto';
        const fallbacks = PROBE_FALLBACKS[provider.toLowerCase()] ?? [];
        const keyModels = key.availableModels ?? [];
        // Models to try: if model explicitly specified, only try that one; otherwise chain all candidates
        let modelsToTry: string[];
        if (model) {
            modelsToTry = [model];
        } else {
            const allCandidates = [primaryModel, ...fallbacks, ...keyModels];
            modelsToTry = [...new Set(allCandidates)].filter((m) => m && m !== 'auto');
            // Limit to first 2 models — reduces memory pressure during probe cycle
            if (modelsToTry.length > 2) modelsToTry = modelsToTry.slice(0, 2);
        }

        this.deps.adapterRegistry.resetCircuitBreaker(provider);
        const wasCircuitOpen = this.deps.keyService.isProviderCircuitOpen(provider);
        const rateLimited = this.deps.keyService.isProviderRateLimited(provider);
        const quotaInfo = this.getQuotaInfo(key);

        const adapter = this.deps.adapterRegistry.getAdapter(provider);
        if (!adapter) {
            return this.makeResult(
                key,
                primaryModel,
                'broken',
                0,
                `No adapter for provider: ${provider}`,
            );
        }

        let lastResult: ProbeResult | undefined;
        const modelHealth: Record<string, 'ok' | 'failed'> = {};

        for (let attemptIdx = 0; attemptIdx < modelsToTry.length; attemptIdx++) {
            const currentModel = modelsToTry[attemptIdx]!;

            const controller = new AbortController();
            const timeout = setTimeout(
                () => controller.abort(new DOMException('Probe timed out', 'AbortError')),
                PROBE_TIMEOUT,
            );
            const start = performance.now();

            const providerOpts = PROBE_OPTIONS_OVERRIDES[key.provider.toLowerCase()] ?? {};
            try {
                const res = await adapter.sendMessage(
                    PROBE_MESSAGES,
                    currentModel,
                    key.key,
                    controller.signal,
                    { maxOutputTokens: 10, ...providerOpts },
                );
                clearTimeout(timeout);
                const latency = Math.round(performance.now() - start);

                this.deps.keyService.recordUsage(key.id, latency, 0, currentModel, { probe: true });

                if (res.content && res.content.length > 0) {
                    let status: ProbeStatus;
                    if (latency > 5000 || (quotaInfo.limit > 0 && quotaInfo.remaining <= 0)) {
                        status = 'degraded';
                    } else if (
                        rateLimited ||
                        (quotaInfo.limit > 0 && quotaInfo.remaining / quotaInfo.limit < 0.1)
                    ) {
                        status = 'limited';
                    } else {
                        status = 'ready';
                    }
                    modelHealth[currentModel] = 'ok';
                    lastResult = this.makeResult(
                        key,
                        currentModel,
                        status,
                        latency,
                        undefined,
                        rateLimited,
                        wasCircuitOpen,
                        quotaInfo,
                        res.content,
                        undefined,
                        modelHealth,
                    );
                    break; // Success — stop trying more models
                } else {
                    modelHealth[currentModel] = 'failed';
                    const r = this.makeResult(
                        key,
                        currentModel,
                        'broken',
                        latency,
                        'Empty response',
                        rateLimited,
                        wasCircuitOpen,
                        quotaInfo,
                        undefined,
                        undefined,
                        modelHealth,
                    );
                    if (!lastResult || attemptIdx === modelsToTry.length - 1) lastResult = r;
                }
            } catch (e: unknown) {
                clearTimeout(timeout);
                const latency = Math.round(performance.now() - start);
                const msg = e instanceof Error ? e.message : 'Unknown error';
                const errorCode = e instanceof LLMError ? e.statusCode : undefined;

                this.deps.keyService.recordUsage(key.id, latency, 0, currentModel, {
                    failed: true,
                    error: msg,
                    errorCode,
                    task: 'probe',
                });

                modelHealth[currentModel] = 'failed';

                if (isKeyLevelError(e)) {
                    // Key-level error (401, auth) — no point trying other models
                    lastResult = this.makeResult(
                        key,
                        currentModel,
                        'broken',
                        latency,
                        msg,
                        rateLimited,
                        wasCircuitOpen,
                        quotaInfo,
                        undefined,
                        errorCode,
                        modelHealth,
                    );
                    break;
                }

                if (isCreditError(e)) {
                    // Credit error (402) — key is valid but has no balance, so it can't
                    // serve paid models. Mark authFailed immediately (like the debate
                    // caller does) so routing excludes it and probeAll skips it on the
                    // next cycle instead of re-probing a dead key every interval.
                    try {
                        this.deps.keyStateStore?.update(key.id, {
                            flags: { circuitOpen: false, rateLimited: false, authFailed: true },
                        });
                    } catch {
                        /* best-effort */
                    }
                    // Try next model (may be free)
                    const r = this.makeResult(
                        key,
                        currentModel,
                        'limited',
                        latency,
                        msg,
                        rateLimited,
                        wasCircuitOpen,
                        quotaInfo,
                        undefined,
                        errorCode,
                        modelHealth,
                    );
                    lastResult = r;
                    continue;
                }

                const isRateLimit =
                    errorCode === 429 || msg.includes('429') || msg.includes('Too Many Requests');
                if (isRateLimit) {
                    const r = this.makeResult(
                        key,
                        currentModel,
                        'limited',
                        latency,
                        msg,
                        true,
                        wasCircuitOpen,
                        quotaInfo,
                        undefined,
                        errorCode,
                        modelHealth,
                    );
                    lastResult = r;
                    continue;
                }

                // Model-specific error — try next model if available
                const r = this.makeResult(
                    key,
                    currentModel,
                    'broken',
                    latency,
                    msg,
                    rateLimited,
                    wasCircuitOpen,
                    quotaInfo,
                    undefined,
                    errorCode,
                    modelHealth,
                );
                lastResult = r;
                // Continue to next model in the loop
            }
        }

        if (lastResult) {
            this.deps.keyService.pushHistory(
                key.id,
                'probed',
                `${lastResult.status} — ${lastResult.model} ${lastResult.latency}ms${lastResult.error ? ` (${lastResult.error})` : ''}`,
            );
            this.deps.keyStateStore?.ingestProbe(key.id, lastResult);
            this.deps.eventBus?.emit(EVENTS.KEY_PROBE_RESULT, { ...lastResult });
            this.deps.eventBus?.emit(EVENTS.STREAM_END, {
                requestId: `probe-${key.id}-${lastResult.timestamp}`,
                fullContent: lastResult.responseContent || 'OK',
                provider: lastResult.provider,
                model: lastResult.model,
                latency: lastResult.latency,
                tokens: 0,
                ttft: lastResult.latency,
            });
        }
        this.deps.adapterRegistry.resetCircuitBreaker(provider);
        return (
            lastResult ??
            this.makeResult(
                key,
                primaryModel,
                'broken',
                0,
                'Probe failed before result was created',
            )
        );
    }

    /** Check current JS heap in MB. Returns 0 if unavailable. */
    private currentHeapMB(): number {
        try {
            const mem = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
            return mem ? mem.usedJSHeapSize / (1024 * 1024) : 0;
        } catch {
            return 0;
        }
    }

    /** Hint to V8 to run GC: yield to event loop + invoke global gc if exposed. */
    private forceGCHint(): void {
        (globalThis as { gc?: () => void }).gc?.();
    }

    async probeAll(): Promise<ProbeResult[]> {
        const keys = this.deps.keyService.getKeys();
        const results: ProbeResult[] = [];
        for (const key of keys) {
            // Stop probing if heap is too high — let MemoryWatchdog + existing
            // cancellations free up space. Abandoned keys will be probed on next cycle.
            const heapMB = this.currentHeapMB();
            if (heapMB > 0 && heapMB > 180) {
                LOGGER.warn('ProbeService', 'Heap too high — aborting probe cycle', {
                    heapMB: heapMB.toFixed(1),
                    keysRemaining: keys.length - results.length,
                    keysTested: results.length,
                });
                break;
            }
            if (key.status === 'error') {
                results.push({
                    status: 'broken',
                    provider: key.provider,
                    keyId: key.id,
                    keyLabel: key.label || key.provider,
                    model: 'auto',
                    latency: 0,
                    rateLimited: false,
                    circuitOpen: false,
                    error: 'Skipped — key has hard failure',
                    timestamp: Date.now(),
                });
                continue;
            }
            const kss = this.deps.keyStateStore?.get(key.id);
            if (kss?.flags.authFailed || kss?.flags.rateLimited || kss?.flags.circuitOpen) {
                const reason = kss.flags.authFailed
                    ? 'auth failed'
                    : kss.flags.rateLimited
                      ? 'rate limited'
                      : 'circuit open';
                results.push({
                    status: 'broken',
                    provider: key.provider,
                    keyId: key.id,
                    keyLabel: key.label || key.provider,
                    model: 'auto',
                    latency: 0,
                    rateLimited: kss.flags.rateLimited,
                    circuitOpen: kss.flags.circuitOpen,
                    error: `Skipped — ${reason} on previous probe`,
                    timestamp: Date.now(),
                });
                continue;
            }
            const result = await this.probeKey(key.id);
            results.push(result);
            // GC hint: allocate+free large buffer to encourage V8 mark-sweep
            this.forceGCHint();
            // 500ms delay between probes to let GC process pending allocations
            await new Promise((r) => setTimeout(r, 500));
        }
        return results;
    }

    async probeForDebate(
        participants: Array<{ id: string; provider?: string; modelId?: string }>,
    ): Promise<Map<string, ProbeResult>> {
        const map = new Map<string, ProbeResult>();
        const seen = new Set<string>();

        for (const p of participants) {
            const provider = p.provider;
            if (!provider || seen.has(provider)) continue;
            seen.add(provider);
            const keys = this.deps.keyService
                .getKeys()
                .filter(
                    (k) =>
                        k.provider.toLowerCase() === provider.toLowerCase() &&
                        k.status === 'active',
                );
            if (keys.length === 0) {
                map.set(p.id, {
                    status: 'broken',
                    provider,
                    keyId: '',
                    keyLabel: '',
                    model: p.modelId || 'auto',
                    latency: 0,
                    rateLimited: false,
                    circuitOpen: false,
                    error: 'No active keys',
                    timestamp: Date.now(),
                });
                continue;
            }
            const firstKey = keys[0]!;
            const kss = this.deps.keyStateStore?.get(firstKey.id);
            if (kss?.flags.authFailed) {
                map.set(p.id, {
                    status: 'broken',
                    provider: firstKey.provider,
                    keyId: firstKey.id,
                    keyLabel: firstKey.label || firstKey.provider,
                    model: p.modelId || 'auto',
                    latency: 0,
                    rateLimited: false,
                    circuitOpen: false,
                    error: 'Skipped — auth failed on previous probe',
                    timestamp: Date.now(),
                });
                continue;
            }
            const result = await this.probeKey(firstKey.id, p.modelId);
            map.set(p.id, result);
        }
        return map;
    }

    private makeResult(
        key: ApiKey,
        model: string,
        status: ProbeStatus,
        latency: number,
        error?: string,
        rateLimited = false,
        circuitOpen = false,
        quota?: { remaining: number; limit: number },
        responseContent?: string,
        statusCode?: number,
        modelHealth?: Record<string, 'ok' | 'failed'>,
    ): ProbeResult {
        return {
            status,
            provider: key.provider,
            keyId: key.id,
            keyLabel: key.label,
            model,
            latency,
            rateLimited,
            circuitOpen,
            error,
            statusCode,
            quotaRemaining: quota?.remaining,
            quotaLimit: quota?.limit,
            timestamp: Date.now(),
            responseContent,
            modelHealth,
        };
    }

    private getQuotaInfo(key: ApiKey): { remaining: number; limit: number } {
        const usage = key.stats?.extended?.usageToday as
            | {
                  requests: number;
                  tokens: number;
                  weightedTokens: number;
                  estimatedCost: number;
                  limit?: number;
              }
            | undefined;
        if (!usage || !usage.limit) return { remaining: -1, limit: 0 };
        return {
            remaining: Math.max(0, usage.limit - (usage.requests ?? 0)),
            limit: usage.limit,
        };
    }
}
