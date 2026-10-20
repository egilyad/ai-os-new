/**
 * Free-tier provider registry.
 *
 * Data source: the `free-llm-tracker` project (MIT) — a maintained list of
 * LLM providers that give free access or trial credits. Only the *facts* were
 * taken over (provider, signup URL, env var names, quota summary); no code.
 *
 * The registry answers two questions the rest of the system needs:
 *  - which providers can be used without a paid plan (`freeOnly` policy in the
 *    agent permissions tab);
 *  - where to get a key and what the quota looks like.
 *
 * Limits change over time — treat `limits` as a hint, not a contract.
 */

export type FreeTierKind = 'free' | 'credits';

export interface FreeTierProvider {
    /** Canonical provider slug used across this project. */
    id: string;
    label: string;
    kind: FreeTierKind;
    /** Where to obtain a key. */
    signupUrl: string;
    /** Environment variables that must hold the key. */
    envVars: string[];
    /** Base URL of the OpenAI-compatible endpoint, when applicable. */
    apiBaseUrl?: string;
    /** Endpoint that enumerates the available models. */
    modelsEndpoint?: string;
    /** Human-readable quota summary. */
    limits: string;
    /** Extra caveats (phone verification, training data usage, ...). */
    notes?: string;
    /** Models known to be served on the free tier. */
    freeModels?: string[];
}

