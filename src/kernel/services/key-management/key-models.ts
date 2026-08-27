import type { ApiKey } from '../../types/metrics-types';
import { EVENTS } from '../../events/event-names';
import { PROVIDER_DEFAULT_MODELS } from '../../utils/provider-default-models';
import type { IAdapterRegistry } from '../../contracts/provider-adapter';

export interface KeyModelsDeps {
    eventBus: {
        emit: (event: string, data?: unknown) => void;
    };
    registry: {
        getKey: (id: string) => ApiKey | undefined;
        modifyKey: (id: string, fn: (key: ApiKey) => void) => void;
    };
    providerAdapterRegistry?: IAdapterRegistry;
    updateKeyStatus: (id: string, status: ApiKey['status']) => void;
}

const FALLBACK_MODELS: Record<string, string[]> = {
    OpenRouter: [
        PROVIDER_DEFAULT_MODELS.openrouter!,
        'openrouter/free',
        'anthropic/claude-3-haiku-20240307',
    ],
    Gemini: ['gemini-3.1-flash-lite', 'gemini-3.1-pro'],
    Groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
    NVIDIA: ['meta/llama-3.1-8b-instruct', 'meta/llama-3.3-70b-instruct'],
    Cerebras: ['cerebras-gpt-3.5'],
    Cloudflare: ['@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
    DeepSeek: ['deepseek-chat', 'deepseek-coder'],
    Cohere: ['command-r-plus', 'command-r'],
    Blackboxapi: ['blackboxai'],
    Scaleway: ['llama-3.3-70b-instruct', 'mistral-7b-instruct'],
    Cometapi: ['gpt-4o', 'claude-3-5-sonnet'],
    GitHub: ['gpt-4o', 'meta-llama-3.1-405b-instruct'],
};

/**
 * Refreshes available models for a key via its provider adapter,
 * falling back to a static provider→models map when no adapter exists.
 */
export class KeyModels {
    constructor(private deps: KeyModelsDeps) {}

    async refreshModels(id: string) {
        const key = this.deps.registry.getKey(id);
        if (!key || !key.key) return;
        try {
            this.deps.updateKeyStatus(id, 'checking');
            const registry = this.deps.providerAdapterRegistry;
            if (!registry) return;
            const adapter = registry.getAdapter(key.provider);
            if (adapter) {
                const models = await adapter.getAvailableModels(key.key);
                if (Array.isArray(models) && models.length > 0) {
                    this.deps.registry.modifyKey(id, (k) => {
                        k.availableModels = models;
                    });
                    this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                        message: `Found ${models.length} models for ${key.provider}`,
                        type: 'success',
                    });
                }
            } else {
                const defaults: Record<string, string[]> = FALLBACK_MODELS;
                const models = defaults[key.provider] || [];
                this.deps.registry.modifyKey(id, (k) => {
                    k.availableModels = models;
                });
            }
            this.deps.updateKeyStatus(id, 'active');
        } catch (e) {
            this.deps.updateKeyStatus(id, 'error');
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Failed to refresh models: ${e instanceof Error ? e.message : String(e)}`,
                type: 'error',
            });
        }
    }
}
