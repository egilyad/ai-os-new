import type {
    DebateGraphMetrics,
    DebateConstraint,
    ActivityMetrics,
    AgentActivityMetric,
    ArgumentImpact,
    QualityMetrics,
    DepthMetric,
    OriginalityMetric,
    UsefulnessMetric,
    DebateArgument,
    DebateParticipant,
} from '../../contracts/debate-types';
import { jaccardSimilarity } from '../../contracts/debate-types';

export function computeGraphMetrics(
    args: DebateArgument[],
    strategy: string,
): DebateGraphMetrics | undefined {
    if (strategy !== 'argument_tree') return undefined;

    const totalNodes = args.length;
    if (totalNodes === 0) return undefined;

    const depthMap = new Map<string, number>();
    function getDepth(argId: string): number {
        if (depthMap.has(argId)) return depthMap.get(argId)!;
        const arg = args.find((a) => a.id === argId);
        if (!arg || !arg.parentId) {
            depthMap.set(argId, 0);
            return 0;
        }
        const d = getDepth(arg.parentId) + 1;
        depthMap.set(argId, d);
        return d;
    }
    for (const a of args) getDepth(a.id);
    const depths = [...depthMap.values()];
    const maxDepth = Math.max(...depths, 0);
    const avgDepth = depths.reduce((s, d) => s + d, 0) / depths.length;

    const orphans = args.filter(
        (a) => a.parentResolution === 'orphan' || (!a.parentId && a.round > 1),
    );
    const orphanRate = args.length > 0 ? orphans.length / args.length : 0;

    const childCounts = new Map<string, number>();
    for (const a of args) {
        if (a.parentId) {
            childCounts.set(a.parentId, (childCounts.get(a.parentId) || 0) + 1);
        }
    }
    const parentsWithChildren = [...childCounts.values()];
    const branchingFactor =
        parentsWithChildren.length > 0
            ? parentsWithChildren.reduce((s, c) => s + c, 0) / parentsWithChildren.length
            : 0;

    let challenges = 0;
    for (const a of args) {
        if (a.parentId) {
            const parent = args.find((p) => p.id === a.parentId);
            if (parent && parent.position !== a.position) challenges++;
        }
    }
    const challengeDensity = args.length > 0 ? challenges / args.length : 0;

    const refinements = args.filter((a) => {
        if (!a.parentId) return false;
        const parent = args.find((p) => p.id === a.parentId);
        return parent && parent.position === a.position;
    }).length;
    const refinementDensity = args.length > 0 ? refinements / args.length : 0;

    return {
        totalNodes,
        maxDepth,
        avgDepth,
        orphanRate,
        branchingFactor,
        challengeDensity,
        refinementDensity,
    };
}

export function computeActivityMetrics(
    args: DebateArgument[],
    participants: DebateParticipant[],
): ActivityMetrics | undefined {
    if (args.length === 0) return undefined;

    const agentMap = new Map<
        string,
        {
            argCount: number;
            wordCount: number;
            totalConfidence: number;
            depths: number[];
            childrenReceived: number;
        }
    >();
    for (const a of participants)
        agentMap.set(a.id, {
            argCount: 0,
            wordCount: 0,
            totalConfidence: 0,
            depths: [],
            childrenReceived: 0,
        });

    const childrenMap = new Map<string, number>();
    for (const a of args) {
        if (a.parentId) childrenMap.set(a.parentId, (childrenMap.get(a.parentId) || 0) + 1);
    }

    const depthMap = new Map<string, number>();
    function getDepth(arg: DebateArgument): number {
        if (depthMap.has(arg.id)) return depthMap.get(arg.id)!;
        if (!arg.parentId) {
            depthMap.set(arg.id, 0);
            return 0;
        }
        const parent = args.find((p) => p.id === arg.parentId);
        if (!parent) {
            depthMap.set(arg.id, 0);
            return 0;
        }
        const d = getDepth(parent) + 1;
        depthMap.set(arg.id, d);
        return d;
    }

    for (const a of args) {
        const entry = agentMap.get(a.agentId);
        if (!entry) continue;
        entry.argCount++;
        entry.wordCount += a.content ? a.content.split(/\s+/).length : 0;
        entry.totalConfidence += a.confidence || 0;
        const d = getDepth(a);
        entry.depths.push(d);
        entry.childrenReceived += childrenMap.get(a.id) || 0;
    }

    const perAgent: AgentActivityMetric[] = participants
        .map((a) => {
            const e = agentMap.get(a.id) || {
                argCount: 0,
                wordCount: 0,
                totalConfidence: 0,
                depths: [],
                childrenReceived: 0,
            };
            return {
                agentId: a.id,
                agentName: a.name,
                argumentCount: e.argCount,
                wordCount: e.wordCount,
                avgConfidence: e.argCount > 0 ? e.totalConfidence / e.argCount : 0,
                avgDepth:
                    e.depths.length > 0 ? e.depths.reduce((s, d) => s + d, 0) / e.depths.length : 0,
                childrenReceived: e.childrenReceived,
            };
        })
        .sort((a, b) => b.argumentCount - a.argumentCount);

    const mostDiscussed: ArgumentImpact[] = args
        .map((a) => ({
            argumentId: a.id,
            agentName: a.agentName,
            content: a.content.slice(0, 120),
            childCount: childrenMap.get(a.id) || 0,
            round: a.round,
        }))
        .filter((a) => a.childCount > 0)
        .sort((a, b) => b.childCount - a.childCount)
        .slice(0, 5);

    const maxRound = Math.max(...args.map((a) => a.round), 0);
    const roundIntensity: number[] = [];
    for (let r = 0; r <= maxRound; r++) {
        roundIntensity.push(args.filter((a) => a.round === r).length);
    }

    return { perAgent, mostDiscussed, roundIntensity };
}

