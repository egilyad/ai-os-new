import { CONFIG } from '../config-registry';
import type { ApiKey } from '../../types/metrics-types';
import { EVENTS } from '../../events/event-names';
import { sanitizeError } from '../../../llm/http/llm-http-client';
import type { IHealthCheckService } from '../../contracts/health-check';
import type { IAdapterRegistry } from '../../contracts/provider-adapter';

export interface KeyHealthDeps {
    eventBus: {
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    onStateChanged: (id: string, provider: string, newState: string, previousState: string) => void;
    addAlert: (keyId: string, alert: { type: string; severity: string; message: string }) => void;
    saveKeys: () => Promise<void>;
    notify: () => void;
    getKey: (id: string) => ApiKey | undefined;
    getActiveKeys: () => ApiKey[];
    modifyKey: (id: string, fn: (key: ApiKey) => void) => void;
    providerAdapterRegistry?: IAdapterRegistry;
}

export class KeyHealth implements IHealthCheckService {
    private readonly MAX_HEALTH_KEYS = 200;

    destroy(): void {
        this.rateLimitHistory.clear();
        this.retryCounts.clear();
        this.backoffMap.clear();
        this.backoffDuration.clear();
        this.backoffStartedAt.clear();
        this._healthCache.clear();
    }

    private rateLimitHistory: Map<string, number[]> = new Map();
    private retryCounts: Map<string, number> = new Map();
    private backoffMap = new Map<string, number>();
    private backoffDuration = new Map<string, number>();
    private backoffStartedAt = new Map<string, number>();

    private _trimHealthMaps(): void {
        const allMaps = [
            this.rateLimitHistory,
            this.retryCounts,
            this.backoffMap,
            this.backoffDuration,
            this.backoffStartedAt,
            this._healthCache,
        ];
        for (const map of allMaps) {
            while (map.size > this.MAX_HEALTH_KEYS) {
                const key = map.keys().next().value;
                if (key !== undefined) map.delete(key as string);
                else break;
            }
        }
    }

    constructor(private deps: KeyHealthDeps) {}

    getBackoffRemaining(keyId: string): number | null {
        const startedAt = this.backoffStartedAt.get(keyId);
        if (!startedAt) return null;
        const duration = this.backoffDuration.get(keyId) ?? CONFIG.keys.initialBackoffMs;
        const elapsed = Date.now() - startedAt;
        return Math.max(0, Math.round(duration - elapsed));
    }

