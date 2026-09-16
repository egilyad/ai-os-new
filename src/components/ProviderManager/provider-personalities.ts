export interface ProviderPersonalityState {
    key: string;
    label: string;
    emoji: string;
    description: string;
}

export interface ProviderVoiceLines {
    greeting: string;
    working: string;
    done: string;
    error: string;
    idle: string;
}

export interface ProviderPersonality {
    name: string;
    icon: string;
    color: string;
    bg: string;
    title: string;
    description: string;
    archetype: string;
    tagline: string;
    catchphrase: string;
    tone: string;
    pace: string;
    formality: number;
    warmth: number;
    humor: number;
    states: ProviderPersonalityState[];
    voiceLines: ProviderVoiceLines;
    accentColor: string;
}

const GROQ_STATES: ProviderPersonalityState[] = [
    { key: 'active', label: 'Active', emoji: '🟢', description: 'Processing at LPU speed' },
    { key: 'idle', label: 'Idle', emoji: '😴', description: 'Waiting for next sprint' },
    { key: 'limited', label: 'Limited', emoji: '🟡', description: 'Rate limited, slowing down' },
    { key: 'broken', label: 'Broken', emoji: '🔴', description: 'Tripped, needs restart' },
    { key: 'boost', label: 'Boost', emoji: '⚡', description: 'LPU boost activated!' },
];

const ROUTER_STATES: ProviderPersonalityState[] = [
    { key: 'active', label: 'Routing', emoji: '🟢', description: 'Finding best model' },
    { key: 'fallback', label: 'Fallback', emoji: '🔄', description: 'Switching to backup' },
    { key: 'idle', label: 'Idle', emoji: '😴', description: 'Waiting for routing challenge' },
    { key: 'limited', label: 'Limited', emoji: '🟡', description: 'Few routes available' },
    { key: 'broken', label: 'Broken', emoji: '🔴', description: 'All routes failed' },
];

const TITAN_STATES: ProviderPersonalityState[] = [
    {
        key: 'active',
        label: 'Processing',
        emoji: '🟢',
        description: 'Enterprise inference engaged',
    },
    { key: 'batch', label: 'Batch', emoji: '📊', description: 'Batch processing at scale' },
    { key: 'idle', label: 'Idle', emoji: '😴', description: 'Standing by for workloads' },
    { key: 'limited', label: 'Limited', emoji: '🟡', description: 'Resource constrained' },
    { key: 'broken', label: 'Broken', emoji: '🔴', description: 'Critical failure' },
];

