/** Single source of truth for per-provider default model names.
 *  All production code should import from here instead of hardcoding model strings. */
export const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
    // Groq Oct-2026: production pins are openai/gpt-oss-120b + 20b
    // (llama-3.3-70b/3.1-8b deprecated for free/dev 2026-08-16; Llama 4
    // Maverick/Scout never listed publicly). Verified 2026-10-02.
    groq: 'openai/gpt-oss-120b',
    gemini: 'gemini-3.1-flash-lite',
    gemini_flash: 'gemini-3.1-flash-lite',
    gemini_pro: 'gemini-3.1-pro',
    anthropic: 'claude-3-5-sonnet',
    openrouter: 'meta-llama/llama-3.1-8b-instruct',
    // NVIDIA NIM Oct-2026: gpt-oss served on the API (llama-4-maverick
    // 410). Verified 2026-10-02.
    nvidia: 'openai/gpt-oss-120b',
    openai: 'gpt-4o',
    cerebras: 'cerebras-gpt-3.5',
    cloudflare: '@cf/meta/llama-3.1-8b-instruct',
    deepseek: 'deepseek-chat',
    kimi: 'kimi-k2',
    minimax: 'MiniMax-M1',
    qwen: 'qwen3-max',
};

/** Preferred models for each provider (ordered by quality). */
export const PROVIDER_PREFERRED_MODELS: Record<string, string[]> = {
    groq: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
    gemini: ['gemini-3.1-flash-lite', 'gemini-3.1-pro'],
    anthropic: ['claude-3-5-sonnet', 'claude-3-haiku', 'claude-3-opus'],
    nvidia: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
    'nvidia-nim': ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
    deepseek: ['deepseek-chat', 'deepseek-reasoner'],
    kimi: ['kimi-k2', 'kimi-k2-thinking'],
    minimax: ['MiniMax-M1'],
    qwen: ['qwen3-max', 'qwen3-plus', 'qwen3-30b-a3b'],
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
    deepseek: 'DeepSeek',
    kimi: 'Moonshot',
    minimax: 'MiniMax',
    qwen: 'Qwen',
};
