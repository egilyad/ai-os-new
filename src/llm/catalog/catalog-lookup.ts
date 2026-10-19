import {
    CATALOG_CAPABILITIES,
    CATALOG_CONTEXT_WINDOWS,
    CATALOG_PRICING,
    type CatalogPricing,
    type ModelCapabilities,
} from './models-catalog';

/** Provider prefixes that are stripped when resolving a model id. */
const PROVIDER_PREFIXES = [
    'openrouter',
    'groq',
    'nvidia',
    'togetherai',
    'cerebras',
    'perplexity',
    'openai',
    'anthropic',
    'google',
    'gemini',
    'mistral',
    'cohere',
    'deepseek',
    'alibaba',
    'qwen',
    'moonshotai',
    'zhipuai',
    'xai',
    'grok',
    'minimax',
    'meta-llama',
    'meta',
    'azure',
    'bedrock',
    'ollama',
    'lmstudio',
];

/**
 * Candidate lookup keys for a raw model string, most specific first.
 * `openai/gpt-4o` -> ['openai/gpt-4o', 'gpt-4o']; `anthropic/claude-opus-4.7` keeps
 * the vendor-scoped form first because the catalog stores OpenRouter-style ids too.
 */
export function modelLookupKeys(model: string): string[] {
    const raw = model.toLowerCase().trim();
    if (!raw) return [];
    const keys = [raw];
    for (const prefix of PROVIDER_PREFIXES) {
        if (raw.startsWith(`${prefix}/`)) {
            keys.push(raw.slice(prefix.length + 1));
            break;
        }
        if (raw.startsWith(`${prefix}:`)) {
            keys.push(raw.slice(prefix.length + 1));
            break;
        }
    }
    const slash = raw.lastIndexOf('/');
    if (slash > 0 && slash < raw.length - 1) {
        const tail = raw.slice(slash + 1);
        if (!keys.includes(tail)) keys.push(tail);
    }
    return keys;
}

function resolve<T>(map: Record<string, T>, model: string): T | undefined {
    for (const key of modelLookupKeys(model)) {
        const hit = map[key];
        if (hit !== undefined) return hit;
    }
    return undefined;
}

/** Context window (tokens) for a model id, or undefined when unknown. */
export function getCatalogContextWindow(model: string): number | undefined {
    return resolve(CATALOG_CONTEXT_WINDOWS, model);
}

/** Pricing per 1M tokens for a model id, or undefined when unknown. */
export function getCatalogPricing(model: string): CatalogPricing | undefined {
    return resolve(CATALOG_PRICING, model);
}

/** Capability flags (tool calling, vision, reasoning) for a model id. */
export function getCatalogCapabilities(model: string): ModelCapabilities | undefined {
    return resolve(CATALOG_CAPABILITIES, model);
}
