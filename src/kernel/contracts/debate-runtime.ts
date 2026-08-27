import type { ITransaction } from './transaction';
import type { TopologyType, DebatePhase, AgentPhase, TimelineEntry } from './debate-types';
import type { EngineSizes } from '../utils/memory-tracker';
export type { TimelineEntry, DebatePhase, TopologyType, AgentPhase } from './debate-types';

// ── Topology ────────────────────────────────────────────────────────────

export interface TopologyNode {
    readonly id: string;
    readonly label: string;
    readonly role: import('./debate-types').DebateRole;
    readonly modelId?: string;
    readonly provider?: string;
    readonly config?: Record<string, unknown>;
}

export interface TopologyEdge {
    readonly from: string;
    readonly to: string;
    readonly type: 'sequential' | 'broadcast' | 'conditional';
    readonly condition?: string;
}

export interface DebateTopology {
    readonly id: string;
    readonly type: TopologyType;
    readonly nodes: TopologyNode[];
    readonly edges: TopologyEdge[];
    readonly maxDepth?: number;
    readonly maxRounds?: number;
}

export interface ITopologyService {
    validate(topology: DebateTopology): boolean;
    buildRounds(topology: DebateTopology): TopologyNode[][];
    getNextNodes(topology: DebateTopology, currentNodeId: string, roundOutput?: unknown): string[];
}

// ── Session Lifecycle ───────────────────────────────────────────────────

export interface AgentStateEntry {
    readonly agentId: string;
    readonly nodeId: string;
    readonly phase: AgentPhase;
    readonly round: number;
    readonly tokensUsed: number;
    readonly latency: number;
    readonly error?: string;
    readonly lastActiveAt: number;
}

export interface IDebateSession {
    readonly id: string;
    readonly topic: string;
    readonly topology: DebateTopology;
    readonly participants: ParticipantConfig[];
    readonly phase: DebatePhase;
    readonly round: number;
    readonly agentStates: Map<string, AgentStateEntry>;
    readonly createdAt: number;
    readonly language: string;
    readonly maxRounds?: number;

    hasProviderFailed(provider: string): boolean;
    markProviderFailed(provider: string): void;
    hasModelFailed(model: string): boolean;
    markModelFailed(model: string): void;
    readonly failedModels: string[];
    transition(to: DebatePhase, tx?: ITransaction): boolean;
    incrementRound(): void;
    setAgentPhase(agentId: string, phase: AgentPhase, tx?: ITransaction): void;
    setAgentError(agentId: string, error: string): void;
    recordUsage(agentId: string, tokens: number, cost: number, latency: number): void;
    readonly arguments?: ReadonlyArray<{
        agentId: string;
        content: string;
        round: number;
        timestamp: number;
        confidence: number;
        position?: string;
    }>;
    readonly qualitySettings?: Record<string, boolean>;
    snapshot(): DebateSessionSnapshot;
    incrementVersion?(newVersion: number): void;
    destroy(): void;
}

export interface DebateSessionSnapshot {
    readonly id: string;
    readonly topic: string;
    readonly topology: DebateTopology;
    readonly phase: DebatePhase;
    readonly version: number;
    readonly round: number;
    readonly agentStates: AgentStateEntry[];
    readonly totalTokens: number;
    readonly totalCost: number;
    readonly startedAt: number;
    readonly updatedAt: number;
    readonly language: string;
    readonly arguments?: ReadonlyArray<{
        agentId: string;
        content: string;
        round: number;
        timestamp: number;
        confidence: number;
        position?: string;
    }>;
    readonly failedProviders?: readonly string[];
    readonly failedModels?: readonly string[];
    readonly participants?: ReadonlyArray<ParticipantConfig>;
    readonly qualitySettings?: Record<string, boolean>;
}

// ── Budget ──────────────────────────────────────────────────────────────

export interface DebateBudgetLimits {
    readonly maxTokensPerDebate: number;
    readonly maxCostPerDebate: number;
    readonly maxRounds: number;
    readonly maxConcurrency: number;
    readonly maxDurationMs: number;
}

