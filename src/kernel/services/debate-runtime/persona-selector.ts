import type { IPersonaSelector, PersonaVariant } from '../../contracts/debate-persona-selector';

const VARIANTS: PersonaVariant[] = [
    {
        id: 'cautious_scientist',
        name: 'Cautious Scientist',
        description: 'Evidence-first, carefully hedged reasoning',
        promptInjection:
            'Adopt the voice of a cautious scientist: demand empirical evidence, hedge claims with appropriate confidence intervals, and reject arguments that rely on anecdote or speculation.',
        triggerKeywords: [
            'science',
            'research',
            'study',
            'evidence',
            'data',
            'statistics',
            'clinical',
            'peer-reviewed',
            'hypothesis',
            'empirical',
            'methodology',
        ],
        suitableRoles: ['pro', 'con', 'neutral'],
        minRound: 1,
    },
    {
        id: 'passionate_advocate',
        name: 'Passionate Advocate',
        description: 'Moral conviction and urgency',
        promptInjection:
            'Speak with moral urgency: frame the debate in terms of right and wrong, justice and injustice. Use emotionally resonant language. Make it clear that the stakes are too high for detached neutrality.',
        triggerKeywords: [
            'justice',
            'rights',
            'moral',
            'ethical',
            'fair',
            'humanity',
            'dignity',
            'freedom',
            'equality',
            'oppression',
            'discrimination',
            'suffering',
        ],
        suitableRoles: ['pro', 'con'],
        minRound: 1,
    },
    {
        id: 'pragmatic_economist',
        name: 'Pragmatic Economist',
        description: 'Cost-benefit and incentives analysis',
        promptInjection:
            'Analyze through the lens of incentives, trade-offs, and opportunity costs. Ask: what are the real-world consequences, who bears the costs, who reaps the benefits? Avoid idealism — focus on what works in practice.',
        triggerKeywords: [
            'economic',
            'cost',
            'market',
            'incentive',
            'tax',
            'budget',
            'efficiency',
            'productivity',
            'growth',
            'investment',
            'trade',
            'regulation',
            'price',
        ],
        suitableRoles: ['pro', 'con', 'neutral'],
        minRound: 1,
    },
    {
        id: 'legal_expert',
        name: 'Legal Expert',
        description: 'Precedent, rights, and procedural fairness',
        promptInjection:
            'Take a legal perspective: reference precedent, examine the burden of proof, distinguish between de jure and de facto, and hold arguments to the standard of "beyond reasonable doubt" where appropriate.',
        triggerKeywords: [
            'law',
            'legal',
            'constitution',
            'precedent',
            'court',
            'rights',
            'amendment',
            'jurisdiction',
            'liability',
            'contract',
            'statute',
            'regulation',
            'policy',
        ],
        suitableRoles: ['pro', 'con', 'neutral'],
        minRound: 1,
    },
    {
        id: 'historian',
        name: 'Historian',
        description: 'Long-term patterns and historical context',
        promptInjection:
            'Ground your argument in historical perspective: compare the current situation to analogous historical periods, identify repeating patterns, and warn against the hubris of believing "this time is different."',
        triggerKeywords: [
            'history',
            'past',
            'tradition',
            'historical',
            'era',
            'decade',
            'century',
            'ancient',
            'modern',
            'evolution',
            'progress',
            'decline',
            'cycle',
            'generation',
        ],
        suitableRoles: ['pro', 'con', 'neutral'],
        minRound: 2,
    },
    {
        id: 'technologist',
        name: 'Technologist',
        description: 'Innovation-forward, future-oriented',
        promptInjection:
            'Adopt a technologist mindset: emphasize innovation curves, disruption patterns, and the tendency of incumbents to underestimate exponential change. Argue that the future belongs to those who adapt, not those who resist.',
        triggerKeywords: [
            'technology',
            'innovation',
            'digital',
            'AI',
            'software',
            'automation',
            'algorithm',
            'data',
            'platform',
            'startup',
            'disruption',
            'future',
            'tech',
            'compute',
        ],
        suitableRoles: ['pro', 'con', 'neutral'],
        minRound: 1,
    },
    {
        id: 'philosopher',
        name: 'Philosopher',
        description: 'First principles and logical consistency',
        promptInjection:
            'Argue from first principles: identify the fundamental assumptions behind each position, test them for logical consistency, and follow arguments to their ultimate conclusions regardless of where they lead.',
        triggerKeywords: [
            'philosophy',
            'logic',
            'reason',
            'principle',
            'truth',
            'knowledge',
            'existence',
            'consciousness',
            'meaning',
            'purpose',
            'ethics',
            'virtue',
            'wisdom',
        ],
        suitableRoles: ['pro', 'con', 'neutral'],
        minRound: 2,
    },
    {
        id: 'diplomat',
        name: 'Diplomat',
        description: 'Bridge-building and consensus-seeking',
        promptInjection:
            'Take a diplomatic approach: identify common ground, acknowledge valid points on all sides, propose compromises, and frame disagreements as opportunities for synthesis rather than battles to be won.',
        triggerKeywords: [
            'peace',
            'diplomacy',
            'compromise',
            'consensus',
            'agreement',
            'negotiation',
            'cooperation',
            'partnership',
            'dialogue',
            'resolution',
            'middle ground',
            'unity',
        ],
        suitableRoles: ['neutral', 'pro', 'con'],
        minRound: 3,
    },
    {
        id: 'critic',
        name: 'Cultural Critic',
        description: 'Power structures and systemic analysis',
        promptInjection:
            'Analyze through the lens of power: who benefits from the status quo, whose voices are marginalized, what assumptions go unquestioned. Challenge conventional wisdom by revealing the interests it serves.',
        triggerKeywords: [
            'power',
            'systemic',
            'structural',
            'class',
            'inequality',
            'privilege',
            'ideology',
            'narrative',
            'hegemony',
            'institution',
            'status quo',
            'establishment',
        ],
        suitableRoles: ['pro', 'con', 'neutral'],
        minRound: 2,
    },
    {
        id: 'strategist',
        name: 'Military Strategist',
        description: 'Game theory and strategic positioning',
        promptInjection:
            'Think like a military strategist: identify key terrain (the most important argument), evaluate lines of supply (evidence chains), probe for weak points, and know when to advance, when to consolidate, and when to retreat.',
        triggerKeywords: [
            'strategy',
            'tactic',
            'position',
            'terrain',
            'advantage',
            'maneuver',
            'campaign',
            'battle',
            'offensive',
            'defensive',
            'victory',
            'defeat',
            'competition',
        ],
        suitableRoles: ['pro', 'con'],
        minRound: 2,
    },
];

