import type { TimelineEntry, IDebateQueryEngine } from '../../contracts/debate-types';
import type { DebateSession } from '../../contracts/debate-types';
import type { IAdapterRegistry } from '../../contracts/provider-adapter';
import { PROVIDER_DEFAULT_MODELS } from '../../utils/provider-default-models';
import { rootLogger } from '../logger-service';

const NON_CHAT_PREFIXES = [
    'text-',
    'davinci',
    'curie',
    'babbage',
    'ada',
    'code-',
    'imagen-',
    'veo-',
    'gemma-',
    'claude-instant-',
];

const NON_CHAT_PATTERNS = [/^gpt-3\.5-turbo-instruct/, /^text-davinci/, /^code-davinci/];

// Models matching these patterns are considered "large" and get longer timeouts
const LARGE_MODEL_PATTERNS = [/70b/i, /120b/i, /180b/i, /405b/i, /671b/i];

export function isLargeModel(model: string): boolean {
    return LARGE_MODEL_PATTERNS.some((re) => re.test(model));
}

export const DEBATE_MODEL_PRIORITY: Record<string, string[]> = {
    // gemini-3.1-flash 404s via the v1beta generateContent API — flash-lite only.
    gemini: ['gemini-3.1-flash-lite'],
    groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    openrouter: [PROVIDER_DEFAULT_MODELS.openrouter!, 'openrouter/free'],
    // Fast model first; 70B+ models are fallback due to cold-start latency on NIM
    nvidia: ['meta/llama-3.1-8b-instruct', 'meta/llama-3.3-70b-instruct'],
};

export function isChatModel(model: string): boolean {
    const m = model.toLowerCase();
    for (const p of NON_CHAT_PREFIXES) {
        if (m.startsWith(p)) return false;
    }
    for (const re of NON_CHAT_PATTERNS) {
        if (re.test(model)) return false;
    }
    return true;
}

export function getAllModelsForProvider(key: {
    provider: string;
    availableModels?: string[];
}): string[] {
    const provider = key.provider.toLowerCase();
    const priority = (DEBATE_MODEL_PRIORITY[provider] ?? []).filter((m) => isChatModel(m));
    const available = (key.availableModels ?? []).filter((m) => isChatModel(m));
    const models = new Set([...priority, ...available]);
    if (models.size === 0) {
        for (const m of priority) models.add(m);
    }
    return [...models];
}

export function isModelCompatibleWithProvider(model: string, provider: string): boolean {
    const p = provider.toLowerCase();
    // Prefix-guarded providers: model MUST use the correct prefix or be bare
    if (p === 'openrouter' && !model.startsWith('openrouter/')) return false;
    if (p === 'nvidia' && !model.startsWith('meta/')) return false;
    // Reverse guards: model with known provider prefix must only go to matching provider
    if (model.startsWith('openrouter/')) return p === 'openrouter';
    if (model.startsWith('meta/')) return p === 'nvidia';
    // Bare model format: reject provider-prefixed model strings sent to native providers
    // Gemini native models: can be gemini-X (hyphen) or gemini/X (slash format)
    if (model.startsWith('gemini-') || model.startsWith('gemini/')) return p === 'gemini';
    if (model.startsWith('openai/')) return p === 'openai' || p === 'openrouter';
    if (model.startsWith('anthropic/')) return false; // not supported in debates
    if (model.startsWith('groq/')) return p === 'groq';
    if (model.startsWith('mistral/')) return p === 'mistral';
    if (model.startsWith('cohere/')) return p === 'cohere';
    if (model.startsWith('deepseek/')) return p === 'deepseek';
    // Bare model name (no known provider prefix): only allow on the provider that
    // lists it in DEBATE_MODEL_PRIORITY. Without this guard, e.g. llama-3.1-8b-instant
    // (a Groq model) gets routed to Gemini when Gemini's availableModels is empty,
    // causing 404 with ~5s wasted per call. Unknown bare models (not in any priority
    // list) fall through to return true for backward compatibility.
    for (const [prioProvider, prioModels] of Object.entries(DEBATE_MODEL_PRIORITY)) {
        if (prioModels.includes(model)) return p === prioProvider;
    }
    return true;
}