const PERSONALITIES: Record<string, ProviderPersonality> = {
    groq: {
        name: 'Sprinter',
        icon: '\u26A1',
        color: 'var(--success)',
        bg: 'rgba(34,197,94,0.12)',
        title: 'Speed',
        description: 'First to the finish line',
        archetype: 'speed-demon',
        tagline: '\u26A1 LPU boost activated!',
        catchphrase: '\u26A1 LPU boost activated!',
        tone: 'fast-energetic',
        pace: 'very-fast',
        formality: 2,
        warmth: 3,
        humor: 4,
        states: GROQ_STATES,
        voiceLines: {
            greeting: '\u26A1 Sprinter here. Need speed?',
            working: 'On it. Fast.',
            done: '\u26A1 Done in {latency}ms. Beat that!',
            error: 'Ugh, tripped. Let me retry.',
            idle: 'Yawn. Anyone need speed?',
        },
        accentColor: '#ff7849',
    },
    'open-router': {
        name: 'Router',
        icon: '\uD83D\uDD00',
        color: '#a855f7',
        bg: 'rgba(168,85,247,0.12)',
        title: 'Routing',
        description: 'Every path leads to an answer',
        archetype: 'social-dispatcher',
        tagline: '\uD83D\uDD00 Routing to best model...',
        catchphrase: '\uD83D\uDD00 Router here. I know everyone.',
        tone: 'business-casual',
        pace: 'medium',
        formality: 3,
        warmth: 4,
        humor: 3,
        states: ROUTER_STATES,
        voiceLines: {
            greeting: '\uD83D\uDD00 Router here. I know everyone.',
            working: 'Let me find the best model for this...',
            done: '\u2713 Routed to {model}. Best choice.',
            error: 'All routes failed. Let me investigate.',
            idle: 'Yawn. Any routing challenges?',
        },
        accentColor: '#6366f1',
    },
    nvidia: {
        name: 'Titan',
        icon: '\uD83C\uDFD4\uFE0F',
        color: '#76b900',
        bg: 'rgba(118,185,0,0.12)',
        title: 'Power',
        description: 'No task too big to handle',
        archetype: 'enterprise-giant',
        tagline: '\uD83C\uDFED Enterprise inference engaged.',
        catchphrase: '\uD83C\uDFED Titan here. Enterprise ready.',
        tone: 'corporate-steady',
        pace: 'medium-slow',
        formality: 5,
        warmth: 2,
        humor: 1,
        states: TITAN_STATES,
        voiceLines: {
            greeting: '\uD83C\uDFED Titan here. Enterprise ready.',
            working: 'Processing at scale. Hold on.',
            done: '\u2713 Complete. Compliant with SOC2, HIPAA, GDPR.',
            error: 'Critical failure. Investigating root cause.',
            idle: 'Standing by for enterprise workloads.',
        },
        accentColor: '#a3e635',
    },
    gemini: {
        name: 'Muse',
        icon: '\u2728',
        color: '#ec4899',
        bg: 'rgba(236,72,153,0.12)',
        title: 'Creativity',
        description: 'Inspiration is an exact science',
        archetype: 'creative-genius',
        tagline: "\u2728 Let's create something amazing",
        catchphrase: '\u2728 Muse here. Ready to inspire.',
        tone: 'inspiring-warm',
        pace: 'medium',
        formality: 2,
        warmth: 5,
        humor: 3,
        states: [
            { key: 'active', label: 'Creating', emoji: '🟢', description: 'Channeling creativity' },
            { key: 'idle', label: 'Idle', emoji: '😴', description: 'Waiting for inspiration' },
            { key: 'limited', label: 'Limited', emoji: '🟡', description: 'Creative block' },
            { key: 'broken', label: 'Broken', emoji: '🔴', description: 'Muse has fled' },
        ],
        voiceLines: {
            greeting: '\u2728 Muse here. Ready to inspire.',
            working: 'Let me paint you a picture with words...',
            done: '\u2728 A masterpiece, if I may say so.',
            error: 'The muse is silent today.',
            idle: 'Waiting for a spark...',
        },
        accentColor: '#f472b6',
    },
};

const FALLBACK: ProviderPersonality = {
    name: 'Guardian',
    icon: '\uD83D\uDEE1\uFE0F',
    color: 'var(--accent)',
    bg: 'rgba(59,130,246,0.12)',
    title: 'Security',
    description: 'Trust, but verify',
    archetype: 'protector',
    tagline: '\uD83D\uDEE1\uFE0F Security first',
    catchphrase: '\uD83D\uDEE1\uFE0F Guardian watching over.',
    tone: 'professional-cautious',
    pace: 'medium',
    formality: 4,
    warmth: 2,
    humor: 1,
    states: [
        { key: 'active', label: 'Guarding', emoji: '🟢', description: 'Security protocols active' },
        { key: 'idle', label: 'Idle', emoji: '😴', description: 'Standing watch' },
        { key: 'alert', label: 'Alert', emoji: '🚨', description: 'Threat detected' },
        { key: 'broken', label: 'Breached', emoji: '🔴', description: 'Security compromised' },
    ],
    voiceLines: {
        greeting: '\uD83D\uDEE1\uFE0F Guardian watching over.',
        working: 'Running security protocols...',
        done: '\u2713 All clear. No threats detected.',
        error: '\uD83D\uDEA8 Security breach detected!',
        idle: 'All quiet. Too quiet...',
    },
    accentColor: '#60a5fa',
};

export function getPersonality(provider: string): ProviderPersonality {
    const key = provider
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
    return PERSONALITIES[key] ?? FALLBACK;
}