    handleProviderError(key: ApiKey, error: string): void {
        this.deps.modifyKey(key.id, (k) => {
            k.status = 'error';
            if (!k.stats)
                k.stats = {
                    successCount: 0,
                    errorCount: 0,
                    totalTokens: 0,
                    avgLatency: 0,
                    minLatency: 0,
                    maxLatency: 0,
                };
            k.stats.lastError = { message: error, timestamp: new Date().toISOString() };
        });

        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Error ${key.provider}: ${sanitizeError(error).substring(0, 60)}...`,
            type: 'error',
        });
        this.transitionState(key, 'error');
    }

    check429Spike(keyId: string): void {
        const now = Date.now();
        const window = now - CONFIG.keys.rateLimitSpikeWindowMs;
        const timestamps = (this.rateLimitHistory.get(keyId) || []).filter((t) => t > window);
        timestamps.push(now);
        this.rateLimitHistory.set(keyId, timestamps);
        this._trimHealthMaps();
        if (timestamps.length >= CONFIG.keys.rateLimitSpikeThreshold) {
            this.deps.addAlert(keyId, {
                type: 'quota_exceeded',
                severity: 'high',
                message: `429 spike: ${timestamps.length} rate limits in 60s`,
            });
        }
    }

    getBackoffMs(keyId: string): number {
        const current = this.backoffMap.get(keyId) || CONFIG.keys.initialBackoffMs;
        const next = Math.min(current * 2, CONFIG.keys.maxBackoffMs);
        this.backoffMap.set(keyId, next);
        this.backoffDuration.set(keyId, current);
        this.backoffStartedAt.set(keyId, Date.now());
        this._trimHealthMaps();
        return current;
    }

    cleanupKey(keyId: string): void {
        this.rateLimitHistory.delete(keyId);
        this.retryCounts.delete(keyId);
        this.backoffMap.delete(keyId);
        this.backoffStartedAt.delete(keyId);
        this._healthCache.delete(keyId);
    }

    resetRetryCount(keyId: string): void {
        this.retryCounts.delete(keyId);
    }

    transitionState(key: ApiKey, newState: string): void {
        if (!key.stats?.extended) return;
        const oldState = key.stats.extended.state;
        if (oldState === newState) return;
        key.stats.extended.state = newState as NonNullable<ApiKey['stats']['extended']>['state'];
        this.deps.onStateChanged(key.id, key.provider, newState, oldState);
    }

    async checkHealth(
        keyId: string,
    ): Promise<{ id: string; provider: string; status: string; latency: number }> {
        const keyRef = this.deps.getKey(keyId);
        if (!keyRef) return { id: 'none', provider: 'none', status: 'error', latency: 0 };
        const provider = keyRef.provider;

        const versionAtStart = keyRef.statusVersion ?? 0;
        const start = performance.now();
        let ok = false;
        let statusCode: number | undefined;

        try {
            // CRIT-K4: Prefer adapter checkHealth which uses Authorization header
            const adapter = this.deps.providerAdapterRegistry?.getAdapter(provider);
            if (adapter?.checkHealth) {
                const result = await adapter.checkHealth(keyRef.key);
                ok = result.status === 'active';
                statusCode = ok ? 200 : 0;
            } else {
                // Fallback: URL-based health check with Authorization header
                const healthUrl = this.getHealthUrl(provider, keyRef.key);
                const headers: Record<string, string> = {};
                if (keyRef.key) {
                    if (provider.toLowerCase() === 'gemini') {
                        headers['x-goog-api-key'] = keyRef.key;
                    } else {
                        headers['Authorization'] = `Bearer ${keyRef.key}`;
                    }
                }
                const response = await fetch(healthUrl, {
                    method: 'GET',
                    headers,
                    signal: AbortSignal.timeout(CONFIG.keys.healthCheckTimeoutMs),
                });
                ok = response.ok;
                statusCode = response.status;
                if (!ok) response.body?.cancel();
            }
        } catch (e) {
            const latency = performance.now() - start;
            this._healthCache.set(keyId, Date.now());
            this._trimHealthMaps();
            this.deps.modifyKey(keyId, (key) => {
                if ((key.statusVersion ?? 0) === versionAtStart) {
                    key.status = 'error' as ApiKey['status'];
                    key.latency = latency;
                } else {
                    key.latency = latency;
                }
            });
            await this.deps.saveKeys();
            this.deps.notify();
            this.deps.eventBus.emit(EVENTS.KEY_HEALTH_CHECK_FAILED, {
                id: keyId,
                provider,
                error: e instanceof Error ? e.message : String(e),
            });
            return { id: keyId, provider, status: 'error', latency: -1 };
        }

        const latency = performance.now() - start;
        const protectedStatuses = new Set(['compromised', 'quarantined']);

        if (ok) {
            this._healthCache.delete(keyId); // HIGH-K1: clear failure cache on success
        } else {
            this._healthCache.set(keyId, Date.now());
            this._trimHealthMaps();
        }

        const newStatus = protectedStatuses.has(keyRef.status)
            ? keyRef.status
            : ok
              ? 'active'
              : 'error';

        this.deps.modifyKey(keyId, (key) => {
            if ((key.statusVersion ?? 0) === versionAtStart) {
                key.status = newStatus;
                key.latency = latency;
            } else {
                key.latency = latency;
            }
            if (ok && key.stats) {
                key.stats.avgLatency = key.stats.avgLatency * 0.7 + latency * 0.3;
            }
        });

        await this.deps.saveKeys();
        this.deps.notify();

        if (!ok) {
            this.deps.eventBus.emit(EVENTS.KEY_HEALTH_CHECK_FAILED, {
                id: keyId,
                provider,
                error: `Health check failed: ${statusCode || 'unknown'}`,
            });
        } else {
            this.deps.eventBus.emit(EVENTS.KEY_HEALTH_CHECK_COMPLETED, {
                id: keyId,
                provider,
                status: 'active',
                latency,
            });
        }
        return { id: keyId, provider, status: newStatus, latency };
    }

    private _healthCache = new Map<string, number>(); // keyId → timestamp of last failure
    private static HEALTH_RETRY_MS = 300_000; // 5min retry after failure

    async checkAllHealth(): Promise<
        { id: string; provider: string; status: string; latency: number }[]
    > {
        const activeKeys = this.deps.getActiveKeys();
        for (const k of activeKeys) this.deps.eventBus.emit(EVENTS.KEY_HEALTH_CHECK_STARTED, k.id);
        // Sequential (not parallel) to avoid memory burst
        const results: Array<{ id: string; provider: string; status: string; latency: number }> =
            [];
        for (const k of activeKeys) {
            const lastFail = this._healthCache.get(k.id);
            if (lastFail && Date.now() - lastFail < KeyHealth.HEALTH_RETRY_MS) {
                results.push({ id: k.id, provider: k.provider, status: 'error', latency: -1 });
                continue;
            }
            results.push(await this.checkHealth(k.id));
            // 50ms delay between checks to let GC breathe
            await new Promise((r) => setTimeout(r, 50));
        }
        this.deps.eventBus.emit(EVENTS.KEY_HEALTH_CHECK_COMPLETED);
        return results;
    }

    private getHealthUrl(provider: string, _apiKey?: string): string {
        const isGemini = provider.toLowerCase() === 'gemini';
        if (isGemini) {
            return 'https://generativelanguage.googleapis.com/v1/models';
        }
        const urls: Record<string, string> = {
            OpenAI: 'https://api.openai.com/v1/models',
            Gemini: 'https://generativelanguage.googleapis.com/v1/models',
            Groq: 'https://api.groq.com/openai/v1/models',
            OpenRouter: 'https://openrouter.ai/api/v1/models',
            NVIDIA: 'https://integrate.api.nvidia.com/v1/models',
            DeepSeek: 'https://api.deepseek.com/v1/models',
            Cohere: 'https://api.cohere.ai/v1/models',
            Anthropic: 'https://api.anthropic.com/v1/models',
            Mistral: 'https://api.mistral.ai/v1/models',
            Cloudflare: 'https://api.cloudflare.com/client/v4/accounts',
            Cerebras: 'https://api.cerebras.ai/v1/models',
        };
        return urls[provider] || `https://api.openai.com/v1/models`;
    }

