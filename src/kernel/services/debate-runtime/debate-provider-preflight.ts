import { DEBATE_MODEL_PRIORITY, isLargeModel } from './debate-query-engine';
import type { IDebateSession } from '../../contracts/debate-runtime';
import { rootLogger } from '../logger-service';
import type { KeyServiceLike, RouterServiceLike } from './debate-engine-types';
import type { IAdapterRegistry } from '../../contracts/provider-adapter';

const LOGGER = rootLogger.child('DebateEngine');

export interface PreflightDeps {
    getKeyService: () => KeyServiceLike;
    getRouterService: () => RouterServiceLike;
    getAdapterRegistry: () => IAdapterRegistry;
    getKeyStateStore?: () => {
        get(
            id: string,
        ):
            | { flags: { authFailed: boolean; circuitOpen: boolean; rateLimited: boolean } }
            | undefined;
        update(id: string, patch: { flags: Record<string, boolean> }): void;
    };
}

// Provider-specific preflight timeout multipliers (cold-start compensation)
const PROVIDER_PREFLIGHT_TIMEOUT: Record<string, number> = {
    nvidia: 25000,
    'nvidia-nim': 25000,
};

// Warm provider cache: avoids re-preflighting known-good provider:model pairs
// across sessions. TTL: 5 minutes.
const warmCache = new Map<string, number>();
const WARM_CACHE_TTL = 5 * 60 * 1000;

export function isProviderWarm(provider: string, model: string): boolean {
    const key = `${provider}:${model}`;
    const ts = warmCache.get(key);
    return ts !== undefined && Date.now() - ts < WARM_CACHE_TTL;
}

export function markProviderWarm(provider: string, model: string): void {
    warmCache.set(`${provider}:${model}`, Date.now());
}

export function getPreflightTimeout(provider: string, model: string): number {
    const providerOverride = PROVIDER_PREFLIGHT_TIMEOUT[provider.toLowerCase()];
    if (providerOverride) return providerOverride;
    return isLargeModel(model) ? 30000 : 20000;
}

export async function runProviderPreflight(
    sessionId: string,
    session: IDebateSession,
    deps: PreflightDeps,
    preflightDone: Set<string>,
    preflightingProviders: Set<string>,
): Promise<void> {
    if (preflightDone.has(sessionId)) return;
    preflightDone.add(sessionId);

    const keyService = deps.getKeyService();
    const adapterRegistry = deps.getAdapterRegistry();
    const providers = new Set<string>();
    for (const p of session.participants) {
        if (p.provider) providers.add(p.provider);
    }
    // Also gather providers available via routing
    try {
        const routerKeys = deps.getRouterService().getDebateProviders(session.participants.length);
        for (const rk of routerKeys) providers.add(rk.key.provider);
    } catch {
        /* best-effort */
    }
    if (providers.size === 0) return;

    // Guard: skip preflight if keys aren't loaded yet (race condition on page load)
    const allKeys = keyService.getKeys();
    if (allKeys.length === 0) return;

    const tasks: Promise<void>[] = [];
    for (const provider of providers) {
        if (session.hasProviderFailed(provider)) continue;
        // C13: Skip provider if another session is already preflighting it
        if (preflightingProviders.has(provider)) continue;
        preflightingProviders.add(provider);
        const keys = allKeys.filter((k) => k.provider === provider && k.status === 'active');
        if (keys.length === 0) {
            session.markProviderFailed(provider);
            continue;
        }
        const key = keys[0]!;
        const adapter = adapterRegistry.getAdapter(provider);
        if (!adapter) {
            session.markProviderFailed(provider);
            continue;
        }
        const models = DEBATE_MODEL_PRIORITY[provider.toLowerCase()] ?? [];
        if (models.length === 0) continue;

        const preflightTask = (async () => {
            for (const model of models) {
                // Skip preflight for known-warm models
                if (isProviderWarm(provider, model)) {
                    LOGGER.debug('DebateEngine', `preflight: ${provider}/${model} WARM (skipping)`);
                    return;
                }

                const ctrl = new AbortController();
                const preflightTimeout = getPreflightTimeout(provider, model);
                const timer = setTimeout(
                    () => ctrl.abort(new Error('PreflightTimedOut')),
                    preflightTimeout,
                );
                let timedOut: boolean;
                try {
                    await adapter.sendMessage(
                        [{ role: 'user', content: 'Reply only: OK' }],
                        model,
                        key.key,
                        ctrl.signal,
                    );
                    markProviderWarm(provider, model);
                    LOGGER.debug(
                        'DebateEngine',
                        `preflight: ${provider}/${model} OK (${preflightTimeout}ms budget)`,
                    );
                    return; // First working model is enough for this provider
                } catch (e) {
                    const errMsg = String(e);
                    timedOut = errMsg.includes('PreflightTimedOut');
                    const sc = (e as { statusCode?: number }).statusCode;
                    const isAuth =
                        sc === 401 ||
                        sc === 402 ||
                        sc === 403 ||
                        errMsg.includes('401') ||
                        errMsg.includes('403') ||
                        errMsg.includes('Authentication failed') ||
                        errMsg.includes('Invalid API Key') ||
                        errMsg.includes('Unauthorized') ||
                        errMsg.includes('Forbidden');
                    if (isAuth) {
                        LOGGER.warn(
                            'DebateEngine',
                            `preflight: ${provider}/${model} auth error — marking provider failed`,
                        );
                        session.markProviderFailed(provider);
                        const kss = deps.getKeyStateStore?.();
                        if (kss) {
                            try {
                                kss.update(key.id, { flags: { authFailed: true } });
                            } catch {
                                /* best-effort */
                            }
                        }
                        return; // Auth errors are provider-wide, don't try other models
                    }
                    if (timedOut) {
                        LOGGER.warn(
                            'DebateEngine',
                            `preflight: ${provider}/${model} timed out (${preflightTimeout}ms) — skipping remaining models, same endpoint`,
                        );
                        // Don't try other models — same endpoint, same cold-start delay
                        break;
                    }
                    // Other transient error — try next model
                    LOGGER.warn(
                        'DebateEngine',
                        `preflight: ${provider}/${model} failed (${errMsg.slice(0, 60)}), trying next model`,
                    );
                } finally {
                    clearTimeout(timer);
                }
            }
            // All models failed for this provider
            session.markProviderFailed(provider);
            LOGGER.warn(
                'DebateEngine',
                `preflight: ${provider} — all models failed, marking provider unavailable`,
            );
        })();
        preflightTask.finally(() => preflightingProviders.delete(provider));
        tasks.push(preflightTask);
    }
    await Promise.allSettled(tasks);
}

export function evictExpiredWarmCache(): void {
    const now = Date.now();
    for (const [key, ts] of warmCache) {
        if (now - ts >= WARM_CACHE_TTL) {
            warmCache.delete(key);
        }
    }
}

export function clearWarmCacheAll(): void {
    warmCache.clear();
}

export function getWarmCacheSize(): number {
    return warmCache.size;
}