export const FREE_TIER_PROVIDERS: Readonly<Record<string, FreeTierProvider>> = {
    openrouter: {
        id: 'openrouter',
        label: 'OpenRouter',
        kind: 'free',
        signupUrl: 'https://openrouter.ai',
        envVars: ['OPENROUTER_API_KEY'],
        apiBaseUrl: 'https://openrouter.ai/api/v1',
        modelsEndpoint: 'https://openrouter.ai/api/v1/models',
        limits: '20 req/min, 50 req/day; до 1000 req/day после $10 пополнения',
        notes: 'Модели делят общую квоту. Free-модели помечены суффиксом :free.',
        freeModels: [
            'meta-llama/llama-3.3-70b-instruct:free',
            'meta-llama/llama-3.1-405b-instruct:free',
            'google/gemma-3-27b-it:free',
            'deepseek/deepseek-r1-0528:free',
            'qwen/qwen3-235b-a22b:free',
            'openai/gpt-oss-120b:free',
        ],
    },
    gemini: {
        id: 'gemini',
        label: 'Google AI Studio',
        kind: 'free',
        signupUrl: 'https://aistudio.google.com',
        envVars: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
        apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        limits: '250 000 токенов/мин; 20 req/day на Flash, 5 req/min',
        notes: 'Вне UK/CH/EEA/EU данные могут использоваться для обучения.',
        freeModels: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemma-3-27b-it'],
    },
    nvidia: {
        id: 'nvidia',
        label: 'NVIDIA NIM',
        kind: 'free',
        signupUrl: 'https://build.nvidia.com',
        envVars: ['NVIDIA_API_KEY'],
        apiBaseUrl: 'https://integrate.api.nvidia.com/v1',
        limits: '40 req/min',
        notes: 'Требуется подтверждение телефона. Контекст у моделей часто ограничен.',
    },
    cerebras: {
        id: 'cerebras',
        label: 'Cerebras',
        kind: 'free',
        signupUrl: 'https://cloud.cerebras.ai',
        envVars: ['CEREBRAS_API_KEY'],
        apiBaseUrl: 'https://api.cerebras.ai/v1',
        limits: '30 req/min, 900 req/hour, 14 400 req/day (для gpt-oss и Qwen 3 235B)',
        freeModels: ['gpt-oss-120b', 'qwen-3-235b-a22b-instruct', 'llama-3.3-70b'],
    },
    groq: {
        id: 'groq',
        label: 'Groq',
        kind: 'free',
        signupUrl: 'https://console.groq.com',
        envVars: ['GROQ_API_KEY'],
        apiBaseUrl: 'https://api.groq.com/openai/v1',
        modelsEndpoint: 'https://api.groq.com/openai/v1/models',
        limits: '1 000 req/day и 8 000 токенов/мин для gpt-oss; до 14 400 req/day для Llama 3.1 8B',
        freeModels: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'],
    },
    cohere: {
        id: 'cohere',
        label: 'Cohere',
        kind: 'free',
        signupUrl: 'https://cohere.com',
        envVars: ['CO_API_KEY'],
        apiBaseUrl: 'https://api.cohere.com/v1',
        limits: '20 req/min, 1 000 req/month',
        notes: 'Модели делят общую месячную квоту.',
    },
    mistral: {
        id: 'mistral',
        label: 'Mistral (La Plateforme)',
        kind: 'free',
        signupUrl: 'https://console.mistral.ai',
        envVars: ['MISTRAL_API_KEY'],
        apiBaseUrl: 'https://api.mistral.ai/v1',
        limits: '1 req/s, 500 000 токенов/мин, 1e9 токенов/мес',
        notes: 'Free-tier требует согласия на использование данных для обучения и подтверждения телефона.',
    },
    codestral: {
        id: 'codestral',
        label: 'Mistral (Codestral)',
        kind: 'free',
        signupUrl: 'https://codestral.mistral.ai',
        envVars: ['CODESTRAL_API_KEY'],
        limits: '30 req/min, 2 000 req/day',
        notes: 'Требуется подтверждение телефона.',
    },
    cloudflare: {
        id: 'cloudflare',
        label: 'Cloudflare Workers AI',
        kind: 'free',
        signupUrl: 'https://developers.cloudflare.com/workers-ai',
        envVars: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_KEY'],
        apiBaseUrl: 'https://api.cloudflare.com/client/v4/accounts/{account_id}/ai',
        limits: '10 000 нейронов/день',
        freeModels: [
            '@cf/openai/gpt-oss-120b',
            '@cf/meta/llama-3.3-70b-instruct-fp8',
            '@cf/qwen/qwen3-30b-a3b-fp8',
        ],
    },
    'github-models': {
        id: 'github-models',
        label: 'GitHub Models',
        kind: 'free',
        signupUrl: 'https://github.com/marketplace/models',
        envVars: ['GITHUB_TOKEN'],
        limits: 'Зависит от тарифа Copilot (Free/Pro/Pro+/Business/Enterprise)',
        notes: 'Очень жёсткие лимиты по входным и выходным токенам.',
    },
    huggingface: {
        id: 'huggingface',
        label: 'HuggingFace Inference Providers',
        kind: 'credits',
        signupUrl: 'https://huggingface.co/docs/inference-providers',
        envVars: ['HF_TOKEN', 'HUGGINGFACE_API_KEY'],
        limits: '$0.10/мес в кредитах',
        notes: 'Serverless Inference ограничен моделями меньше 10GB.',
    },
    vercel: {
        id: 'vercel',
        label: 'Vercel AI Gateway',
        kind: 'credits',
        signupUrl: 'https://vercel.com/docs/ai-gateway',
        envVars: ['AI_GATEWAY_API_KEY'],
        limits: '$5/мес',
        notes: 'Маршрутизирует к поддерживаемым провайдерам.',
    },
    chutes: {
        id: 'chutes',
        label: 'Chutes',
        kind: 'free',
        signupUrl: 'https://chutes.ai',
        envVars: ['CHUTES_API_KEY'],
        modelsEndpoint: 'https://api.chutes.ai/chutes/?include_public=true&limit=1000',
        limits: 'Бесплатные публичные модели Chutes',
    },
    sambanova: {
        id: 'sambanova',
        label: 'SambaNova Cloud',
        kind: 'credits',
        signupUrl: 'https://cloud.sambanova.ai',
        envVars: ['SAMBANOVA_API_KEY'],
        apiBaseUrl: 'https://api.sambanova.ai/v1',
        limits: '$5 на 3 месяца',
    },
    scaleway: {
        id: 'scaleway',
        label: 'Scaleway Generative APIs',
        kind: 'credits',
        signupUrl: 'https://console.scaleway.com/generative-api/models',
        envVars: ['SCALEWAY_API_KEY'],
        limits: '1 000 000 бесплатных токенов',
    },
    hyperbolic: {
        id: 'hyperbolic',
        label: 'Hyperbolic',
        kind: 'credits',
        signupUrl: 'https://app.hyperbolic.xyz',
        envVars: ['HYPERBOLIC_API_KEY'],
        apiBaseUrl: 'https://api.hyperbolic.xyz/v1',
        limits: '$1 кредитов',
    },
    novita: {
        id: 'novita',
        label: 'Novita',
        kind: 'credits',
        signupUrl: 'https://novita.ai',
        envVars: ['NOVITA_API_KEY'],
        limits: '$0.5 на 1 год',
    },
    ai21: {
        id: 'ai21',
        label: 'AI21',
        kind: 'credits',
        signupUrl: 'https://studio.ai21.com',
        envVars: ['AI21_API_KEY'],
        limits: '$10 на 3 месяца',
    },
    upstage: {
        id: 'upstage',
        label: 'Upstage',
        kind: 'credits',
        signupUrl: 'https://console.upstage.ai',
        envVars: ['UPSTAGE_API_KEY'],
        apiBaseUrl: 'https://api.upstage.ai/v1',
        limits: '$10 на 3 месяца',
    },
    fireworks: {
        id: 'fireworks',
        label: 'Fireworks',
        kind: 'credits',
        signupUrl: 'https://fireworks.ai',
        envVars: ['FIREWORKS_API_KEY'],
        apiBaseUrl: 'https://api.fireworks.ai/inference/v1',
        limits: '$1 кредитов',
    },
    nebius: {
        id: 'nebius',
        label: 'Nebius',
        kind: 'credits',
        signupUrl: 'https://studio.nebius.com',
        envVars: ['NEBIUS_API_KEY'],
        limits: '$1 кредитов',
    },
    baseten: {
        id: 'baseten',
        label: 'Baseten',
        kind: 'credits',
        signupUrl: 'https://app.baseten.co',
        envVars: ['BASETEN_API_KEY'],
        limits: '$30 кредитов',
    },
    inference: {
        id: 'inference',
        label: 'Inference.net',
        kind: 'credits',
        signupUrl: 'https://inference.net',
        envVars: ['INFERENCE_API_KEY'],
        limits: '$1 кредитов ($25 за опрос)',
    },
    'nlp-cloud': {
        id: 'nlp-cloud',
        label: 'NLP Cloud',
        kind: 'credits',
        signupUrl: 'https://nlpcloud.com/home',
        envVars: ['NLPCLOUD_API_KEY'],
        limits: '$15 кредитов',
        notes: 'Требуется подтверждение телефона.',
    },
    alibaba: {
        id: 'alibaba',
        label: 'Alibaba Cloud (International) Model Studio',
        kind: 'credits',
        signupUrl: 'https://bailian.console.alibabacloud.com',
        envVars: ['DASHSCOPE_API_KEY', 'ALIBABA_API_KEY'],
        limits: '1 000 000 токенов на модель',
    },
    'google-vertex': {
        id: 'google-vertex',
        label: 'Google Cloud Vertex AI',
        kind: 'free',
        signupUrl: 'https://console.cloud.google.com/vertex-ai/model-garden',
        envVars: ['GCP_PROJECT_ID', 'GOOGLE_API_KEY'],
        limits: '30–60 req/min, бесплатно в рамках preview',
        notes: 'Строгая проверка платёжных данных Google Cloud.',
    },
};