export function computeQualityMetrics(
    args: DebateArgument[],
    topic: string,
): QualityMetrics | undefined {
    if (args.length === 0) return undefined;

    const allWords = args.flatMap((a) =>
        (a.content || '')
            .toLowerCase()
            .replace(/[^a-zа-яё\s]/g, '')
            .split(/\s+/)
            .filter(Boolean),
    );
    const totalWords = allWords.length;
    const uniqueWords = new Set(allWords).size;
    const lexicalDiversity = totalWords > 0 ? uniqueWords / totalWords : 0;

    const allBigrams = new Set<string>();
    for (let i = 1; i < allWords.length; i++) allBigrams.add(`${allWords[i - 1]} ${allWords[i]}`);
    const uniqueBigrams = allBigrams.size;

    const wordFreq = new Map<string, number>();
    for (const w of allWords) wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
    const rareTerms = [...wordFreq].filter(([_, c]) => c <= 3).length;
    const topicBreadth = Math.min(rareTerms / Math.max(uniqueWords, 1), 1);

    const seenSignatures = new Set<string>();
    let uniqueArgCount = 0;
    for (const a of args) {
        const words = (a.content || '')
            .toLowerCase()
            .replace(/[^a-zа-яё\s]/g, '')
            .split(/\s+/)
            .filter(Boolean);
        const sig = [...new Set(words)].sort().slice(0, 10).join('|');
        if (!seenSignatures.has(sig)) {
            seenSignatures.add(sig);
            uniqueArgCount++;
        }
    }

    const depthScore = Math.min(
        0.25 * (uniqueArgCount / Math.max(args.length, 1)) +
            0.25 * lexicalDiversity +
            0.25 * topicBreadth +
            0.25 * Math.min(uniqueBigrams / 50, 1),
        1,
    );
    const depth: DepthMetric = {
        uniqueArguments: uniqueArgCount,
        lexicalDiversity,
        uniqueBigrams,
        topicBreadth,
        depthScore,
    };

    const agentArgMap = new Map<string, string[]>();
    for (const a of args) {
        const list = agentArgMap.get(a.agentId) || [];
        list.push(a.content);
        agentArgMap.set(a.agentId, list);
    }

    let selfSimTotal = 0;
    let selfSimCount = 0;
    for (const [, texts] of agentArgMap) {
        for (let i = 1; i < texts.length; i++) {
            selfSimTotal += jaccardSimilarity(texts[i - 1]!, texts[i]!);
            selfSimCount++;
        }
    }
    const selfRepetition = selfSimCount > 0 ? selfSimTotal / selfSimCount : 0;

    let crossSimTotal = 0;
    let crossSimCount = 0;
    const agentIds = [...agentArgMap.keys()];
    for (let i = 0; i < agentIds.length; i++) {
        for (let j = i + 1; j < agentIds.length; j++) {
            const textsA = agentArgMap.get(agentIds[i]!) || [];
            const textsB = agentArgMap.get(agentIds[j]!) || [];
            const sampleA = textsA.slice(-3);
            const sampleB = textsB.slice(-3);
            for (const ta of sampleA) {
                for (const tb of sampleB) {
                    crossSimTotal += jaccardSimilarity(ta, tb);
                    crossSimCount++;
                }
            }
        }
    }
    const crossRepetition = crossSimCount > 0 ? crossSimTotal / crossSimCount : 0;
    const noveltyScore = 1 - (selfRepetition * 0.4 + crossRepetition * 0.6);
    const originality: OriginalityMetric = { selfRepetition, crossRepetition, noveltyScore };

    const topicWords = new Set(
        topic
            .toLowerCase()
            .replace(/[^a-zа-яё\s]/g, '')
            .split(/\s+/)
            .filter(Boolean),
    );
    let relevanceTotal = 0;
    for (const a of args) {
        const argWords = new Set(
            a.content
                .toLowerCase()
                .replace(/[^a-zа-яё\s]/g, '')
                .split(/\s+/)
                .filter(Boolean),
        );
        const overlap =
            topicWords.size > 0
                ? [...topicWords].filter((w) => argWords.has(w)).length / topicWords.size
                : 0;
        relevanceTotal += Math.min(overlap * 3, 1);
    }
    const relevanceScore = args.length > 0 ? relevanceTotal / args.length : 0;

    const evidencePattern =
        /\d+[.,]?\d*|%|citation|according to|study|research|data|statistics?|исследован|данные|статистик|по данным|согласно|источник|эксперимент/i;
    let evidenceTotal = 0;
    for (const a of args) {
        evidenceTotal += evidencePattern.test(a.content) ? 1 : 0;
    }
    const evidenceScore = args.length > 0 ? evidenceTotal / args.length : 0;

    const hasParentLinks = args.some((a) => a.parentId);
    const conArgs = args.filter((a) => a.position === 'con').length;
    const proArgs = args.filter((a) => a.position === 'pro').length;
    const totalPositions = conArgs + proArgs;
    const balance = totalPositions > 0 ? 1 - Math.abs(conArgs - proArgs) / totalPositions : 0;
    const structureScore = (hasParentLinks ? 0.4 : 0) + balance * 0.3 + 0.3;

    const usefulnessScore = relevanceScore * 0.4 + evidenceScore * 0.3 + structureScore * 0.3;
    const usefulness: UsefulnessMetric = {
        relevanceScore,
        evidenceScore,
        structureScore,
        usefulnessScore,
    };

    return { depth, originality, usefulness };
}