export type PressureLevel = 'low' | 'normal' | 'high' | 'critical';

export interface PressureAction {
    readonly level: PressureLevel;
    readonly reduceRounds: number;
    readonly downgradeModels: boolean;
    readonly trimContext: boolean;
    readonly reduceTopologyDepth: boolean;
}

export interface IDebateBudget {
    /** Atomically checks budget + records usage. Queue-based mutex prevents TOCTOU race. */
    reserveAndRecord(
        sessionId: string,
        estimatedTokens: number,
        estimatedCost: number,
    ): Promise<boolean>;
    incrementRound(sessionId: string): void;
    getPressure(): PressureLevel;
    getPressureAction(): PressureAction;
    snapshot(): BudgetSnapshot;
}

export interface BudgetSnapshot {
    readonly sessionId: string;
    readonly tokensUsed: number;
    readonly costUsed: number;
    readonly roundsUsed: number;
    readonly durationMs: number;
    readonly pressure: PressureLevel;
    readonly estimatedRemainingTokens: number;
    readonly estimatedRemainingCost: number;
}

// ── Consensus ───────────────────────────────────────────────────────────
// NOTE: Claim is the canonical type shared by the runtime engine and the
// governor layer. Both modules use this same shape. The governor layer
// populates the governor-specific fields (speaker, role, status, etc.);
// the runtime layer populates the runtime-specific fields (confidence,
// evidence, citations). Both must be present in all calls to
// DebateEvaluator.scoreArguments() and ConsensusEngine.evaluate().
export interface Claim {
    readonly id: string;
    readonly text: string;
    // Runtime fields
    readonly agentId: string;
    readonly round: number;
    readonly confidence: number;
    readonly evidence?: string;
    readonly citations?: string[];
    // Governor fields
    readonly speaker: string;
    readonly role: string;
    readonly status?: 'active' | 'challenged' | 'resolved' | 'disputed';
    readonly supportCount?: number;
    readonly challengeCount?: number;
    readonly sourceArgumentId?: string;
    readonly embedding?: number[];
    readonly createdAt?: number;
}

export interface Conflict {
    readonly id: string;
    readonly claimA: Claim;
    readonly claimB: Claim;
    readonly resolved: boolean;
    readonly resolution?: string;
}

export interface ConsensusResult {
    readonly agreements: Claim[];
    readonly conflicts: Conflict[];
    readonly unresolved: string[];
    readonly confidence: number;
    readonly contradictionDensity: number;
}

export interface IConsensusEngine {
    evaluate(claims: Claim[]): ConsensusResult;
    resolveConflict(conflict: Conflict, resolution: string): Conflict;
    getConfidenceGraph(): Map<string, number>;
}

// ── Memory ──────────────────────────────────────────────────────────────

export interface ReasoningStep {
    readonly agentId: string;
    readonly content: string;
    readonly type: 'claim' | 'evidence' | 'rebuttal' | 'synthesis';
    readonly confidence: number;
    readonly timestamp: number;
    readonly round?: number;
}

export interface ReasoningChain {
    readonly agentId: string;
    readonly topic: string;
    readonly steps: ReasoningStep[];
    readonly conclusion?: string;
    readonly coherence: number;
}

export interface IDebateMemory {
    recordStep(step: ReasoningStep): void;
    getAllSteps(): ReasoningStep[];
    getAgentSteps(agentId: string): ReasoningStep[];
    getRecentSteps(count: number): ReasoningStep[];
    trimContent(keepCount: number): void;
    getChain(agentId: string): ReasoningChain[];
    getClaimsForTopic(topic: string): Claim[];
    getWinningStrategies(): ReasoningChain[];
    snapshot(): MemorySnapshot;
    toJSON(): MemoryRecord;
    restoreFrom(data: MemoryRecord): void;
    destroy(): void;
}

export interface MemoryRecord {
    claims: Claim[];
    steps: ReasoningStep[];
    chains: ReasoningChain[];
}

export interface MemorySnapshot {
    readonly totalClaims: number;
    readonly totalChains: number;
    readonly topStrategies: string[];
}