    updateKeyStatus(key: ApiKey, status: ApiKey['status'], latency?: number): void {
        this.deps.modifyKey(key.id, (k) => {
            k.status = status;
            if (latency !== undefined) k.latency = latency;
        });
    }

    updateAvailableModels(key: ApiKey, models: string[]): void {
        key.availableModels = models;
    }

    toggleKeyStatus(key: ApiKey): void {
        this.deps.modifyKey(key.id, (k) => {
            if (k.status === 'active') {
                k.status = 'inactive';
            } else if (k.status === 'inactive' || k.status === 'error') {
                k.status = 'active';
            }
        });
        // Other states (quarantined, compromised) are not toggleable — user must use explicit recovery flow
    }

    enableAllKeys(keys: ApiKey[]): void {
        for (const k of keys)
            this.deps.modifyKey(k.id, (key) => {
                key.status = 'active';
            });
    }

    disableAllKeys(keys: ApiKey[]): void {
        for (const k of keys)
            this.deps.modifyKey(k.id, (key) => {
                key.status = 'inactive';
            });
    }

    quarantineKey(key: ApiKey, source: string): boolean {
        this.deps.modifyKey(key.id, (k) => {
            k.status = 'quarantined' as ApiKey['status'];
        });
        this.deps.addAlert(key.id, {
            type: 'security',
            severity: 'critical',
            message: `Key "${key.label}" quarantined — suspected compromise (source: ${source})`,
        });
        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Key "${key.label}" quarantined due to suspected compromise (${source})`,
            type: 'error',
        });
        return true;
    }

    compromiseKey(key: ApiKey, source: string): void {
        const prevStatus = key.status;
        this.deps.modifyKey(key.id, (k) => {
            k.status = 'compromised' as ApiKey['status'];
        });
        // Wipe the key material entirely instead of leaving a sentinel
        // string in place. Previously we wrote `key.key = '[COMPROMISED]'`
        // and left `isEncrypted: false`, which (a) got re-encrypted on the
        // next save (vault.encryptAllKeys sees non-empty key + not encrypted
        // and encrypts the sentinel), and (b) could leak into LLM requests
        // if any code path forgot to filter on status === 'compromised'.
        key.key = '';
        key.isEncrypted = true;

        this.deps.addAlert(key.id, {
            type: 'compromise',
            severity: 'critical',
            message: `Key "${key.label}" marked COMPROMISED — revoked from rotation (source: ${source})`,
        });

        this.transitionState(key, 'DISABLED');

        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Key "${key.label}" COMPROMISED via ${source} — revoked from all pools`,
            type: 'error',
        });

        this.deps.eventBus.emitOnce(
            EVENTS.KEY_STATE_CHANGED,
            `${key.id}:${key.provider}:compromised`,
            {
                id: key.id,
                provider: key.provider,
                state: 'compromised',
                previousState: prevStatus,
            },
        );
    }
}