export function scoreConstraintCompliance(text: string, constraint: DebateConstraint): number {
    if (constraint === 'none') return 1;
    const lower = text.toLowerCase();
    const words = lower.split(/\W+/);

    const speculationWords = [
        'maybe',
        'perhaps',
        'likely',
        'probably',
        'possibly',
        'might',
        'could be',
        'i believe',
        'i think',
        'it seems',
        'it appears',
        'sort of',
        'kind of',
        'возможно',
        'вероятно',
        'наверное',
        'кажется',
        'может быть',
        'похоже',
        'предположительно',
        'пожалуй',
        'вроде',
        'как будто',
        'скорее всего',
        'не уверен',
        'сомневаюсь',
        'едва ли',
        'вряд ли',
    ];
    const speculationScore = Math.max(
        0,
        1 - speculationWords.filter((w) => lower.includes(w)).length * 0.15,
    );

    switch (constraint) {
        case 'facts_only': {
            const emotionalLexicon = [
                'beautiful',
                'terrible',
                'awful',
                'wonderful',
                'horrible',
                'love',
                'hate',
                'feel',
                'feeling',
                'heart',
                'soul',
                'passion',
                'outrage',
                'hopeful',
                'dreadful',
                'shame',
                'proud',
                'cruel',
                'compassion',
            ];
            const emotionHits = emotionalLexicon.filter((w) => words.includes(w)).length;
            const emotionPenalty = Math.min(1, emotionHits * 0.25);
            return Math.max(0, Math.round((speculationScore - emotionPenalty) * 100) / 100);
        }

        case 'emotional_only': {
            const dataPatterns = [
                /\d+%/g,
                /\d+\.?\d*\s*(million|billion|trillion|k|m|b)/gi,
                /according to/i,
                /study shows?/i,
                /research indicates?/i,
                /statistics?/i,
                /survey/i,
                /data show/i,
                /figure[ds]?/i,
                /citation/i,
                /reference/i,
                /per (cent|centage)/i,
                /rate of/i,
            ];
            const dataHits = dataPatterns.filter((p) => p.test(text)).length;
            const dataPenalty = Math.min(1, dataHits * 0.2);
            const emotionalWords = [
                'feel',
                'heart',
                'hope',
                'fear',
                'anger',
                'joy',
                'sorrow',
                'love',
                'hate',
                'passion',
                'compassion',
                'dignity',
                'suffering',
                'dream',
                'future',
                'children',
                'family',
                'community',
                'trust',
                'betray',
            ];
            const emotionBonus = Math.min(
                0.3,
                emotionalWords.filter((w) => words.includes(w)).length * 0.05,
            );
            return Math.max(
                0,
                Math.min(1, Math.round((1 - dataPenalty + emotionBonus) * 100) / 100),
            );
        }

        case 'data_driven': {
            const hasNumbers = /\d+/.test(text);
            const hasPercent = /\d+%/.test(text);
            const dataMarkers = [
                'percent',
                'percentage',
                'rate',
                'ratio',
                'average',
                'median',
                'total',
                'statistic',
                'figure',
                'data',
                'study',
                'survey',
                'according to',
                'research',
            ];
            const dataWordHits = dataMarkers.filter((w) => lower.includes(w)).length;
            if (!hasNumbers && dataWordHits === 0) return 0;
            const dataScore = Math.min(
                1,
                (hasPercent ? 0.4 : 0) + (hasNumbers ? 0.3 : 0) + dataWordHits * 0.1,
            );
            return Math.max(
                0,
                Math.min(1, Math.round(((dataScore + speculationScore) / 2) * 100) / 100),
            );
        }

        case 'ethical_framework': {
            const frameworks = [
                'utilitarian',
                'utilitarianism',
                'deontology',
                'deontological',
                'virtue ethics',
                'virtue ethic',
                'social contract',
                'care ethics',
                'consequentialism',
                'consequentialist',
                'kantian',
                'kant',
                'mill',
                'bentham',
                'nussbaum',
                'rawls',
                'justice as fairness',
                'categorical imperative',
                'greatest good',
            ];
            const frameworkHits = frameworks.filter((w) => lower.includes(w)).length;
            const ethicalTerms = [
                'moral',
                'ethic',
                'rights',
                'duty',
                'obligation',
                'fairness',
                'justice',
                'harm',
                'autonomy',
                'dignity',
                'integrity',
                'principle',
                'value',
            ];
            const ethicalHits = ethicalTerms.filter((w) => words.includes(w)).length;
            const score = Math.min(1, frameworkHits * 0.35 + ethicalHits * 0.1);
            return Math.round(score * 100) / 100;
        }

        case 'first_principles': {
            const fpMarkers = [
                'fundamental',
                'first principle',
                'assume',
                'assumption',
                'derive',
                'base assumption',
                'axiom',
                'axiomatic',
                'premise',
                'foundation',
                'foundational',
                'underlying',
                'root cause',
                'essential nature',
                'by definition',
            ];
            const fpHits = fpMarkers.filter((w) => lower.includes(w)).length;
            const questionMarks = (text.match(/\?/g) || []).length;
            const score = Math.min(1, fpHits * 0.2 + questionMarks * 0.05);
            return Math.round(score * 100) / 100;
        }

        case 'pragmatic': {
            const pragmaticMarkers = [
                'practical',
                'implement',
                'feasible',
                'feasibility',
                'workable',
                'real world',
                'real-world',
                'outcome',
                'result',
                'concrete',
                'actionable',
                'step',
                'solution',
                'cost',
                'benefit',
                'resource',
                'timeline',
                'roadmap',
                'deploy',
                'execute',
            ];
            const pragmaticHits = pragmaticMarkers.filter((w) => lower.includes(w)).length;
            const theoryMarkers = [
                'theoretical',
                'in theory',
                'abstract',
                'philosophical',
                'hypothetical',
                'ideal world',
                'perfect world',
                'conceptually',
                'in principle',
            ];
            const theoryPenalty = theoryMarkers.filter((w) => lower.includes(w)).length * 0.25;
            const score = Math.max(0, Math.min(1, pragmaticHits * 0.12 - theoryPenalty));
            return Math.round(score * 100) / 100;
        }

        default:
            return 1;
    }
}

export function getConstraintCompliance(
    args: DebateArgument[],
    participants: DebateParticipant[],
): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const a of args) {
        const p = participants.find((pp) => pp.id === a.agentId);
        if (p?.constraint && p.constraint !== 'none') {
            scores[a.id] = scoreConstraintCompliance(a.content, p.constraint);
        }
    }
    return scores;
}
export interface DebateMetrics {
    graph: DebateGraphMetrics;
    activity: ActivityMetrics;
    quality: QualityMetrics;
    constraintCompliance?: Record<string, number>;
}
