import type { ConclusionType, StanceResult } from './storage/debate-store';

export type { ConclusionType, StanceResult };

export interface TimelineEntry {
    readonly id: string;
    readonly sessionId: string;
    readonly timestamp: number;
    readonly type: string;
    readonly payload: unknown;
}

export type TopologyType = 'linear' | 'roundtable' | 'judge' | 'tree-of-thought' | 'red-blue';

export type DebatePhase =
    | 'created'
    | 'queued'
    | 'initializing'
    | 'active'
    | 'deliberating'
    | 'consensus'
    | 'summarizing'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled';

export type AgentPhase =
    | 'idle'
    | 'thinking'
    | 'waiting'
    | 'streaming'
    | 'errored'
    | 'rate-limited'
    | 'fallback'
    | 'timed-out'
    | 'completed';

export interface IDebateQueryEngine {
    query(
        session: {
            id: string;
            topic: string;
            arguments: ReadonlyArray<{
                agentId: string;
                agentName: string;
                content: string;
                round: number;
            }>;
        },
        criteria: {
            agentId?: string;
            round?: number;
            type?: string;
            confidenceMin?: number;
        },
    ): TimelineEntry[];
}

export type DebateRole = 'pro' | 'con' | 'neutral' | 'judge' | 'attacker' | 'defender';
export type DebateSessionStrategy =
    | 'round_robin'
    | 'sequential'
    | 'judge'
    | 'tree-of-thought'
    | 'red-blue'
    | 'cross-examination'
    | 'socratic'
    | 'tournament'
    | 'argument_tree'
    | 'constrained'
    | 'moderated'
    | 'free_for_all'
    | 'jury_trial';
export type DebateStrategy = DebateSessionStrategy;
export type DebateConstraint =
    | 'none'
    | 'facts_only'
    | 'emotional_only'
    | 'data_driven'
    | 'ethical_framework'
    | 'first_principles'
    | 'pragmatic';
export type ParentResolution = 'explicit' | 'fallback_latest' | 'orphan' | 'invalid_reference';

export interface DebateGraphMetrics {
    totalNodes: number;
    maxDepth: number;
    avgDepth: number;
    orphanRate: number;
    branchingFactor: number;
    challengeDensity: number;
    refinementDensity: number;
}

export interface AgentActivityMetric {
    agentId: string;
    agentName: string;
    argumentCount: number;
    wordCount: number;
    avgConfidence: number;
    avgDepth: number;
    childrenReceived: number;
}

export interface ArgumentImpact {
    argumentId: string;
    agentName: string;
    content: string;
    childCount: number;
    round: number;
}

export interface ActivityMetrics {
    perAgent: AgentActivityMetric[];
    mostDiscussed: ArgumentImpact[];
    roundIntensity: number[];
}

export interface DepthMetric {
    uniqueArguments: number;
    lexicalDiversity: number;
    uniqueBigrams: number;
    topicBreadth: number;
    depthScore: number;
}

export interface OriginalityMetric {
    selfRepetition: number;
    crossRepetition: number;
    noveltyScore: number;
}

export interface UsefulnessMetric {
    relevanceScore: number;
    evidenceScore: number;
    structureScore: number;
    usefulnessScore: number;
}

export interface QualityMetrics {
    depth: DepthMetric;
    originality: OriginalityMetric;
    usefulness: UsefulnessMetric;
}

export type ArgumentStrategy =
    | 'counterargument_only'
    | 'empirical_analysis'
    | 'scenario_forecast'
    | 'risk_review'
    | 'rebuttal'
    | 'first_principles'
    | 'ethical_evaluation'
    | 'economic_analysis'
    | 'technical_deep_dive'
    | 'social_impact';

export interface DebateParticipant {
    id: string;
    agentId?: string;
    name: string;
    role: DebateRole;
    systemPrompt?: string;
    provider?: string;
    modelId?: string;
    temperature?: number;
    constraint?: DebateConstraint;
    strategy?: ArgumentStrategy;
}

