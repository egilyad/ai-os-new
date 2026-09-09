import type {
    CausalLink,
    CausalAnalysis,
    ICausalGraphBuilder,
} from '../../contracts/debate-causal-graph';

// Regex to extract causal patterns from claim text
// Matches: "X causes Y", "X leads to Y", "X results in Y", "therefore Y",
// "because of X", "X triggers Y", "X drives Y", "X produces Y", "X creates Y",
// "X influences Y", "X impacts Y", "X affects Y", "X exacerbates Y",
// "X reduces Y", "X increases Y", "X prevents Y", "X enables Y"
const CAUSAL_REGEX =
    /\b(causes?|leads?\s+to|results?\s+in|therefore|because\s+of|triggers?|drives?|produces?|creates?|influences?|impacts?|affects?|exacerbates?|reduces?|increases?|prevents?|enables?)\b/i;

// Second-order cue: words suggesting cascading effects
const CASCADE_REGEX =
    /\b(which\s+(in\s+turn|causes|leads|triggers|creates)|cascade|chain\s+reaction|ripple\s+effect|knock-?on|snowball|domino|spillover|feedback\s+loop|vicious\s+cycle|virtuous\s+cycle)\b/i;

// Feedback loop cue: words suggesting circular causality
const LOOP_REGEX =
    /\b(feedback\s+loop|vicious\s+cycle|virtuous\s+cycle|self-reinforcing|self-correcting|balancing\s+loop|reinforcing\s+loop|circular|counteract|amplify|dampen|oscillat)\b/i;

// Domain-specific dimensions for missing-dimension detection
const CAUSAL_DIMENSIONS = [
    { keyword: /economic|market|price|cost|inflation|gdp|unemployment/i, label: 'economic' },
    { keyword: /social|cultural|inequality|community|demographic|norms/i, label: 'social' },
    { keyword: /environmental|climate|ecosystem|pollution|emissions/i, label: 'environmental' },
    {
        keyword: /political|policy|regulation|governance|legislation|geopolitical/i,
        label: 'political',
    },
    { keyword: /technolog|innovation|automation|digital|ai|algorithm/i, label: 'technological' },
    {
        keyword: /psycholog|mental|behavior|cognitive|perception|wellbeing/i,
        label: 'psychological',
    },
    { keyword: /temporal|long.?term|future|generational|decade|century/i, label: 'temporal' },
];

const FEEDBACK_LOOP_EXAMPLES: Record<string, string> = {
    economic:
        'economic: rising prices → increased wages → higher production costs → further price increases (inflationary loop)',
    environmental:
        'environmental: ice melt → reduced albedo → more heat absorption → accelerated ice melt (albedo feedback)',
    social: 'social: inequality → reduced social mobility → political instability → further inequality (poverty trap)',
    technological:
        'technological: more users → better algorithms → more users → market dominance (network effects)',
    political:
        'political: regulation → compliance costs → industry consolidation → regulatory capture → weaker regulation',
};

function extractCausalPairs(text: string): string[] {
    const pairs: string[] = [];
    const lower = text.toLowerCase();
    const match = CAUSAL_REGEX.exec(lower);
    if (!match) return pairs;

    const before = lower.slice(Math.max(0, match.index - 80), match.index).trim();
    const after = lower
        .slice(match.index + match[0].length, match.index + match[0].length + 80)
        .trim();
    const cause =
        before
            .split(/[.!?;]+/)
            .pop()
            ?.trim() || before;
    const effect = after.split(/[.!?;]+/)[0]?.trim() || after;

    if (cause && effect && cause.length > 3 && effect.length > 3) {
        pairs.push(cause.slice(0, 60));
        pairs.push(effect.slice(0, 60));
    }
    return pairs;
}

function hasSecondOrder(text: string): boolean {
    return CASCADE_REGEX.test(text);
}

function hasFeedbackLoop(text: string): boolean {
    return LOOP_REGEX.test(text);
}

function getCoveredDimensions(text: string): string[] {
    return CAUSAL_DIMENSIONS.filter((d) => d.keyword.test(text)).map((d) => d.label);
}

export class CausalGraphBuilder implements ICausalGraphBuilder {
    private readonly links = new Map<string, CausalLink[]>();
    private readonly agentClaims = new Map<string, Map<string, string[]>>(); // sessionId → agentId → claims[]

    ingestClaim(sessionId: string, agentId: string, claim: string, round: number): void {
        const lower = claim.toLowerCase();
        const pairs = extractCausalPairs(lower);
        if (pairs.length === 0) return;

        const order = hasSecondOrder(lower) ? 2 : hasFeedbackLoop(lower) ? 3 : 1;

        const sessionLinks = this.links.get(sessionId) ?? [];
        sessionLinks.push({
            cause: pairs[0]!,
            effect: pairs.length > 1 ? pairs[1]! : pairs[0]!,
            agentId,
            round,
            order,
        });
        this.links.set(sessionId, sessionLinks);

        let agentMap = this.agentClaims.get(sessionId);
        if (!agentMap) {
            agentMap = new Map();
            this.agentClaims.set(sessionId, agentMap);
        }
        const claims = agentMap.get(agentId) ?? [];
        claims.push(claim);
        agentMap.set(agentId, claims);
    }

