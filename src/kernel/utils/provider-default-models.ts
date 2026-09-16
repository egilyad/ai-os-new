/** Single source of truth for per-provider default model names.
 *  All production code should import from here instead of hardcoding model strings. */
export const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
    // Aug-2026: llama-3.3-70b-versatile / llama-3.1-8b-instant decommissioned by Groq — use Llama 4
    groq: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    gemini: 'gemini-3.1-flash-lite',
    gemini_flash: 'gemini-3.1-flash-lite',
    gemini_pro: 'gemini-3.1-pro',
    anthropic: 'claude-3-5-sonnet',
    openrouter: 'meta-llama/llama-3.1-8b-instruct',
    // Aug-2026: meta/llama-3.1-8b-instruct EOL on NIM hosted endpoint (410) — use Llama 4
    nvidia: 'meta/llama-4-maverick-17b-128e-instruct',
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
    groq: ['meta-llama/llama-4-maverick-17b-128e-instruct', 'meta-llama/llama-4-scout-17b-16e-instruct'],
    gemini: ['gemini-3.1-flash-lite', 'gemini-3.1-pro'],
    anthropic: ['claude-3-5-sonnet', 'claude-3-haiku', 'claude-3-opus'],
    nvidia: ['meta/llama-4-maverick-17b-128e-instruct', 'meta/llama-4-scout-17b-16e-instruct'],
    'nvidia-nim': ['meta/llama-4-maverick-17b-128e-instruct', 'meta/llama-4-scout-17b-16e-instruct'],
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
