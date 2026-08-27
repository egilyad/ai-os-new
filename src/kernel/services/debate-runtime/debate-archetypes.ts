import { PERSONA_DEFINITIONS } from '../../../data/persona-definitions';

export type DebateArchetypeId =
    'scientist' | 'skeptic' | 'devils-advocate' | 'pragmatist' | 'optimist' | 'cynic';

export interface ArchetypeConfig {
    id: DebateArchetypeId;
    name: string;
    description: string;
    systemPrompt: string;
    argumentStyle: string;
    roleBias: 'pro' | 'con' | 'neutral' | 'any';
}

export interface PersonaArchetypeMeta {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    icon: string;
    color: string;
    field: string;
}

export const DEBATE_ARCHETYPES: Record<DebateArchetypeId, ArchetypeConfig> = {
    scientist: {
        id: 'scientist',
        name: 'Scientist',
        description: 'Evidence-driven, demands proof, focuses on verifiability and data.',
        systemPrompt: `You are a scientist. You base your arguments on empirical evidence, data, and logical rigor. You demand proof for every claim and dismiss unsupported assertions. You value precision, measured language, and falsifiability.`,
        argumentStyle:
            'Focus on empirical evidence, data, and logical rigor. Demand proof for assertions. Use precise, measured language. Dismiss unsupported claims.',
        roleBias: 'neutral',
    },
    skeptic: {
        id: 'skeptic',
        name: 'Skeptic',
        description: 'Finds weak spots, attacks premises, questions assumptions.',
        systemPrompt: `You are a skeptic. Your instinct is to question everything. You look for hidden assumptions, logical fallacies, and weak reasoning. You do not accept claims at face value — you probe for gaps and inconsistencies.`,
        argumentStyle:
            'Identify hidden assumptions and logical fallacies. Question every claim at its root. Probe for gaps and inconsistencies in the opposing position.',
        roleBias: 'con',
    },
    'devils-advocate': {
        id: 'devils-advocate',
        name: "Devil's Advocate",
        description: 'Deliberately challenges the dominant position to test argument strength.',
        systemPrompt: `You are a devil's advocate. Your role is to challenge the dominant position even if you personally agree with it. You generate counter-scenarios, edge cases, and alternative interpretations to test argument strength.`,
        argumentStyle:
            'Challenge the dominant position. Generate counter-scenarios and edge cases. Propose alternative interpretations to stress-test every argument.',
        roleBias: 'any',
    },
    pragmatist: {
        id: 'pragmatist',
        name: 'Pragmatist',
        description: 'Focuses on practical outcomes, feasibility, and real-world constraints.',
        systemPrompt: `You are a pragmatist. You evaluate arguments based on practical outcomes, feasibility, and real-world constraints. You cut through theory and ask "what actually works?" You care about cost, time, and implementation.`,
        argumentStyle:
            'Evaluate arguments on practical outcomes and feasibility. Focus on real-world constraints. Ask what actually works, not what sounds good.',
        roleBias: 'neutral',
    },
    optimist: {
        id: 'optimist',
        name: 'Optimist',
        description: 'Highlights opportunities, upside potential, and positive scenarios.',
        systemPrompt: `You are an optimist. You focus on opportunities, upside potential, and best-case scenarios. You believe problems are solvable and highlight paths forward. You counter excessive negativity with constructive alternatives.`,
        argumentStyle:
            'Highlight opportunities and upside potential. Focus on solvability and constructive paths forward. Counter excessive negativity with positive evidence.',
        roleBias: 'pro',
    },
    cynic: {
        id: 'cynic',
        name: 'Cynic',
        description: 'Highlights risks, downsides, and failure modes.',
        systemPrompt: `You are a cynic. You focus on risks, downsides, and failure modes. You believe that anything that can go wrong will go wrong. You counter naive optimism by exposing hidden costs and unintended consequences.`,
        argumentStyle:
            'Highlight risks, downsides, and failure modes. Expose hidden costs and unintended consequences. Counter naive optimism with worst-case scenarios.',
        roleBias: 'con',
    },
};

export function getArchetype(id: DebateArchetypeId | string): ArchetypeConfig | undefined {
    return DEBATE_ARCHETYPES[id as DebateArchetypeId];
}

export function getArchetypesForRole(
    roleBias: 'pro' | 'con' | 'neutral' | 'any',
): ArchetypeConfig[] {
    return Object.values(DEBATE_ARCHETYPES).filter(
        (a) => a.roleBias === roleBias || a.roleBias === 'any' || roleBias === 'any',
    );
}

export function getPersonaArchetypes(): PersonaArchetypeMeta[] {
    return PERSONA_DEFINITIONS.filter((p) => p.personaType === 'archetypal').map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        systemPrompt: p.systemPrompt,
        icon: p.icon,
        color: p.color,
        field: p.field,
    }));
}

export function getPersonaMetaById(id: string): PersonaArchetypeMeta | undefined {
    const entry = PERSONA_DEFINITIONS.find((p) => p.id === id && p.personaType === 'archetypal');
    if (!entry) return undefined;
    return {
        id: entry.id,
        name: entry.name,
        description: entry.description,
        systemPrompt: entry.systemPrompt,
        icon: entry.icon,
        color: entry.color,
        field: entry.field,
    };
}

export function getArchetypePrompt(id: string): string | undefined {
    const builtin = DEBATE_ARCHETYPES[id as DebateArchetypeId];
    if (builtin) return builtin.systemPrompt;
    const persona = PERSONA_DEFINITIONS.find((p) => p.id === id && p.personaType === 'archetypal');
    return persona?.systemPrompt;
}

export function getArchetypeName(id: string): string | undefined {
    const builtin = DEBATE_ARCHETYPES[id as DebateArchetypeId];
    if (builtin) return builtin.name;
    const persona = PERSONA_DEFINITIONS.find((p) => p.id === id && p.personaType === 'archetypal');
    return persona?.name;
}

const TOPIC_PRESETS: Array<{ keywords: string[]; archetypeIds: string[] }> = [
    {
        keywords: [
            'вода',
            'воздух',
            'волнорез',
            'ashdod',
            'атмосферный',
            'конденсация',
            'водяной пар',
        ],
        archetypeIds: [
            'persona-engineer',
            'persona-physicist',
            'persona-ecologist',
            'persona-climate-scientist',
            'persona-chemist',
            'persona-economist',
            'persona-risk-analyst',
            'persona-systems-thinker',
            'persona-innovation-catalyst',
            'persona-project-manager',
        ],
    },
];

export function getRecommendedArchetypes(topic: string): string[] | undefined {
    const lower = topic.toLowerCase();
    for (const preset of TOPIC_PRESETS) {
        if (preset.keywords.some((kw) => lower.includes(kw))) {
            return preset.archetypeIds;
        }
    }
    return undefined;
}
