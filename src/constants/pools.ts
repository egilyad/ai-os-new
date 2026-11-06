export interface PoolDef {
    id: string;
    name: string;
    color: string;
    description: string;
    providers: string[];
}

export const POOL_DEFS: PoolDef[] = [
    {
        id: 'fast',
        name: 'Fast Compute',
        color: 'var(--warning)',
        description: 'Low-latency inference for real-time agents',
        providers: ['groq', 'nvidia'],
    },
    {
        id: 'balanced',
        name: 'Balanced',
        color: 'var(--accent)',
        description: 'General-purpose routing with cost-quality tradeoff',
        providers: ['gemini', 'openrouter', 'google'],
    },
    {
        id: 'free',
        name: 'Free Tier',
        color: 'var(--success)',
        description: 'Zero-cost models with quota limits for experimentation',
        providers: ['groq', 'google', 'openrouter'],
    },
    {
        id: 'experimental',
        name: 'Experimental',
        color: 'var(--purple)',
        description: 'New/unstable providers and bleeding-edge models',
        providers: [
            'nvidia',
            'openrouter',
            'together',
            'fireworks',
            'deepseek',
            'mistral',
            'cohere',
        ],
    },
];
