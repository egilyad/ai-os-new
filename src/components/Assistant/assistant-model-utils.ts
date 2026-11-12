import type { ApiKey } from '../../kernel/types/metrics-types';

/**
 * Provider display names -> catalog provider ids (mirror of Model Explorer).
 */
export const ASSISTANT_PROVIDER_TO_CATALOG: Record<string, string[]> = {
    OpenRouter: ['openrouter'],
    OpenAI: ['openai'],
    Gemini: ['google', 'gemini'],
    Groq: ['groq'],
    NVIDIA: ['nvidia'],
    Mistral: ['mistral'],
    Together: ['togetherai'],
    DeepSeek: ['deepseek'],
    Cohere: ['cohere'],
    Cerebras: ['cerebras'],
    Anthropic: ['anthropic'],
    xAI: ['xai'],
    ZhipuAI: ['zhipuai'],
    Moonshot: ['moonshotai'],
    Alibaba: ['alibaba'],
    Meta: ['meta'],
    Minimax: ['minimax'],
    Perplexity: ['perplexity'],
};

/**
 * Models a key provides. Prefers the provider-reported `availableModels`
 * (fetched live by the key service); falls back to the offline catalog so a
 * fresh install still offers a usable list.
 */
export async function listModelsForKey(key: ApiKey | undefined): Promise<string[]> {
    if (!key) return [];
    if (key.availableModels && key.availableModels.length > 0) {
        return [...key.availableModels];
    }
    try {
        const { MODELS_CATALOG } = await import('../../llm/catalog/models-catalog-detail');
        const direct = ASSISTANT_PROVIDER_TO_CATALOG[key.provider];
        if (direct && direct.length) {
            return MODELS_CATALOG.filter((m) => direct.includes(m.provider) && !m.deprecated).map(
                (m) => m.model,
            );
        }
        const norm = key.provider.toLowerCase();
        return MODELS_CATALOG.filter((m) => m.provider.includes(norm) && !m.deprecated).map(
            (m) => m.model,
        );
    } catch {
        return [];
    }
}