export const FREE_TIER_PROVIDER_IDS: string[] = Object.keys(FREE_TIER_PROVIDERS);

/** Providers with an unlimited-usage free tier (no expiring credits). */
export function getFreeTierProviders(kind?: FreeTierKind): FreeTierProvider[] {
    const all = Object.values(FREE_TIER_PROVIDERS);
    return kind ? all.filter((p) => p.kind === kind) : all;
}

export function isFreeTierProvider(providerId: string): boolean {
    return providerId in FREE_TIER_PROVIDERS;
}

/** Resolve the first env var that is set for a provider. */
export function resolveProviderEnvVar(
    providerId: string,
    env: Record<string, string | undefined>,
): string | undefined {
    const provider = FREE_TIER_PROVIDERS[providerId];
    if (!provider) return undefined;
    return provider.envVars.find((name) => Boolean(env[name]));
}

/**
 * Model ids served on the free tier of a provider.
 * Used by the "free-only" provider policy to keep a rotation inside the quota.
 */
export function getFreeModels(providerId: string): string[] {
    return FREE_TIER_PROVIDERS[providerId]?.freeModels ?? [];
}

/**
 * Resolve a free model of a provider, preferring the provider's default model
 * when it is served for free.
 */
export function resolveFreeModel(
    providerId: string,
    preferredModel?: string,
): string | undefined {
    const free = getFreeModels(providerId);
    if (!free.length) return preferredModel;
    if (preferredModel && free.includes(preferredModel)) return preferredModel;
    return free[0];
}