// ── Evaluator ───────────────────────────────────────────────────────────

export interface AgentScore {
    readonly agentId: string;
    readonly overall: number;
    readonly argumentQuality: number;
    readonly rebuttalStrength: number;
    readonly coherence: number;
    readonly persuasiveness: number;
    readonly factuality: number;
    /** P0.9: How well the agent restates opponent positions before rebutting.
     *  0 = pure strawman, 1 = perfect steelman. */
    readonly steelmanQuality: number;
}

export interface IDebateEvaluator {
    scoreArguments(agentId: string, claims: Claim[], chain: ReasoningChain[]): AgentScore;
    rankParticipants(scores: AgentScore[]): AgentScore[];
}

// ── Orchestrator ────────────────────────────────────────────────────────

export type OrchestratorEvent =
    | { type: 'round:start'; round: number; nodes: string[] }
    | { type: 'round:end'; round: number; allErrored?: boolean; anyBudgetSkipped?: boolean }
    | { type: 'agent:thinking'; agentId: string }
    | { type: 'agent:responded'; agentId: string; content: string }
    | { type: 'agent:error'; agentId: string; error: string }
    | { type: 'topology:complete' }
    | { type: 'consensus:reached'; result: ConsensusResult }
    | { type: 'budget:pressure'; level: PressureLevel; action: PressureAction };

export interface AgentExecutionRequest {
    readonly sessionId: string;
    readonly agentId: string;
    readonly nodeId: string;
    readonly signal?: AbortSignal;
}

export interface AgentExecutionResult {
    readonly content: string;
    readonly latency: number;
    readonly success: boolean;
    readonly error?: string;
    readonly budgetSkipped?: boolean;
}

export type AgentExecutor = (request: AgentExecutionRequest) => Promise<AgentExecutionResult>;

export interface IDebateOrchestrator {
    generateRoundEvents(
        topology: DebateTopology,
        sessionId: string,
        startRound?: number,
        skipAgents?: ReadonlySet<string>,
    ): AsyncGenerator<OrchestratorEvent, void, unknown>;
    setAgentExecutor(executor: AgentExecutor): void;
    abort(sessionId: string): void;
    clearAbort(sessionId: string): void;
    destroy(): void;
}

// ── Timeline ────────────────────────────────────────────────────────────

export interface ReasoningTrace {
    readonly agentId: string;
    readonly round: number;
    readonly decisionPoints: string[];
    readonly uncertaintyMap: Record<string, number>;
    readonly timestamp: number;
}

export interface IDebateTimeline {
    record(entry: Omit<TimelineEntry, 'id' | 'timestamp'>): void;
    getEntries(sessionId: string): TimelineEntry[];
    getByType(type: string): TimelineEntry[];
    getReasoningTraces(sessionId: string): ReasoningTrace[];
    snapshot(): TimelineEntry[];
    destroy(): void;
}

// ── Engine ──────────────────────────────────────────────────────────────

export interface ParticipantConfig {
    readonly agentId: string;
    readonly nodeId: string;
    readonly role?: string;
    readonly modelId?: string;
    readonly provider?: string;
    readonly systemPrompt?: string;
}

export interface IDebateEngine {
    createSession(
        topology: DebateTopology,
        topic: string,
        participants: ParticipantConfig[],
        language?: string,
        qualitySettings?: Record<string, boolean>,
    ): string;
    startSession(sessionId: string): Promise<void>;
    pauseSession(sessionId: string): void;
    resumeSession(sessionId: string): void;
    cancelSession(sessionId: string): void;
    getSession(sessionId: string): DebateSessionSnapshot | undefined;
    getActiveSessions(): DebateSessionSnapshot[];
    getAllSessions(): DebateSessionSnapshot[];
    getTimeline(sessionId: string): TimelineEntry[];
    saveSnapshot(sessionId: string): Promise<void>;
    restoreSession(sessionId: string): Promise<DebateSessionSnapshot | null>;
    dumpSizes(): EngineSizes;
    destroy(): void;
}