export function pickBestModelForDebate(
    provider: string,
    availableModels: string[],
    requestedModel?: string,
    skipModels?: Set<string>,
): string | undefined {
    const p = provider.toLowerCase();
    if (requestedModel && requestedModel !== 'auto') {
        if (isModelCompatibleWithProvider(requestedModel, provider)) {
            if (!availableModels.length || availableModels.includes(requestedModel)) {
                if (!skipModels?.has(requestedModel)) return requestedModel;
            }
        }
    }
    const priorities = DEBATE_MODEL_PRIORITY[p];
    if (priorities) {
        for (const model of priorities) {
            if (
                (!availableModels.length || availableModels.includes(model)) &&
                !skipModels?.has(model)
            )
                return model;
        }
    }
    return undefined;
}

export interface ProviderResolveResult {
    key: { id: string; key: string; provider: string; availableModels?: string[] };
    modelId: string;
}

export interface ProviderResolverDeps {
    keyService: {
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
    };
    routerService: {
        getDebateProviders(count: number): Array<{
            provider: string;
            key: {
                id: string;
                provider: string;
                key: string;
                status?: string;
                availableModels?: string[];
            };
        }>;
        getRankedProviders(
            strategy: string,
            prompt: string,
        ): Array<{ id: string; provider: string; key: string; availableModels?: string[] }>;
    };
    adapterRegistry: IAdapterRegistry;
    getKeyStateStore?: () => {
        get(
            id: string,
        ):
            | { flags: { authFailed: boolean; circuitOpen: boolean; rateLimited: boolean } }
            | undefined;
        update(id: string, patch: { flags: Record<string, boolean> }): void;
    };
}

export interface SessionProviderState {
    hasProviderFailed(provider: string): boolean;
    markProviderFailed(provider: string): void;
    hasModelFailed(model: string): boolean;
    markModelFailed(model: string): void;
}

export class DebateProviderResolver {
    private participantProviderMap = new Map<string, string>();
    private llmFailureCount = new Map<string, number>();

    constructor(private deps: ProviderResolverDeps) {}

    providerKey(sessionId: string, agentId: string): string {
        return `${sessionId}:${agentId}`;
    }

    isKeyAuthFailed(keyId: string): boolean {
        const kss = this.deps.getKeyStateStore?.();
        if (!kss) return false;
        const state = kss.get(keyId);
        return state?.flags.authFailed === true;
    }

    private isCircuitOpen(provider: string): boolean {
        try {
            const registry = this.deps.adapterRegistry;
            const state = registry.getCircuitBreakerState(provider);
            // HALF-OPEN also counts as unavailable — only 1 concurrent test request is allowed,
            // which is insufficient for multi-agent debates. All 10+ agents would compete for
            // that single slot, causing ''max concurrent test requests reached'' cascade.
            // Probes/health-checks handle recovery independently.
            return state === 'open' || state === 'half-open';
        } catch {
            return false;
        }
    }

    providerCanBeUsed(provider: string, session: SessionProviderState): boolean {
        if (session.hasProviderFailed(provider)) return false;
        if (this.isCircuitOpen(provider)) return false;
        return true;
    }

    getLlmFailureCount(key: string): number {
        return this.llmFailureCount.get(key) || 0;
    }

    incrementLlmFailureCount(key: string): number {
        const count = this.getLlmFailureCount(key) + 1;
        this.llmFailureCount.set(key, count);
        return count;
    }

    deleteLlmFailureCount(key: string): void {
        this.llmFailureCount.delete(key);
    }

    clearSession(sessionId: string): void {
        const prefix = sessionId + ':';
        for (const [key] of this.participantProviderMap) {
            if (key.startsWith(prefix)) this.participantProviderMap.delete(key);
        }
        for (const [key] of this.llmFailureCount) {
            if (key.startsWith(prefix)) this.llmFailureCount.delete(key);
        }
    }

    clearAll(): void {
        this.participantProviderMap.clear();
        this.llmFailureCount.clear();
    }