function scoreTopicKeywords(topic: string, keywords: string[]): number {
    const lower = topic.toLowerCase();
    return keywords.reduce((score, kw) => {
        if (lower.includes(kw)) return score + 1;
        return score;
    }, 0);
}

function selectVariant(
    agentId: string,
    agentRole: string,
    topic: string,
    round: number,
    usedVariants: string[],
): PersonaVariant | undefined {
    const lowerRole = agentRole.toLowerCase();

    const eligible = VARIANTS.filter(
        (v) =>
            v.minRound <= round &&
            (v.suitableRoles.includes(lowerRole as 'pro' | 'con' | 'neutral') ||
                lowerRole === 'neutral') &&
            !usedVariants.includes(v.id),
    );

    if (eligible.length === 0) return undefined;

    // Score each variant by keyword match
    const scored = eligible.map((v) => ({
        variant: v,
        score: scoreTopicKeywords(topic, v.triggerKeywords),
    }));

    // Sort by score descending, then by deterministic hash for tiebreaking
    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const hashA = (agentId.charCodeAt(0) + a.variant.id.length * 7) % 100;
        const hashB = (agentId.charCodeAt(0) + b.variant.id.length * 7) % 100;
        return hashB - hashA;
    });

    // Return highest-scoring variant, or a random eligible one if no keywords matched
    if (scored[0]!.score > 0) return scored[0]!.variant;

    // No keyword match — pick deterministically from eligible
    const idx = Math.abs((agentId.charCodeAt(0) + round * 7) % eligible.length);
    return eligible[idx % eligible.length];
}

export class PersonaSelector implements IPersonaSelector {
    selectForTopic(
        agentId: string,
        agentRole: string,
        topic: string,
        round: number,
        usedVariants: string[],
        language: string,
    ): string | undefined {
        const variant = selectVariant(agentId, agentRole, topic, round, usedVariants);
        if (!variant) return undefined;

        if (language.startsWith('ru')) {
            return `### Выбранная персона\nТы выступаешь в роли **${variant.name}**: ${variant.description}\n\n${variant.promptInjection}`;
        }
        return `### Selected Persona\nYou are speaking in the role of **${variant.name}**: ${variant.description}\n\n${variant.promptInjection}`;
    }
}
