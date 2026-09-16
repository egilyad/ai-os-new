import type { Claim } from '../debate-runtime/debate-governor/types';

export function jaccardSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\W+/));
    const wordsB = new Set(b.toLowerCase().split(/\W+/));
    const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;
    return union > 0 ? intersection / union : 0;
}

export function computeAgentPairSimilarity(claimsA: Claim[], claimsB: Claim[]): number {
    if (claimsA.length === 0 || claimsB.length === 0) return 0;

    let totalSim = 0;
    let comparisons = 0;
    const step = Math.max(1, Math.floor(Math.max(claimsA.length, claimsB.length) / 8));

    for (let i = 0; i < claimsA.length; i += step) {
        for (let j = 0; j < claimsB.length; j += step) {
            totalSim += jaccardSimilarity(claimsA[i]!.text, claimsB[j]!.text);
            comparisons++;
        }
    }

    return comparisons > 0 ? totalSim / comparisons : 0;
}

export function computeSemanticDiversityScore(similaritiesToOthers: number[]): number {
    if (similaritiesToOthers.length === 0) return 0;
    const maxSim = Math.max(...similaritiesToOthers);
    return Math.max(0, 1 - maxSim);
}

export function pairwiseAgentSimilarities(
    claimsByAgent: Map<string, Claim[]>,
): Map<string, Map<string, number>> {
    const result = new Map<string, Map<string, number>>();
    const agents = [...claimsByAgent.keys()];

    for (const a of agents) {
        result.set(a, new Map());
    }

    for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
            const sim = computeAgentPairSimilarity(
                claimsByAgent.get(agents[i]!)!,
                claimsByAgent.get(agents[j]!)!,
            );
            result.get(agents[i]!)!.set(agents[j]!, sim);
            result.get(agents[j]!)!.set(agents[i]!, sim);
        }
    }

    return result;
}

export function findRedundantPairs(
    similarities: Map<string, Map<string, number>>,
    threshold: number,
): Array<{ agentA: string; agentB: string; similarity: number }> {
    const pairs: Array<{ agentA: string; agentB: string; similarity: number }> = [];
    const agents = [...similarities.keys()];

    for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
            const sim = similarities.get(agents[i]!)!.get(agents[j]!) ?? 0;
            if (sim > threshold) {
                pairs.push({ agentA: agents[i]!, agentB: agents[j]!, similarity: sim });
            }
        }
    }

    return pairs.sort((a, b) => b.similarity - a.similarity);
}
