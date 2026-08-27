/**
 * Knowledge Generator domain types.
 *
 * The Generator runs an autonomous research cycle
 * (trigger → hypothesis → evidence → peer review → crystallization) and
 * produces new semi-crystals (plan §5). A GenerationJob tracks the full
 * lifecycle of one such cycle, including the evidence collected, the peer
 * review verdicts and the resulting crystal (when confidence allows).
 */

export type GenerationTrigger =
    | { kind: 'scheduled'; cron: string; topic: string }
    | { kind: 'anomaly'; detectedAnomalyId: string }
    | { kind: 'gap'; gapDescription: string }
    | { kind: 'forum-question'; topicId: string }
    | { kind: 'crystal-conflict'; crystalIds: string[] }
    | { kind: 'cross-domain'; sourceDomains: string[] };

export type GenerationStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type GenerationStage = 'hypothesis' | 'evidence' | 'review' | 'crystallization' | 'done';

/** A single evidence item collected for a hypothesis. */
export interface GenerationEvidence {
    id: string;
    source: 'crystal-vault' | 'memory-mesh' | 'web-search' | 'counter-example';
    content: string;
    stance: 'support' | 'contradict' | 'neutral';
    score: number;
}

/** One peer-review verdict from a Debate Arena archetype. */
export interface GenerationReview {
    roleId: string;
    roleName: string;
    stance: 'advocate' | 'skeptic' | 'synthesizer' | 'metanavigator';
    verdict: 'accept' | 'reject' | 'needs-more-evidence';
    argument: string;
    confidence: number;
}

/** Per-job cost control (overrides from config-registry). */
export interface GeneratorLimits {
    maxTokensPerJob: number;
    maxConcurrentJobs: number;
    crystallizationThreshold: number;
}

export interface GenerationJob {
    id: GenerationJobId;
    trigger: GenerationTrigger;
    /** Human-readable research topic derived from the trigger. */
    topic: string;
    status: GenerationStatus;
    stage: GenerationStage;
    /** The winning (contrastive) hypothesis. */
    hypothesis: string;
    roleIds: string[];
    lensIds: string[];
    evidences: GenerationEvidence[];
    reviews: GenerationReview[];
    /** Combined peer-review confidence 0..1. */
    confidence: number;
    /** Resulting crystal id when crystallization succeeded. */
    crystalId?: string;
    error?: string;
    tokensSpent: number;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
}

export type GenerationJobId = string;

/** Persistence record — genJobs row (full job kept for round-trip reads). */
export interface GenerationJobRecord {
    id: GenerationJobId;
    trigger: GenerationTrigger;
    topic: string;
    status: GenerationStatus;
    stage: GenerationStage;
    hypothesis: string;
    confidence: number;
    crystalId?: string;
    error?: string;
    createdAt: number;
    /** Full job object for round-trip reads. */
    job?: GenerationJob;
}
