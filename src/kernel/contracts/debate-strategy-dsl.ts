// ── Debate Strategy DSL ─────────────────────────────────────────────
// Composable primitives for defining debate flows.
// Each primitive is a JSON-serializable block that can be composed
// into complex strategy definitions.

// ── Primitive Types ────────────────────────────────────────────────

export type StrategyPrimitiveType =
    'sequence' | 'debate_graph' | 'critic_loop' | 'voting' | 'peer_review';

export interface StrategyPrimitiveBase {
    readonly type: StrategyPrimitiveType;
    readonly id: string;
    readonly label?: string;
    readonly config?: Record<string, unknown>;
}

// ── Sequence: run steps in order ───────────────────────────────────

export interface SequenceStep {
    readonly stepId?: string;
    readonly primitive: StrategyPrimitive;
    readonly condition?: string;
    readonly label?: string;
    readonly description?: string;
}

export interface SequencePrimitive extends StrategyPrimitiveBase {
    readonly type: 'sequence';
    readonly steps: SequenceStep[];
    readonly abortOnError?: boolean;
}

// ── Debate Graph: structured multi-agent interaction ────────────────

export type GraphEdgeType = 'sequential' | 'broadcast' | 'conditional' | 'challenge' | 'refine';

export interface GraphEdge {
    readonly from: string;
    readonly to: string;
    readonly type: GraphEdgeType;
    readonly condition?: string;
    readonly maxOccurrences?: number;
}

export interface GraphAgentConfig {
    readonly nodeId: string;
    readonly role: 'pro' | 'con' | 'neutral' | 'judge' | 'attacker' | 'defender';
    readonly label?: string;
    readonly systemPrompt?: string;
    readonly modelId?: string;
    readonly provider?: string;
    readonly temperature?: number;
    readonly maxTokens?: number;
}

export interface DebateGraphPrimitive extends StrategyPrimitiveBase {
    readonly type: 'debate_graph';
    readonly agents: GraphAgentConfig[];
    readonly edges: GraphEdge[];
    readonly maxRounds?: number;
    readonly convergenceThreshold?: number;
    readonly earlyExitConfidence?: number;
}

// ── Critic Loop: iterative refinement ──────────────────────────────

export interface CriticLoopPrimitive extends StrategyPrimitiveBase {
    readonly type: 'critic_loop';
    readonly proponent: GraphAgentConfig;
    readonly critic: GraphAgentConfig;
    readonly maxIterations: number;
    readonly improvementThreshold?: number;
    readonly stopWhen?: 'agreement' | 'max_iterations' | 'no_improvement';
}

// ── Voting: opinion collection and tallying ─────────────────────────

export type VotingMechanism =
    'simple_majority' | 'supermajority' | 'unanimous' | 'ranked_choice' | 'weighted';

export interface VotingPrimitive extends StrategyPrimitiveBase {
    readonly type: 'voting';
    readonly voters?: GraphAgentConfig[];
    readonly participants?: string[];
    readonly options?: string[];
    readonly mechanism?: VotingMechanism;
    readonly tally?: string;
    readonly quorum?: number;
    readonly tieBreaker?: 'judge' | 'random' | 'skip';
    readonly maxRounds?: number;
}

// ── Peer Review: structured review workflow ─────────────────────────

export type ReviewCriteria =
    'correctness' | 'completeness' | 'clarity' | 'evidence' | 'originality' | 'feasibility';

export interface PeerReviewPrimitive extends StrategyPrimitiveBase {
    readonly type: 'peer_review';
    readonly authors?: GraphAgentConfig[];
    readonly author?: { nodeId: string; role: string; label: string };
    readonly reviewers: GraphAgentConfig[];
    readonly criteria: ReviewCriteria[];
    readonly minReviewsPerAuthor?: number;
    readonly revisionRounds?: number;
    readonly maxRevisions?: number;
    readonly passThreshold?: number;
}

// ── Union type ─────────────────────────────────────────────────────

export type StrategyPrimitive =
    | SequencePrimitive
    | DebateGraphPrimitive
    | CriticLoopPrimitive
    | VotingPrimitive
    | PeerReviewPrimitive;

// ── Top-level Strategy Definition ──────────────────────────────────

export interface StrategyParameter {
    readonly name: string;
    readonly label?: string;
    readonly type: 'number' | 'string' | 'boolean' | 'enum';
    readonly default?: unknown;
    readonly min?: number;
    readonly max?: number;
    readonly options?: string[];
    readonly description?: string;
}

export interface StrategyDefinition {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly version: string;
    readonly root: StrategyPrimitive;
    readonly parameters?: StrategyParameter[];
    readonly tags?: string[];
    readonly author?: string;
    readonly compatibility?: StrategyCompatibility;
}

// ── Compatibility ──────────────────────────────────────────────────

export type IncompatibilitySeverity = 'error' | 'warning';

export interface Incompatibility {
    readonly primitiveA: string;
    readonly primitiveB: string;
    readonly reason: string;
    readonly severity: IncompatibilitySeverity;
}

export interface StrategyCompatibility {
    readonly compatibleWith: string[];
    readonly incompatibleWith: string[];
    readonly requiredPrimitives?: StrategyPrimitiveType[];
    readonly forbiddenPrimitives?: StrategyPrimitiveType[];
}

export interface ValidationResult {
    readonly valid: boolean;
    readonly errors: ValidationError[];
    readonly warnings: ValidationError[];
}

export interface ValidationError {
    readonly path: string;
    readonly message: string;
    readonly code: string;
}

// ── Registry ───────────────────────────────────────────────────────

export interface StrategyRegistryEntry {
    readonly definition: StrategyDefinition;
    readonly builtin: boolean;
    readonly createdAt: number;
    readonly updatedAt: number;
}

export interface IStrategyRegistry {
    register(definition: StrategyDefinition, builtin?: boolean): void;
    unregister(id: string): boolean;
    get(id: string): StrategyDefinition | undefined;
    list(): StrategyRegistryEntry[];
    search(query: string): StrategyRegistryEntry[];
    validate(definition: StrategyDefinition): ValidationResult;
    getCompatibleStrategies(id: string): StrategyDefinition[];
    resolveConflicts(a: StrategyDefinition, b: StrategyDefinition): Incompatibility[];
}
