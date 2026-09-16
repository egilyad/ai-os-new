import type { Claim, ClaimEdge } from '../debate-runtime/debate-governor/types';
import type { ReasoningPattern, ReasoningSignature } from './types';

const DEDUCTIVE_INDICATORS = [
    'therefore',
    'thus',
    'hence',
    'consequently',
    'it follows that',
    'must be',
    'necessarily',
    'implies',
    'proves that',
    'следовательно',
    'значит',
    'поэтому',
    'отсюда следует',
];

const INDUCTIVE_INDICATORS = [
    'typically',
    'generally',
    'in most cases',
    'often',
    'tends to',
    'suggests that',
    'indicates',
    'pattern',
    'observed',
    'обычно',
    'как правило',
    'в большинстве случаев',
    'свидетельствует',
];

const ANALOGICAL_INDICATORS = [
    'similarly',
    'likewise',
    'by analogy',
    'parallel',
    'comparable',
    'just as',
    'similar to',
    'analogous',
    'аналогично',
    'подобно',
    'так же как',
    'по аналогии',
];

const CAUSAL_INDICATORS = [
    'because',
    'causes',
    'leads to',
    'results in',
    'due to',
    'triggered by',
    'as a result',
    'effect of',
    'потому что',
    'приводит к',
    'вызвано',
    'в результате',
];

const ADVERSARIAL_INDICATORS = [
    'however',
    'but',
    'nevertheless',
    'on the contrary',
    'conversely',
    'while you claim',
    'your argument fails',
    'однако',
    'но',
    'напротив',
    'вопреки',
    'ваш аргумент',
];

const SYNTHESIS_INDICATORS = [
    'integrating',
    'synthesizing',
    'combining',
    'unifying',
    'holistic',
    'both sides',
    'common ground',
    'balanced view',
    'объединяя',
    'синтезируя',
    'целостный',
    'оба подхода',
];

function detectPattern(text: string): { pattern: ReasoningPattern; score: number } {
    const lower = text.toLowerCase();

    const scores: Array<{ pattern: ReasoningPattern; score: number }> = [
        {
            pattern: 'deductive',
            score: countMatches(lower, DEDUCTIVE_INDICATORS) / DEDUCTIVE_INDICATORS.length,
        },
        {
            pattern: 'inductive',
            score: countMatches(lower, INDUCTIVE_INDICATORS) / INDUCTIVE_INDICATORS.length,
        },
        {
            pattern: 'analogical',
            score: countMatches(lower, ANALOGICAL_INDICATORS) / ANALOGICAL_INDICATORS.length,
        },
        {
            pattern: 'causal',
            score: countMatches(lower, CAUSAL_INDICATORS) / CAUSAL_INDICATORS.length,
        },
        {
            pattern: 'adversarial',
            score: countMatches(lower, ADVERSARIAL_INDICATORS) / ADVERSARIAL_INDICATORS.length,
        },
        {
            pattern: 'synthesis-heavy',
            score: countMatches(lower, SYNTHESIS_INDICATORS) / SYNTHESIS_INDICATORS.length,
        },
    ];

    scores.sort((a, b) => b.score - a.score);
    return scores[0]!;
}

function countMatches(text: string, indicators: string[]): number {
    return indicators.filter((ind) => text.includes(ind)).length;
}

function computeEdgePatternScore(
    edges: ClaimEdge[],
    agentId: string,
): Partial<Record<ReasoningPattern, number>> {
    const patternScores: Partial<Record<ReasoningPattern, number>> = {};
    const agentEdges = edges.filter((e) => {
        return e.from === agentId || e.to === agentId;
    });

    if (agentEdges.length === 0) return patternScores;

    let supports = 0;
    let challenges = 0;
    let refines = 0;

    for (const e of agentEdges) {
        if (e.type === 'supports') supports++;
        else if (e.type === 'challenges') challenges++;
        else if (e.type === 'refines') refines++;
    }

    const total = supports + challenges + refines;
    if (total === 0) return patternScores;

    patternScores['deductive'] = supports / total;
    patternScores['adversarial'] = challenges / total;
    patternScores['synthesis-heavy'] = refines / total;

    return patternScores;
}

export function extractReasoningSignature(
    agentId: string,
    claims: Claim[],
    edges: ClaimEdge[],
): ReasoningSignature {
    const patternScores: Partial<Record<ReasoningPattern, number>> = {};

    for (const c of claims) {
        const detected = detectPattern(c.text);
        patternScores[detected.pattern] = (patternScores[detected.pattern] ?? 0) + detected.score;
    }

    const edgeScores = computeEdgePatternScore(edges, agentId);
    for (const [p, s] of Object.entries(edgeScores)) {
        patternScores[p as ReasoningPattern] =
            (patternScores[p as ReasoningPattern] ?? 0) + s * 0.5;
    }

    const entries = Object.entries(patternScores) as Array<[ReasoningPattern, number]>;
    if (entries.length === 0) {
        return { pattern: 'inductive', confidence: 0.5 };
    }

    entries.sort((a, b) => b[1] - a[1]);
    const top = entries[0]!;
    const runnerUp = entries.length > 1 ? entries[1]![1] : 0;
    const confidence = Math.min(1, top[1] - runnerUp + 0.3);

    return { pattern: top[0], confidence };
}

export function computeReasoningDiversityScore(
    signatures: Map<string, ReasoningSignature>,
): Map<string, number> {
    const result = new Map<string, number>();
    const agents = [...signatures.keys()];
    const patternCount = new Map<string, number>();

    for (const sig of signatures.values()) {
        patternCount.set(sig.pattern, (patternCount.get(sig.pattern) ?? 0) + 1);
    }

    const total = agents.length;
    for (const agentId of agents) {
        const sig = signatures.get(agentId)!;
        const freq = (patternCount.get(sig.pattern) ?? 1) / total;
        const score = 1 - Math.max(0, Math.min(1, freq - 1 / total));
        result.set(agentId, Math.max(0, score));
    }

    return result;
}