    getCausalContext(
        sessionId: string,
        agentId: string,
        _allParticipantIds: string[],
        round: number,
        language: string,
    ): string | undefined {
        const sessionLinks = this.links.get(sessionId) ?? [];
        if (sessionLinks.length === 0 && round < 2) return undefined;

        const totalLinks = sessionLinks.length;
        const linearChains = sessionLinks.filter((l) => l.order === 1).length;
        const feedbackLoops = sessionLinks.filter((l) => l.order >= 2).length;
        const loopRatio = totalLinks > 0 ? feedbackLoops / totalLinks : 0;

        // Collect all dimensions covered by existing claims
        const allText = [...(this.agentClaims.get(sessionId)?.values() ?? [])].flat().join(' ');
        const coveredDimensions = getCoveredDimensions(allText);
        const allDimensionLabels = CAUSAL_DIMENSIONS.map((d) => d.label);
        const missingDimensions = allDimensionLabels.filter((d) => !coveredDimensions.includes(d));

        // Agent's own depth
        const agentLinks = sessionLinks.filter((l) => l.agentId === agentId);
        const agentHasSecondOrder = agentLinks.some((l) => l.order >= 2);
        const agentHasLoops = agentLinks.some((l) => l.order >= 3);

        let context: string;
        const isLowLoop = loopRatio < 0.2 && totalLinks >= 3;
        const isLinearOnly = agentLinks.length >= 2 && !agentHasSecondOrder;

        if (isLowLoop || isLinearOnly) {
            // Agent is thinking linearly — force causal loop consideration
            const exampleKey =
                missingDimensions.length > 0
                    ? missingDimensions.find((d) => FEEDBACK_LOOP_EXAMPLES[d])
                    : undefined;
            const example = exampleKey
                ? FEEDBACK_LOOP_EXAMPLES[exampleKey]
                : FEEDBACK_LOOP_EXAMPLES.economic;

            const loopInstruction = isLowLoop
                ? `The debate so far contains ${linearChains} linear causal chains but only ${feedbackLoops} feedback loop(s) (${(loopRatio * 100).toFixed(0)}% systemic).`
                : `Your arguments so far have been purely linear (A → B). You have not explored any feedback loops or second-order effects.`;

            const langNote =
                language === 'Russian'
                    ? `\n\nВАЖНО: В сложных системах линейное мышление ("А вызывает Б") часто ошибочно. Реальные системы содержат петли обратной связи, где последствия возвращаются к причинам. Рассмотрите последствия второго и третьего порядка.`
                    : `\n\nCRITICAL: In complex systems, linear thinking ("A causes B") is often misleading. Real systems contain feedback loops where effects loop back to causes. Consider second-order and third-order consequences.`;

            context = `${loopInstruction}${langNote}

### Systems Thinking Requirement
You MUST structure at least part of your argument as a causal loop or feedback system:

1. IDENTIFY a causal chain already mentioned in this debate
2. TRACE its second-order effect (what does the effect then cause?)
3. CONNECT it to a third-order consequence or feedback loop
4. EXPLAIN how ignoring this systemic perspective could lead to flawed conclusions

Example of a feedback loop in the ${exampleKey || 'economic'} domain: ${example}

### Missing Dimensions
The following dimensions of causal impact have been under-explored:
${missingDimensions.length > 0 ? missingDimensions.map((d) => `- ${d}`).join('\n') : '- Consider cross-domain interactions (how do economic factors affect social outcomes, etc.)'}

Argue at the system level, not the event level.`;
        } else if (agentHasLoops) {
            // Agent is already using loops — reinforce and encourage deeper
            const langNote =
                language === 'Russian'
                    ? `\n\nХорошая работа по выявлению петель обратной связи. Теперь попробуйте найти взаимодействия между разными петлями — как они усиливают или ослабляют друг друга?`
                    : `\n\nGood work identifying feedback loops. Now try to find interactions BETWEEN different loops — how do they amplify or dampen each other?`;
            context = `Your systemic thinking is noted.${langNote}

### Advanced Systems Challenge
Identify a point where two different feedback loops interact. Explain whether they:
- Reinforce each other (vicious/virtuous cycle amplification)
- Counteract each other (balancing loop)
- Create a tipping point (threshold beyond which the system shifts)`;
        } else if (totalLinks >= 6 && missingDimensions.length > 0) {
            // Enough claims but missing dimensions
            const langNote =
                language === 'Russian'
                    ? `\n\nДискуссия охватила несколько причинно-следственных связей, но следующие аспекты остались незатронутыми. Расширьте анализ.`
                    : `\n\nThe debate has covered several causal chains, but the following dimensions remain unexplored. Broaden your analysis.`;
            context = `The debate has mapped ${totalLinks} causal relationships.${langNote}

### Unexplored Dimensions
Consider incorporating one or more of these missing causal dimensions into your argument:
${missingDimensions.map((d) => `- ${d}`).join('\n')}

How might ${missingDimensions[0] || 'cross-domain'} factors create feedback loops with the arguments already made?`;
        } else {
            return undefined;
        }

        return context;
    }

    getAnalysis(sessionId: string): CausalAnalysis | undefined {
        const sessionLinks = this.links.get(sessionId);
        if (!sessionLinks || sessionLinks.length === 0) return undefined;

        const totalClaims = sessionLinks.length;
        const linearChains = sessionLinks.filter((l) => l.order === 1).length;
        const feedbackLoops = sessionLinks.filter((l) => l.order >= 2).length;
        const avgDepth =
            totalClaims > 0 ? sessionLinks.reduce((s, l) => s + l.order, 0) / totalClaims : 0;

        const allText = [...(this.agentClaims.get(sessionId)?.values() ?? [])].flat().join(' ');
        const coveredDimensions = getCoveredDimensions(allText);
        const allDimensionLabels = CAUSAL_DIMENSIONS.map((d) => d.label);
        const missingDimensions = allDimensionLabels.filter((d) => !coveredDimensions.includes(d));

        return { totalClaims, linearChains, feedbackLoops, avgDepth, missingDimensions };
    }

    reset(sessionId: string): void {
        this.links.delete(sessionId);
        this.agentClaims.delete(sessionId);
    }
}
