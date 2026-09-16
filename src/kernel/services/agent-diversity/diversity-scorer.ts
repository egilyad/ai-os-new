import type { Claim, ClaimEdge } from '../debate-runtime/debate-governor/types';
import type { AgentDiversityProfile, DiversityState, DiversityConfig, ClusterGroup } from './types';
import {
    pairwiseAgentSimilarities,
    computeSemanticDiversityScore,
    findRedundantPairs,
} from './semantic-distance';
import { extractReasoningSignature, computeReasoningDiversityScore } from './reasoning-patterns';
import { computeInfluenceScores, computeRedundancyScores } from './influence-tracker';
import { computeClusters, assignClusterIds } from './clustering';

const DEFAULT_CONFIG: DiversityConfig = {
    semanticWeight: 0.4,
    reasoningWeight: 0.3,
    influenceWeight: 0.2,
    redundancyPenalty: 0.3,
    redundancyThreshold: 0.7,
    clusterSimilarityThreshold: 0.6,
};

export class DiversityScorer {
    private profiles = new Map<string, AgentDiversityProfile>();
    private state: DiversityState;
    private config: DiversityConfig;

    constructor(config?: Partial<DiversityConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.state = {
            profiles: {},
            clusters: [],
            globalDiversityIndex: 0,
            redundantPairs: [],
            lastUpdated: Date.now(),
        };
    }

    update(
        claimsByAgent: Map<string, Claim[]>,
        edges: ClaimEdge[],
        resolvedClaimIds: Set<string>,
    ): DiversityState {
        const agents = [...claimsByAgent.keys()];
        if (agents.length < 2) return this.state;

        const similarities = pairwiseAgentSimilarities(claimsByAgent);

        const redundantPairs = findRedundantPairs(similarities, this.config.redundancyThreshold);

        const semanticScores = this.computeSemanticScores(similarities);

        const reasoningSignatures = this.computeReasoningSignatures(claimsByAgent, edges, agents);

        const reasoningDiversityScores = computeReasoningDiversityScore(reasoningSignatures);

        const influenceScores = computeInfluenceScores(claimsByAgent, edges, resolvedClaimIds);

        const redundancyScores = computeRedundancyScores(similarities);

        const clusterableProfiles = new Map<
            string,
            {
                agentId: string;
                reasoningPattern: import('./types').ReasoningPattern;
                semanticSims: number[];
                influence: number;
            }
        >();
        for (const agentId of agents) {
            const sims = [...(similarities.get(agentId)?.values() ?? [])];
            const sig = reasoningSignatures.get(agentId);
            clusterableProfiles.set(agentId, {
                agentId,
                reasoningPattern: sig?.pattern ?? 'inductive',
                semanticSims: sims,
                influence: influenceScores.get(agentId) ?? 0,
            });
        }

        const clusters = computeClusters(
            clusterableProfiles,
            this.config.clusterSimilarityThreshold,
        );
        const clusterAssignments = assignClusterIds(
            new Map(agents.map((a) => [a, undefined as unknown as AgentDiversityProfile])),
            clusters,
        );

        const profiles: AgentDiversityProfile[] = [];
        for (const agentId of agents) {
            const sd = semanticScores.get(agentId) ?? 0;
            const rd = reasoningDiversityScores.get(agentId) ?? 0;
            const iu = influenceScores.get(agentId) ?? 0;
            const red = redundancyScores.get(agentId) ?? 0;
            const sig = reasoningSignatures.get(agentId) ?? {
                pattern: 'inductive' as const,
                confidence: 0.5,
            };
            const clusterId = clusterAssignments.get(agentId) ?? 'unclustered';

            const overall = Math.max(
                0,
                this.config.semanticWeight * sd +
                    this.config.reasoningWeight * rd +
                    this.config.influenceWeight * iu -
                    this.config.redundancyPenalty * red,
            );

            const profile: AgentDiversityProfile = {
                agentId,
                semanticDiversityScore: Math.round(sd * 100) / 100,
                reasoningDiversityScore: Math.round(rd * 100) / 100,
                influenceUniquenessScore: Math.round(iu * 100) / 100,
                redundancyScore: Math.round(red * 100) / 100,
                overallScore: Math.round(overall * 100) / 100,
                clusterId,
                reasoningSignature: sig,
                claimCount: claimsByAgent.get(agentId)?.length ?? 0,
                lastUpdated: Date.now(),
            };

            profiles.push(profile);
            this.profiles.set(agentId, profile);
        }

        const profileMap: Record<string, AgentDiversityProfile> = {};
        for (const p of profiles) {
            profileMap[p.agentId] = p;
        }

        const globalDiversityIndex =
            profiles.length > 0
                ? Math.round(
                      (profiles.reduce((s, p) => s + p.overallScore, 0) / profiles.length) * 100,
                  ) / 100
                : 0;

        const clusterGroups: ClusterGroup[] = clusters.map((c) => ({
            ...c,
            members: c.agentIds
                .map((id) => profileMap[id]!)
                .filter(Boolean) as AgentDiversityProfile[],
        })) as ClusterGroup[];

        this.state = {
            profiles: profileMap,
            clusters: clusterGroups,
            globalDiversityIndex,
            redundantPairs,
            lastUpdated: Date.now(),
        };

        return this.state;
    }

    getState(): DiversityState {
        return this.state;
    }

    getProfile(agentId: string): AgentDiversityProfile | undefined {
        return this.profiles.get(agentId);
    }

    getRedundantPairs(): Array<{ agentA: string; agentB: string; similarity: number }> {
        return this.state.redundantPairs;
    }

    getDiverseAgents(threshold = 0.6): string[] {
        return [...this.profiles.values()]
            .filter((p) => p.overallScore >= threshold)
            .sort((a, b) => b.overallScore - a.overallScore)
            .map((p) => p.agentId);
    }

    getRedundantAgents(threshold = 0.7): string[] {
        return [...this.profiles.values()]
            .filter((p) => p.redundancyScore >= threshold)
            .sort((a, b) => b.redundancyScore - a.redundancyScore)
            .map((p) => p.agentId);
    }

    shouldSuppressAgent(agentId: string, diversityThreshold = 0.3): boolean {
        const profile = this.profiles.get(agentId);
        if (!profile) return false;
        return (
            profile.overallScore < diversityThreshold &&
            profile.redundancyScore > this.config.redundancyThreshold
        );
    }

    reset(): void {
        this.profiles.clear();
        this.state = {
            profiles: {},
            clusters: [],
            globalDiversityIndex: 0,
            redundantPairs: [],
            lastUpdated: Date.now(),
        };
    }

    private computeSemanticScores(
        similarities: Map<string, Map<string, number>>,
    ): Map<string, number> {
        const scores = new Map<string, number>();
        for (const [agentId, sims] of similarities) {
            const values = [...sims.values()];
            scores.set(agentId, computeSemanticDiversityScore(values));
        }
        return scores;
    }

    private computeReasoningSignatures(
        claimsByAgent: Map<string, Claim[]>,
        edges: ClaimEdge[],
        agents: string[],
    ): Map<string, import('./types').ReasoningSignature> {
        const signatures = new Map<string, import('./types').ReasoningSignature>();
        for (const agentId of agents) {
            const claims = claimsByAgent.get(agentId) ?? [];
            signatures.set(agentId, extractReasoningSignature(agentId, claims, edges));
        }
        return signatures;
    }
}
