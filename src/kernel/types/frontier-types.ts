/**
 * Frontier domain types — Roadmap Phase D (Waves 12+13).
 *
 * Agent/team evaluation, A/B comparison, red-team findings, capability matrix,
 * society simulations, cross-model norms, long-horizon orgs, intent plans,
 * multimodal capability registry.
 *
 * Persistence: Dexie v31 (8 tables). Communication: EventBus (`eval:*`).
 * EvalDatasetService (LLM prompt evals) untouched — this is the agent layer.
 */

export type BenchmarkMetric = 'contains' | 'exact' | 'token_f1';

export interface BenchmarkCase {
    id: string;
    task: string;
    /** Expected output substring (deterministic check, offline). */
    expectContains?: string;
    /** G.1 Haystack-style metric: contains (default) | exact | token_f1. */
    metric?: BenchmarkMetric;
    /** Reference answer for exact/token_f1 metrics. */
    reference?: string;
    maxScore: number;
}

export interface Benchmark {
    id: string;
    name: string;
    description?: string;
    cases: BenchmarkCase[];
    createdAt: number;
}

export interface CaseScore {
    caseId: string;
    output: string;
    score: number;
    maxScore: number;
    passed: boolean;
}

export interface EvalRun {
    id: string;
    benchmarkId: string;
    subject: string;
    scores: CaseScore[];
    total: number;
    maxTotal: number;
    createdAt: number;
}

export interface RedFinding {
    id: string;
    target: string;
    attack: string;
    result: 'blocked' | 'bypassed' | 'unclear';
    note?: string;
    createdAt: number;
}

export interface CapabilityMatrixEntry {
    area: string;
    capability: string;
    status: 'done' | 'partial' | 'missing';
    ref: string;
}

export interface SimAgent {
    id: string;
    name: string;
    traits: Record<string, number>;
    state: string;
}

export interface Simulation {
    id: string;
    name: string;
    kind: 'society' | 'economy' | 'org';
    agents: SimAgent[];
    rounds: number;
    log: string[];
    createdAt: number;
    updatedAt: number;
}

export interface SocietyNorm {
    id: string;
    societyId: string;
    rule: string;
    adherence: number;
    violations: number;
    createdAt: number;
}

export interface OrgCharter {
    id: string;
    name: string;
    mission: string;
    members: string[];
    ledger: string[];
    heartbeats: number;
    status: 'active' | 'paused' | 'dissolved';
    createdAt: number;
    updatedAt: number;
}

export interface IntentPlan {
    id: string;
    intent: string;
    steps: Array<{ action: string; detail: string }>;
    createdAt: number;
}

export interface ModalCapability {
    id: string;
    modality: 'vision' | 'audio' | 'video';
    agentId: string;
    note?: string;
    createdAt: number;
}
