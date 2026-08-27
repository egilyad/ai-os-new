import type { ApiKey } from '../../types/metrics-types';
import type { IAdapterRegistry } from '../../contracts/provider-adapter';
import { CONFIG } from '../config-registry';
import { EVENTS } from '../../events/event-names';

export class KeyDiagnostics {
    constructor(
        private deps: {
            eventBus: { emit: (event: string, data?: unknown) => void };
            providerAdapterRegistry?: IAdapterRegistry;
            advisorService?: { getSuggestions(): Array<{ targetNodeId?: string }> };
            recordUsage: (
                id: string,
                latency: number,
                tokens: number,
                model?: string,
                extra?: Record<string, unknown>,
            ) => void;
            getKey: (id: string) => ApiKey | undefined;
            getKeys: () => ApiKey[];
        },
    ) {}

    async getProviderIntrospection(
        provider: string,
        apiKey: string,
    ): Promise<Record<string, unknown>> {
        const result: Record<string, unknown> = { provider };
        try {
            const p = provider.toLowerCase();
            if (p === 'openrouter') {
                let res: Response;
                try {
                    res = await fetch('/proxy/openrouter/api/v1/auth/key', {
                        headers: { Authorization: `Bearer ${apiKey}` },
                        signal: AbortSignal.timeout(
                            CONFIG.services.keyService.introspectionTimeoutMs,
                        ),
                    });
                } catch {
                    // Handle abort/timeout - treat as graceful "no data" rather than crash
                    result['error'] = 'Introspection unavailable';
                    return result;
                }
                if (res.ok) {
                    const data = await res.json();
                    result['credits'] = data.data?.credits ?? 'unknown';
                    result['usage'] = data.data?.usage ?? 'unknown';
                    result['limit'] = data.data?.limit ?? 'unknown';
                    result['key_label'] = data.data?.key ?? 'unknown';
                } else {
                    res.body?.cancel()?.catch(() => {});
                    result['error'] = `HTTP ${res.status}: ${res.statusText}`;
                }
            } else if (p === 'openai') {
                let res: Response;
                try {
                    res = await fetch('/proxy/openai/v1/dashboard/billing/credit_grants', {
                        headers: { Authorization: `Bearer ${apiKey}` },
                        signal: AbortSignal.timeout(
                            CONFIG.services.keyService.introspectionTimeoutMs,
                        ),
                    });
                } catch {
                    result['error'] = 'Introspection unavailable';
                    return result;
                }
                if (res.ok) {
                    const data = await res.json();
                    result['total_granted'] = data.total_granted ?? 'unknown';
                    result['total_used'] = data.total_used ?? 'unknown';
                    result['total_available'] = data.total_available ?? 'unknown';
                } else {
                    res.body?.cancel()?.catch(() => {});
                    result['error'] = `HTTP ${res.status}: ${res.statusText}`;
                }
            } else if (p === 'groq') {
                let res: Response;
                try {
                    // Note: rate limit headers only returned on POST /chat/completions, not GET /models
                    res = await fetch('/proxy/groq/models', {
                        headers: { Authorization: `Bearer ${apiKey}` },
                        signal: AbortSignal.timeout(
                            CONFIG.services.keyService.introspectionTimeoutMs,
                        ),
                    });
                } catch {
                    result['error'] = 'Introspection unavailable';
                    return result;
                }
                if (res.ok) {
                    const data = await res.json();
                    const allModels =
                        (data.data as Array<{ id: string; active?: boolean }> | undefined) ?? [];
                    const activeModels = allModels.filter((m) => m.active !== false);
                    result['available_models'] = activeModels.length;
                    result['total_models'] = allModels.length;
                } else {
                    res.body?.cancel()?.catch(() => {});
                    result['error'] = `HTTP ${res.status}: ${res.statusText}`;
                }
            } else if (p === 'nvidia' || p === 'nvidia-nim') {
                let res: Response;
                try {
                    res = await fetch('/proxy/nvidia/v1/models', {
                        headers: { Authorization: `Bearer ${apiKey}` },
                        signal: AbortSignal.timeout(
                            CONFIG.services.keyService.introspectionTimeoutMs,
                        ),
                    });
                } catch {
                    result['error'] = 'Introspection unavailable';
                    return result;
                }
                if (res.ok) {
                    const data = await res.json();
                    const models = (data.data as Array<{ id: string }> | undefined) ?? [];
                    result['available_models'] = models.length;
                } else {
                    res.body?.cancel()?.catch(() => {});
                    result['error'] = `HTTP ${res.status}: ${res.statusText}`;
                }
            } else if (p === 'gemini') {
                let res: Response;
                try {
                    res = await fetch('/proxy/gemini/v1/models', {
                        headers: { 'x-goog-api-key': apiKey },
                        signal: AbortSignal.timeout(
                            CONFIG.services.keyService.introspectionTimeoutMs,
                        ),
                    });
                } catch {
                    result['error'] = 'Introspection unavailable';
                    return result;
                }
                if (res.ok) {
                    const data = await res.json();
                    const models =
                        (data.models as
                            | Array<{ name: string; supportedGenerationMethods: string[] }>
                            | undefined) ?? [];
                    result['available_models'] = models.length;
                    result['has_generation'] = models.some((m) =>
                        m.supportedGenerationMethods?.includes('generateContent'),
                    );
                } else {
                    res.body?.cancel()?.catch(() => {});
                    result['note'] =
                        'Gemini tier info not available via API; check Google AI Studio dashboard.';
                    result['models_check'] = `HTTP ${res.status}`;
                }
            } else {
                result['note'] = `No introspection endpoint for ${provider}.`;
            }
        } catch (e) {
            result['error'] = e instanceof Error ? e.message : 'Unknown request failed';
        }
        return result;
    }