export interface DebateArgument {
    id: string;
    agentId: string;
    agentName: string;
    content: string;
    confidence: number;
    timestamp: number;
    round: number;
    position: DebateRole;
    provider?: string;
    model?: string;
    executionId?: string;
    source: 'llm' | 'human' | 'fallback';
    fallbackReason?: string;
    parentId?: string;
    parentResolution?: ParentResolution;
    rawParentRef?: string;
    duplicateOf?: string;
    role?: DebateRole;
    socraticQuality?: number;
    socraticQualityReasons?: string[];
}

export interface DebateConfig {
    roundDelayMs: number;
    maxTokens: number;
    temperature: number;
    debateTemperature: number;
    useModerator: boolean;
    timeoutMs: number;
    maxDurationMs?: number;
    useGovernor?: boolean;
    language?: 'ru' | 'en';
    qualitySettings?: Record<string, boolean>;
}

export interface HumanVote {
    round: number;
    voter: 'human';
    votedAgentId: string;
    score: number;
    timestamp: number;
}

export interface VerdictKeyArgument {
    agentId: string;
    agentName: string;
    content: string;
    stance: 'pro' | 'con' | 'neutral';
    strength: number;
}

export interface DebateVerdict {
    sessionId: string;
    topic: string;
    summary: string;
    conclusionType: ConclusionType;
    stanceResult: StanceResult;
    keyArguments: VerdictKeyArgument[];
    reasoning: string;
    confidence: number;
    generatedAt: number;
    roundsTotal: number;
    totalTokens: number;
}

export type VerdictFeedbackVote = 'agree' | 'disagree';

export interface VerdictFeedback {
    sessionId: string;
    vote: VerdictFeedbackVote;
    comment?: string;
    timestamp: number;
}

export interface DebateSession {
    id: string;
    topic: string;
    status: DebatePhase;
    strategy: DebateSessionStrategy;
    maxRounds: number;
    currentRound: number;
    participants: DebateParticipant[];
    arguments: DebateArgument[];
    convergenceScore: number;
    totalTokens?: number;
    totalCost?: number;
    createdAt: number;
    openingStatements?: DebateArgument[];
    config: DebateConfig;
    consensus?: string;
    socraticQuestioner?: number;
    argumentTreeRoundMap?: Record<string, string>;
    graphMetrics?: DebateGraphMetrics;
    interpretation?: DebateInterpretation;
    activityMetrics?: ActivityMetrics;
    qualityMetrics?: QualityMetrics;
    roundVotes?: Record<number, HumanVote[]>;
    metadata?: Record<string, unknown>;
    tags?: string[];
}

export interface DisagreementPoint {
    round: number;
    intensity: number;
    trigger: string;
    participants: string[];
}

export interface TrajectoryChanger {
    argumentId: string;
    agentName: string;
    round: number;
    impact: 'shifted_focus' | 'deepened' | 'contradicted' | 'consensus_shift';
    description: string;
}

export interface ConstraintCorrelation {
    byConstraint: Record<
        string,
        {
            avgDepth: number;
            avgConfidence: number;
            challengeRate: number;
            compliance: number;
            count: number;
        }
    >;
}

export interface DebateInterpretation {
    summary: string;
    disagreementPeak: DisagreementPoint | null;
    disagreementTimeline: Array<{ round: number; intensity: number }>;
    trajectoryChangers: TrajectoryChanger[];
    constraintCorrelation?: ConstraintCorrelation;
    insights: string[];
}

export function jaccardSimilarity(a: string, b: string): number {
    const wordsA = new Set(
        a
            .toLowerCase()
            .replace(/[^a-zа-яё0-9\s]/g, '')
            .split(/\s+/)
            .filter(Boolean),
    );
    const wordsB = new Set(
        b
            .toLowerCase()
            .replace(/[^a-zа-яё0-9\s]/g, '')
            .split(/\s+/)
            .filter(Boolean),
    );
    if (wordsA.size === 0 && wordsB.size === 0) return 1;
    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.size / union.size;
}
