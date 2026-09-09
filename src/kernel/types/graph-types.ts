/**
 * State Graph runtime domain types — Roadmap Wave 3.
 *
 * LangGraph-inspired nodes + edges + conditional routing over the existing
 * Cognitive Builder concepts (no builder changes — the graph is a new runtime
 * that can *host* builder flows, crews, councils and forge drafts as nodes).
 *
 * Persistence: Dexie `graphs` + `graphRuns` + `graphCheckpoints` +
 * `graphDecisions` (v25). Communication: EventBus only (`graph:*`).
 */

export type GraphNodeKind =
    | 'task'
    | 'crew'
    | 'council'
    | 'reflection'
    | 'gate'
    | 'human'
    | 'subgraph';

export type OrchestrationMode =
    | 'sequential'
    | 'hierarchical'
    | 'council'
    | 'swarm'
    | 'graph'
    | 'forge';

export interface GraphNodeDef {
    id: string;
    kind: GraphNodeKind;
    label: string;
    /** Kind-specific config (crewId / topic / condition / prompt …). */
    config?: Record<string, unknown>;
    /** HITL gate: pause before executing this node until approved. */
    requireApproval?: boolean;
}

export interface GraphEdge {
    id: string;
    from: string;
    to: string;
    /** Condition on run state for conditional routing (simple `key=value` / `key!=value`). */
    condition?: string;
    label?: string;
}

export interface GraphDefinition {
    id: string;
    name: string;
    description?: string;
    mode: OrchestrationMode;
    nodes: GraphNodeDef[];
    edges: GraphEdge[];
    entryNodeId: string;
    /** Reflection every N steps (0 = off). */
    reflectEvery?: number;
    maxSteps?: number;
    createdAt: number;
    updatedAt: number;
}

export type GraphRunStatus = 'running' | 'paused' | 'completed' | 'failed' | 'aborted';

export interface GraphRun {
    id: string;
    graphId: string;
    status: GraphRunStatus;
    /** Current node id (null when finished). */
    currentNodeId: string | null;
    /** Shared mutable state flowing through nodes. */
    state: Record<string, unknown>;
    /** Ordered visited node ids. */
    visited: string[];
    stepCount: number;
    /** Pending HITL request (when paused). */
    pendingHitl?: HitlRequest;
    result?: string;
    error?: string;
    createdAt: number;
    updatedAt: number;
}

export interface HitlRequest {
    runId: string;
    nodeId: string;
    prompt: string;
    stateSnapshot: Record<string, unknown>;
    createdAt: number;
}

export interface GraphCheckpoint {
    id: string;
    runId: string;
    graphId: string;
    stepIndex: number;
    nodeId: string;
    state: Record<string, unknown>;
    label?: string;
    createdAt: number;
}

export interface DecisionEntry {
    id: string;
    runId: string;
    graphId: string;
    nodeId: string;
    decision: string;
    why: string;
    rejected: string[];
    createdAt: number;
}

/** LangGraph-style thread: groups runs of one graph into a conversation. */
export interface GraphThread {
    id: string;
    graphId: string;
    runIds: string[];
    createdAt: number;
    updatedAt: number;
}

/** Dexie rows. */
export interface GraphRecord {
    id: string;
    name: string;
    description?: string;
    mode: OrchestrationMode;
    nodes: GraphNodeDef[];
    edges: GraphEdge[];
    entryNodeId: string;
    reflectEvery?: number;
    maxSteps?: number;
    createdAt: number;
    updatedAt: number;
}

export interface GraphRunRecord {
    id: string;
    graphId: string;
    status: GraphRunStatus;
    currentNodeId: string | null;
    state: Record<string, unknown>;
    visited: string[];
    stepCount: number;
    pendingHitl?: HitlRequest;
    result?: string;
    error?: string;
    createdAt: number;
    updatedAt: number;
}
