import type { ApiKey } from '../../types/metrics-types';
import { rootLogger } from '../logger-service';
import { PROVIDER_DEFAULT_MODELS } from '../../utils/provider-default-models';

const LOGGER = rootLogger.child('KeyFingerprints');

export class KeyFingerprints {
    async fingerprintKey(apiKey: string): Promise<string> {
        const normalized = apiKey.trim();
        const encoder = new TextEncoder();
        const data = encoder.encode(normalized);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async findDuplicateFingerprints(
        existingKeys: ApiKey[],
        newKeys: string[],
    ): Promise<Map<string, string[]>> {
        const existing = new Set<string>();
        for (const k of existingKeys) {
            if (k.key) existing.add(await this.fingerprintKey(k.key));
        }
        const batchFingerprints = new Map<string, string[]>();
        for (const key of newKeys) {
            const fp = await this.fingerprintKey(key);
            const existingBatch = batchFingerprints.get(fp) || [];
            existingBatch.push(key);
            batchFingerprints.set(fp, existingBatch);
        }
        const duplicates = new Map<string, string[]>();
        for (const [fp, batchKeys] of batchFingerprints) {
            if (batchKeys.length > 1 || existing.has(fp)) {
                duplicates.set(fp, batchKeys);
            }
        }
        if (duplicates.size > 0) {
            LOGGER.warn('KeyFingerprints', 'Duplicate keys detected', {
                duplicateCount: duplicates.size,
            });
        }
        return duplicates;
    }

    detectProvider(apiKey: string): string | null {
        if (!apiKey.trim()) return null;
        const patterns: [string, RegExp][] = [
            ['gemini', /^AIza/],
            ['groq', /^gsk_/],
            ['anthropic', /^sk-ant-/],
            ['nvidia', /^nvapi-/],
            ['huggingface', /^hf_/],
            ['openrouter', /^sk-or-/],
            ['fireworks', /^fw_/],
            ['deepseek', /^sk-[a-f0-9]{32}$/],
            ['github', /^ghp_/],
            ['scaleway', /^[0-9a-f]{40}$/],
            ['cometapi', /^sk-[a-zA-Z0-9]{45,}/],
            ['openai', /^sk-(proj-)?[A-Za-z0-9_-]{20,}/],
            ['mistral', /^[A-Za-z0-9]{40,}$/],
            ['cohere', /^[A-Za-z0-9]{40,}$/],
            ['cerebras', /^cerebras_/],
            ['cloudflare', /^[a-f0-9]{32}:[A-Za-z0-9_-]{40,}$/],
        ];
        for (const [provider, regex] of patterns) {
            if (regex.test(apiKey.trim())) return provider;
        }
        return null;
    }

    async matchesProviderFormat(provider: string, apiKey: string): Promise<boolean> {
        if (!apiKey.trim()) return false;
        const detected = this.detectProvider(apiKey);
        return detected !== null && detected.toLowerCase() === provider.toLowerCase();
    }

    /** @deprecated Use matchesProviderFormat — this method only checks format prefix, not actual key validity */
    async verifyKey(provider: string, apiKey: string): Promise<boolean> {
        return this.matchesProviderFormat(provider, apiKey);
    }

    suggestModel(provider: string): string | null {
        const suggestions: Record<string, string> = {
            ...PROVIDER_DEFAULT_MODELS,
            openai: 'gpt-4o-mini',
            openrouter: 'openai/gpt-4o-mini',
            nvidia: 'meta/llama-3.3-70b-instruct',
            deepseek: 'deepseek-chat',
            mistral: 'mistral-small',
            cohere: 'command-r-plus',
            fireworks: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
            cerebras: 'llama-3.1-8b',
            huggingface: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
        };
        return suggestions[provider.toLowerCase()] || null;
    }

    extractAccountId(provider: string, apiKey: string): string {
        const key = apiKey.trim();
        switch (provider.toLowerCase()) {
            case 'cloudflare': {
                const parts = key.split(':');
                return parts.length >= 2 ? `cf-${parts[0]!.slice(0, 12)}` : 'cloudflare-default';
            }
            case 'openai': {
                const projMatch = key.match(/^sk-proj-([A-Za-z0-9]+)/);
                if (projMatch) return `openai-proj-${projMatch[1]!.toLowerCase()}`;
                return 'openai-default';
            }
            case 'openrouter': {
                return 'openrouter-default';
            }
            case 'gemini': {
                return 'gemini-default';
            }
            case 'groq': {
                return 'groq-default';
            }
            case 'nvidia': {
                return 'nvidia-default';
            }
            case 'huggingface': {
                return 'huggingface-default';
            }
            case 'fireworks': {
                return 'fireworks-default';
            }
            case 'deepseek': {
                return 'deepseek-default';
            }
            case 'mistral': {
                return 'mistral-default';
            }
            case 'cohere': {
                return 'cohere-default';
            }
            case 'cerebras': {
                return 'cerebras-default';
            }
            case 'anthropic': {
                return 'anthropic-default';
            }
            default:
                return `${(provider || 'unknown').toLowerCase()}-default`;
        }
    }

    extractAccountLabel(provider: string, apiKey: string): string {
        const key = apiKey.trim();
        switch (provider.toLowerCase()) {
            case 'cloudflare': {
                const parts = key.split(':');
                return parts.length >= 2
                    ? `Cloudflare Account ${parts[0]!.slice(0, 12)}...`
                    : 'Cloudflare (default)';
            }
            case 'openai': {
                const projMatch = key.match(/^sk-proj-([A-Za-z0-9]+)/);
                if (projMatch) return `Project ${projMatch[1]!.slice(0, 8)}...`;
                return 'OpenAI Personal Account';
            }
            case 'gemini':
                return 'Google Cloud (Gemini)';
            case 'openrouter':
                return 'OpenRouter Account';
            case 'groq':
                return 'Groq Cloud Account';
            case 'nvidia':
                return 'NVIDIA Account';
            case 'huggingface':
                return 'HuggingFace Account';
            case 'fireworks':
                return 'Fireworks Account';
            case 'deepseek':
                return 'DeepSeek Account';
            case 'mistral':
                return 'Mistral AI Account';
            case 'cohere':
                return 'Cohere Account';
            case 'cerebras':
                return 'Cerebras Account';
            case 'anthropic':
                return 'Anthropic Account';
            default:
                return `${provider || 'Unknown'} Account`;
        }
    }
}
