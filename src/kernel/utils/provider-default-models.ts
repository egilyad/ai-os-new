/** Single source of truth for per-provider default model names.
 *  All production code should import from here instead of hardcoding model strings. */
export const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
    groq: 'llama-3.3-70b-versatile',
    gemini: 'gemini-3.1-flash-lite',
    gemini_flash: 'gemini-3.1-flash-lite',
    gemini_pro: 'gemini-3.1-pro',
    anthropic: 'claude-3-5-sonnet',
    openrouter: 'meta-llama/llama-3.1-8b-instruct',
    nvidia: 'meta/llama-3.1-8b-instruct',
    openai: 'gpt-4o',
    cerebras: 'cerebras-gpt-3.5',
    cloudflare: '@cf/meta/llama-3.1-8b-instruct',
};

/** Preferred models for each provider (ordered by quality). */
export const PROVIDER_PREFERRED_MODELS: Record<string, string[]> = {
    groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
    gemini: ['gemini-3.1-flash-lite', 'gemini-3.1-pro'],
    anthropic: ['claude-3-5-sonnet', 'claude-3-haiku', 'claude-3-opus'],
    nvidia: ['meta/llama-3.1-8b-instruct', 'meta/llama-3.3-70b-instruct', 'mistral-7b-instruct'],
    'nvidia-nim': ['meta/llama-3.1-8b-instruct', 'meta/llama-3.3-70b-instruct'],
};

/** Human-readable provider names keyed by the canonical provider slug.
 *  Reused by the Agent Identity view so "Groq" / "Meta" is shown instead of
 *  an inferred model prefix. */
export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
    groq: 'Groq',
    gemini: 'Google',
    gemini_flash: 'Google',
    gemini_pro: 'Google',
    anthropic: 'Anthropic',
    openrouter: 'OpenRouter',
    nvidia: 'NVIDIA',
    'nvidia-nim': 'NVIDIA',
    openai: 'OpenAI',
    cerebras: 'Cerebras',
    cloudflare: 'Cloudflare',
};
