import type { AccountGroup } from '../../kernel/contracts/key-intelligence';

export interface BulkImportReport {
    added: number;
    duplicates: number;
    invalid: number;
    total: number;
    breakdown: Record<string, { added: number; duplicates: number; invalid: number }>;
    groups: AccountGroup[];
    healthIssues: { provider: string; issue: string }[];
}

export const PROVIDER_META: Record<string, { name: string; desc: string; docsUrl: string | null }> =
    {
        OpenRouter: {
            name: 'OpenRouter',
            desc: 'Access to hundreds of models',
            docsUrl: 'https://openrouter.ai/keys',
        },
        OpenAI: {
            name: 'OpenAI',
            desc: 'GPT-4 and other models',
            docsUrl: 'https://platform.openai.com/api-keys',
        },
        Gemini: {
            name: 'Google Gemini',
            desc: 'Powerful multimodal models',
            docsUrl: 'https://aistudio.google.com/app/apikey',
        },
        Groq: {
            name: 'Groq Cloud',
            desc: 'Llama 3 at extreme speeds',
            docsUrl: 'https://console.groq.com/keys',
        },
        Mistral: {
            name: 'Mistral AI',
            desc: 'Fast and efficient models',
            docsUrl: 'https://console.mistral.ai/api-keys/',
        },
        Together: {
            name: 'Together AI',
            desc: 'Open-source models at scale',
            docsUrl: 'https://api.together.xyz/settings/api-keys',
        },
        Fireworks: {
            name: 'Fireworks AI',
            desc: 'High-performance inference',
            docsUrl: 'https://fireworks.ai/account/api-keys',
        },
        DeepSeek: {
            name: 'DeepSeek',
            desc: 'Chinese AI models',
            docsUrl: 'https://platform.deepseek.com/api_keys',
        },
        Cohere: {
            name: 'Cohere',
            desc: 'Enterprise NLP models',
            docsUrl: 'https://dashboard.cohere.com/api-keys',
        },
        HuggingFace: {
            name: 'HuggingFace',
            desc: 'Open-source models',
            docsUrl: 'https://huggingface.co/settings/tokens',
        },
        NVIDIA: {
            name: 'NVIDIA NIM',
            desc: 'Optimized inference for enterprise',
            docsUrl: 'https://build.nvidia.com/explore/discover',
        },
        Cerebras: {
            name: 'Cerebras',
            desc: '1M tok/day free, 2000 tok/s',
            docsUrl: 'https://inference.cerebras.ai/',
        },
        Cloudflare: {
            name: 'Cloudflare Workers AI',
            desc: '300 RPM free, many open models',
            docsUrl: 'https://developers.cloudflare.com/workers-ai/',
        },
        Azure: {
            name: 'Azure OpenAI',
            desc: 'Microsoft Azure AI',
            docsUrl: 'https://portal.azure.com/',
        },
        Perplexity: {
            name: 'Perplexity AI',
            desc: 'Fast search-augmented models',
            docsUrl: 'https://www.perplexity.ai/settings/api',
        },
        Custom: {
            name: 'Custom / Proxy',
            desc: 'Your own server or alternative API',
            docsUrl: null,
        },
    };