    async refreshModels(id: string) {
        const key = this.deps.getKey(id);
        if (!key || !key.key) return;
        const { eventBus, providerAdapterRegistry } = this.deps;
        try {
            const registry = providerAdapterRegistry;
            if (!registry) return;
            const adapter = registry.getAdapter(key.provider);
            if (adapter) {
                const models = await adapter.getAvailableModels(key.key);
                if (Array.isArray(models) && models.length > 0) {
                    eventBus.emit(EVENTS.NOTIFICATION, {
                        message: `Found ${models.length} models for ${key.provider}`,
                        type: 'success',
                    });
                }
            }
        } catch (e) {
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Failed to refresh models: ${e instanceof Error ? e.message : String(e)}`,
                type: 'error',
            });
        }
    }

    async runBenchmark(id: string) {
        const key = this.deps.getKey(id);
        if (!key || key.status !== 'active') return;
        const testPrompts = [
            "Say 'Hello World' in exactly 2 words.",
            'Write a JSON object with 5 keys describing a spaceship.',
            'Explain quantum entanglement to a 5-year old in 3 sentences.',
        ];
        const { eventBus, providerAdapterRegistry, recordUsage } = this.deps;
        eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Starting benchmark for ${key.provider}...`,
            type: 'info',
        });
        for (const prompt of testPrompts) {
            const startTime = Date.now();
            try {
                const adapter = providerAdapterRegistry?.getAdapter(key.provider);
                if (!adapter) {
                    eventBus.emit(EVENTS.NOTIFICATION, {
                        message: `No adapter for ${key.provider}`,
                        type: 'error',
                    });
                    continue;
                }
                const model = key.availableModels?.[0] || 'default';
                const res = await adapter.sendMessage(
                    [{ role: 'user', content: prompt }],
                    model,
                    key.key,
                );
                const latency = Date.now() - startTime;
                recordUsage(
                    key.id,
                    latency,
                    Math.ceil((res.content?.length || 0) / CONFIG.traces.tokenEstimateDivisor),
                    model,
                    {
                        task: 'benchmark',
                        fullContent: res.content,
                        ttft: Math.min(latency, Math.max(50, latency * 0.3)),
                    },
                );
            } catch {
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Benchmark step failed',
                    type: 'error',
                });
            }
        }
        eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Benchmark for ${key.provider} completed`,
            type: 'success',
        });
    }

    async runAdvisor(id: string) {
        const key = this.deps.getKey(id);
        if (!key || !this.deps.advisorService) return;
        const suggestions = this.deps.advisorService
            .getSuggestions()
            .filter((s) => s.targetNodeId === id);
        if (suggestions.length > 0) {
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Advisor: ${suggestions.length} suggestion(s) for ${key.label}`,
                type: 'info',
            });
        } else {
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Advisor: No suggestions for ${key.label}`,
                type: 'success',
            });
        }
    }
}