    clearProviderCache(sessionId: string, agentId: string): void {
        this.participantProviderMap.delete(this.providerKey(sessionId, agentId));
        this.llmFailureCount.delete(this.providerKey(sessionId, agentId));
    }

    resolveProvider(
        session: SessionProviderState,
        participant: { agentId: string; provider?: string; nodeId: string; modelId?: string },
        sessionId: string,
        triedModels: Set<string>,
        triedKeys: Set<string>,
        rejectedCombos: Set<string> = new Set(),
    ): {
        key: { id: string; key: string; provider: string; availableModels?: string[] };
        modelId: string;
    } | null {
        const keyService = this.deps.keyService;
        const routerService = this.deps.routerService;

        // Build a fast lookup for rejected (provider|model|keyId) combos.
        // Any (provider, model) in a rejected combo is poisoned for the rest of
        // this callLLM — adding it to triedModels so pickBestModelForDebate skips it.
        const isComboRejected = (provider: string, model: string, keyId: string): boolean =>
            rejectedCombos.has(`${provider}|${model}|${keyId}`);
        const isModelRejectedAnyKey = (provider: string, model: string): boolean => {
            for (const c of rejectedCombos) {
                const [p, m] = c.split('|');
                if (p === provider && m === model) return true;
            }
            return false;
        };
        const hasAnyUntriedModel = (
            provider: string,
            availModels: string[] | undefined,
        ): boolean => {
            const priority = DEBATE_MODEL_PRIORITY[provider.toLowerCase()] ?? [];
            const allM = new Set([...priority, ...(availModels ?? [])]);
            if (allM.size === 0) return true;
            for (const m of allM) {
                if (!triedModels.has(m) && !isModelRejectedAnyKey(provider, m)) return true;
            }
            return false;
        };

        let resolvedKey:
            { id: string; key: string; provider: string; availableModels?: string[] } | undefined;

        const pKey = this.providerKey(sessionId, participant.agentId);

        if (participant.provider && this.providerCanBeUsed(participant.provider, session)) {
            const keys = keyService.getKeys();
            resolvedKey = keys.find(
                (k) =>
                    k.provider === participant.provider &&
                    k.status === 'active' &&
                    !this.isKeyAuthFailed(k.id) &&
                    !triedKeys.has(k.id) &&
                    hasAnyUntriedModel(k.provider, k.availableModels),
            );
        }

        if (!resolvedKey && this.participantProviderMap.has(pKey)) {
            const cachedProvider = this.participantProviderMap.get(pKey)!;
            if (this.providerCanBeUsed(cachedProvider, session)) {
                const keys = keyService.getKeys();
                resolvedKey = keys.find(
                    (k) =>
                        k.provider === cachedProvider &&
                        k.status === 'active' &&
                        !this.isKeyAuthFailed(k.id) &&
                        !triedKeys.has(k.id) &&
                        hasAnyUntriedModel(k.provider, k.availableModels),
                );
            }
        }

        if (!resolvedKey) {
            // CRITICAL: If participant specifies a modelId, find a provider that supports it
            // BEFORE falling back to getDebateProviders (which prioritizes Groq and would
            // incorrectly route e.g. "gemini-3.1-flash-lite" to the Groq adapter → 404 model_not_found.
            if (participant.modelId && participant.modelId !== 'auto') {
                const allKeys = keyService.getKeys();
                const modelKey = allKeys.find((k) => {
                    if (!this.providerCanBeUsed(k.provider, session)) return false;
                    if (k.status !== 'active') return false;
                    if (this.isKeyAuthFailed(k.id)) return false;
                    if (!hasAnyUntriedModel(k.provider, k.availableModels)) return false;
                    // Check if this provider can handle the requested model
                    if (isModelCompatibleWithProvider(participant.modelId!, k.provider)) {
                        const avail = k.availableModels ?? [];
                        if (avail.length === 0 || avail.includes(participant.modelId!)) {
                            return true;
                        }
                    }
                    return false;
                });
                if (modelKey) {
                    this.participantProviderMap.set(pKey, modelKey.provider);
                    resolvedKey = modelKey;
                }
            }
        }

        if (!resolvedKey) {
            // Request multiple providers — the top-priority ones may be in the
            // session's failedProviders list (from previous agent errors). Having
            // more candidates avoids "no available provider" cascading failures.
            const DEBATE_PROVIDER_BATCH = 5;
            const providerKeys = routerService.getDebateProviders(DEBATE_PROVIDER_BATCH);
            const pkSummary = providerKeys.map((pk) => `${pk.provider}:${pk.key.id.slice(0, 8)}`);
            rootLogger.debug('DebateProviderResolver', 'Step 4: getDebateProviders(1)', {
                count: providerKeys.length,
                providers: pkSummary,
            });
            const available = providerKeys.find(
                (pk) =>
                    this.providerCanBeUsed(pk.key.provider, session) &&
                    pk.key.status === 'active' &&
                    !this.isKeyAuthFailed(pk.key.id) &&
                    !triedKeys.has(pk.key.id) &&
                    hasAnyUntriedModel(pk.key.provider, pk.key.availableModels),
            );
            if (available) {
                rootLogger.debug('DebateProviderResolver', 'Step 4: found provider', {
                    provider: available.key.provider,
                    keyId: available.key.id.slice(0, 8),
                });
                this.participantProviderMap.set(pKey, available.key.provider);
                resolvedKey = available.key;
            } else {
                const failedProvidersArr = Array.from(
                    (session as { _failedProviders?: Set<string> })._failedProviders ?? [],
                );
                const triedDetails = providerKeys.map(
                    (pk) =>
                        `${pk.provider}:${pk.key.id.slice(0, 8)} canUse=${this.providerCanBeUsed(pk.key.provider, session)} active=${pk.key.status === 'active'} authOk=${!this.isKeyAuthFailed(pk.key.id)} triedAlready=${triedKeys.has(pk.key.id)}`,
                );
                rootLogger.warn('DebateProviderResolver', 'Step 4: no available provider', {
                    triedKeys: triedDetails,
                    failedProviders: failedProvidersArr,
                });
            }
        }

        if (!resolvedKey) {
            const ranked = routerService.getRankedProviders('performance', 'debate');
            const allKeys = keyService.getKeys();
            const available = ranked.find((k) => {
                if (!this.providerCanBeUsed(k.provider, session)) return false;
                if (triedKeys.has(k.id)) return false;
                if (!hasAnyUntriedModel(k.provider, k.availableModels)) return false;
                const key = allKeys.find((key) => key.id === k.id);
                return key?.status === 'active' && !this.isKeyAuthFailed(k.id);
            });
            if (available) resolvedKey = available;
        }

        if (!resolvedKey) {
            const allKeys = keyService.getKeys();
            const fProviders = Array.from(
                (session as { _failedProviders?: Set<string> })._failedProviders ?? [],
            );
            rootLogger.debug('DebateProviderResolver', 'Step 6: brute-force ANY active key', {
                totalKeys: allKeys.length,
                failedProviders: fProviders,
                triedKeys: triedKeys.size,
                rejectedCombos: rejectedCombos.size,
            });
            // Step 6 is last-resort: ignore session-level hasProviderFailed (which is
            // permanent per-session) because transient errors like 429 should not
            // permanently block a provider. Still check circuit breaker (temporary).
            //
            // CRITICAL: filter by triedKeys + reject any key whose ALL priority models
            // have already been rejected as duplicates for some other key. Otherwise
            // brute-force loops: pick key A → 8B duplicate → try 70B duplicate → try
            // alt key B → 8B duplicate again (same model produces same content).
            const anyAvailable = allKeys.find((k) => {
                if (k.status !== 'active') return false;
                if (this.isKeyAuthFailed(k.id)) return false;
                if (this.isCircuitOpen(k.provider)) return false;
                if (triedKeys.has(k.id)) return false;
                return hasAnyUntriedModel(k.provider, k.availableModels);
            });
            if (anyAvailable) {
                rootLogger.debug('DebateProviderResolver', 'Step 6: brute-force resolved', {
                    provider: anyAvailable.provider,
                    keyId: anyAvailable.id.slice(0, 8),
                });
                resolvedKey = anyAvailable;
            } else {
                const ks = allKeys.map(
                    (k) =>
                        `${k.provider}:${k.id.slice(0, 8)} status=${k.status} canUse=${this.providerCanBeUsed(k.provider, session)} authOk=${!this.isKeyAuthFailed(k.id)} triedAlready=${triedKeys.has(k.id)}`,
                );
                rootLogger.warn('DebateProviderResolver', 'Step 6: ALL keys unavailable!', {
                    keySummary: ks,
                    rejectedCombos: Array.from(rejectedCombos),
                });
            }
        }

        if (!resolvedKey) return null;

        // Merge rejectedCombos into a per-key skip set so pickBestModelForDebate
        // never picks a (provider, model) that's been flagged as duplicate.
        // Without this, brute-force finds a fresh key, then pickBestModelForDebate
        // returns the same model from priority list, producing the same duplicate.
        const effectiveTriedModels = new Set(triedModels);
        if (rejectedCombos.size > 0) {
            for (const c of rejectedCombos) {
                const [p, m] = c.split('|');
                if (m) {
                    // If the rejected combo was on a different key of the same provider,
                    // we still skip the model on this key — same model = same content.
                    if (p === resolvedKey.provider) effectiveTriedModels.add(m);
                    // If the rejected combo was on THIS key, also skip (exact match).
                    if (c === `${resolvedKey.provider}|${m}|${resolvedKey.id}`) {
                        effectiveTriedModels.add(m);
                    }
                }
            }
        }

        const avail = resolvedKey.availableModels ?? [];
        const modelId =
            pickBestModelForDebate(
                resolvedKey.provider,
                avail,
                participant.modelId,
                effectiveTriedModels,
            ) ||
            (avail.length > 0 ? avail.find((m) => !effectiveTriedModels.has(m)) : undefined) ||
            (DEBATE_MODEL_PRIORITY[resolvedKey.provider.toLowerCase()] ?? []).find(
                (m) => !effectiveTriedModels.has(m),
            ) ||
            'auto';

        // Final guard: if modelId resolves to 'auto' but every model for this key
        // has been tried/rejected, abort the resolve rather than returning a doomed
        // combo (auto fallback would re-pick a tried model and hit dedup again).
        if (modelId === 'auto') {
            const priority = DEBATE_MODEL_PRIORITY[resolvedKey.provider.toLowerCase()] ?? [];
            const allModelsForKey = new Set([...priority, ...avail]);
            let hasUntriedAndUnrejected = false;
            for (const m of allModelsForKey) {
                if (
                    !effectiveTriedModels.has(m) &&
                    !isComboRejected(resolvedKey.provider, m, resolvedKey.id)
                ) {
                    hasUntriedAndUnrejected = true;
                    break;
                }
            }
            if (!hasUntriedAndUnrejected && allModelsForKey.size > 0) {
                rootLogger.warn('DebateProviderResolver', 'No fresh model for resolved key', {
                    provider: resolvedKey.provider,
                    keyId: resolvedKey.id.slice(0, 8),
                    rejectedCombos: Array.from(rejectedCombos),
                });
                return null;
            }
        }

        return { key: resolvedKey, modelId };
    }
}

export class DebateQueryEngine implements IDebateQueryEngine {
    query(
        session: DebateSession,
        criteria: {
            agentId?: string;
            round?: number;
            type?: string;
            confidenceMin?: number;
        },
    ): TimelineEntry[] {
        const entries: TimelineEntry[] =
            (session.arguments?.map((arg) => ({
                type: 'agent:responded',
                payload: arg,
                timestamp: arg.timestamp,
            })) as TimelineEntry[]) ?? [];

        return entries.filter((e) => {
            const arg = e.payload as { agentId?: string; round?: number; confidence?: number };
            if (criteria.agentId && arg.agentId !== criteria.agentId) return false;
            if (criteria.round !== undefined && arg.round !== criteria.round) return false;
            if (
                criteria.confidenceMin !== undefined &&
                (arg.confidence ?? 0) < criteria.confidenceMin
            )
                return false;
            return true;
        });
    }
}
