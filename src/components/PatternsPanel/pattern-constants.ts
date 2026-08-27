export interface PatternNote {
    id: string;
    title: string;
    category: 'architecture' | 'insight' | 'best-practice' | 'routing' | 'experimental';
    provider?: 'google' | 'groq' | 'nvidia' | 'openrouter' | 'all';
    content: string;
    tags: string[];
    links: string[];
    timestamp: number;
}

export const INITIAL_NOTES: PatternNote[] = [
    {
        id: 'p1',
        title: 'Google Gemini 2.0 Flash: Streaming Optimization',
        category: 'best-practice',
        provider: 'google',
        content:
            'When using Gemini 2.0 Flash, ensure that safety settings are balanced. High latency spikes often occur when safety filters are overly aggressive at the block level. Better to handle at the PolicyService level after streaming starts.',
        tags: ['streaming', 'latency', 'safety'],
        links: ['https://ai.google.dev/docs'],
        timestamp: Date.now(),
    },
    {
        id: 'p2',
        title: 'Groq: Low Latency Routing Pattern',
        category: 'routing',
        provider: 'groq',
        content:
            'For simple classification tasks (under 200 tokens), Groq Llama-3-8b is 5x more efficient than Gemini. The router should prefer Groq specifically for prompt classification and initial intent detection.',
        tags: ['performance', 'routing', 'efficiency'],
        links: [],
        timestamp: Date.now(),
    },
];

export const providerColors: Record<string, string> = {
    google: '#8b5cf6',
    groq: '#10b981',
    nvidia: '#f59e0b',
    openrouter: '#3b82f6',
    all: '#94a3b8',
};

export const PROVIDER_TABS = ['all', 'google', 'groq', 'nvidia', 'openrouter'] as const;
