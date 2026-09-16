import type { ReasoningPattern, ClusterGroup, AgentDiversityProfile } from './types';

interface AgentVector {
    agentId: string;
    vector: number[];
}

function buildAgentVectors(
    profiles: Map<
        string,
        { reasoningPattern: ReasoningPattern; semanticSims: number[]; influence: number }
    >,
): AgentVector[] {
    const patternMap: Record<ReasoningPattern, number> = {
        deductive: 0,
        inductive: 1,
        analogical: 2,
        causal: 3,
        adversarial: 4,
        'synthesis-heavy': 5,
    };

    return [...profiles.entries()].map(([agentId, p]) => {
        const patternOneHot = new Array(6).fill(0);
        patternOneHot[patternMap[p.reasoningPattern] ?? 0] = 1;

        const avgSemSim =
            p.semanticSims.length > 0
                ? p.semanticSims.reduce((a, b) => a + b, 0) / p.semanticSims.length
                : 0;

        const vector = [...patternOneHot, avgSemSim, p.influence];

        return { agentId, vector };
    });
}

function cosineDistance(a: number[], b: number[]): number {
    let dot = 0,
        magA = 0,
        magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i]! * b[i]!;
        magA += a[i]! * a[i]!;
        magB += b[i]! * b[i]!;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    if (denom === 0) return 1;
    return 1 - dot / denom;
}

function aggloCluster(vectors: AgentVector[], distanceThreshold: number): Array<AgentVector[]> {
    const clusters: Array<AgentVector[]> = vectors.map((v) => [v]);

    let changed = true;
    while (changed) {
        changed = false;
        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                const centroidI = computeCentroid(clusters[i]!);
                const centroidJ = computeCentroid(clusters[j]!);
                const dist = cosineDistance(centroidI, centroidJ);

                if (dist < distanceThreshold) {
                    clusters[i]!.push(...clusters[j]!);
                    clusters.splice(j, 1);
                    changed = true;
                    break;
                }
            }
            if (changed) break;
        }
    }

    return clusters;
}

function computeCentroid(cluster: AgentVector[]): number[] {
    const dim = cluster[0]!.vector.length;
    const centroid = new Array(dim).fill(0);
    for (const v of cluster) {
        for (let i = 0; i < dim; i++) {
            centroid[i] += v.vector[i];
        }
    }
    return centroid.map((c) => c / cluster.length);
}

export function computeClusters(
    profiles: Map<
        string,
        {
            agentId: string;
            reasoningPattern: ReasoningPattern;
            semanticSims: number[];
            influence: number;
        }
    >,
    similarityThreshold: number,
): ClusterGroup[] {
    const vectors = buildAgentVectors(profiles);
    if (vectors.length === 0) return [];

    const rawClusters = aggloCluster(vectors, 1 - similarityThreshold);

    const patternNames: ReasoningPattern[] = [
        'deductive',
        'inductive',
        'analogical',
        'causal',
        'adversarial',
        'synthesis-heavy',
    ];

    return rawClusters.map((cluster, idx) => {
        const agentIds = cluster.map((v) => v.agentId);
        const centroid = computeCentroid(cluster);

        const maxPatternIdx = centroid.slice(0, 6).indexOf(Math.max(...centroid.slice(0, 6)));
        const dominantPattern = patternNames[Math.max(0, Math.min(maxPatternIdx, 5))];

        const id = `${dominantPattern}_${idx + 1}`;

        return {
            id,
            agentIds,
            centroid,
            members: [],
        };
    });
}

export function assignClusterIds(
    profiles: Map<string, AgentDiversityProfile>,
    clusters: ClusterGroup[],
): Map<string, string> {
    const result = new Map<string, string>();

    for (const cluster of clusters) {
        for (const agentId of cluster.agentIds) {
            result.set(agentId, cluster.id);
        }
    }

    for (const [agentId] of profiles) {
        if (!result.has(agentId)) {
            result.set(agentId, 'unclustered');
        }
    }

    return result;
}
