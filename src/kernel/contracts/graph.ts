import type { ILifecycle } from './lifecycle';
import type {
    DecisionEntry,
    GraphCheckpoint,
    GraphDefinition,
    GraphNodeDef,
    GraphEdge,
    GraphRun,
    GraphThread,
    HitlRequest,
    OrchestrationMode,
} from '../types/graph-types';

export type {
    DecisionEntry,
    GraphCheckpoint,
    GraphDefinition,
    GraphNodeDef,
    GraphEdge,
    GraphRun,
    GraphThread,
    HitlRequest,
    OrchestrationMode,
} from '../types/graph-types';

export interface DefineGraphInput {
    name: string;
    description?: string;
    mode?: OrchestrationMode;
    nodes: GraphNodeDef[];
    edges: GraphEdge[];
    entryNodeId: string;
    reflectEvery?: number;
    maxSteps?: number;
}

/** Node executor boundary — graph stays deterministic offline without it. */
export interface IGraphLlmPort {
    runTask(input: { label: string; state: Record<string, unknown> }): Promise<string>;
    reflect(input: { visited: string[]; state: Record<string, unknown> }): Promise<string>;
}

/** Delegates to real Wave 1 / Wave 2 services (wired in phase25). */
export interface IGraphDelegates {
    runCrew?(crewId: string, task: string): Promise<string>;
    runCouncil?(topic: string): Promise<string>;
    forgeDraft?(goal: string): Promise<string>;
}

/**
 * GraphService — Wave 3 runtime (LangGraph-style, local-first).
 *
 * Nodes + edges + conditional routing, durable per-node checkpoints,
 * time-travel restore, HITL interrupts with approve/reject/state-edit,
 * checkpoint-driven reflection cycles and a decision log.
 */
export interface IGraphService extends ILifecycle {
    defineGraph(input: DefineGraphInput): Promise<GraphDefinition>;
    getGraph(id: string): Promise<GraphDefinition | null>;
    listGraphs(): Promise<GraphDefinition[]>;
    deleteGraph(id: string): Promise<void>;

    /** Build a ready-made graph for one of the 6 orchestration modes. */
    buildModeGraph(
        mode: OrchestrationMode,
        params?: Record<string, unknown>,
    ): Promise<GraphDefinition>;

    runGraph(graphId: string, input?: Record<string, unknown>): Promise<GraphRun>;
    getRun(runId: string): Promise<GraphRun | null>;
    listRuns(graphId?: string): Promise<GraphRun[]>;

    // ── HITL ──
    interrupt(runId: string, prompt?: string): Promise<HitlRequest>;
    approve(runId: string, editedState?: Record<string, unknown>): Promise<GraphRun>;
    reject(runId: string, reason?: string): Promise<GraphRun>;
    editState(runId: string, patch: Record<string, unknown>): Promise<GraphRun>;

    // ── Checkpointing / time-travel ──
    listCheckpoints(runId: string): Promise<GraphCheckpoint[]>;
    restoreCheckpoint(runId: string, checkpointId: string): Promise<GraphRun>;

    // ── Reflection + Decision Log ──
    reflect(runId: string): Promise<string>;
    decisionLog(runId: string): Promise<DecisionEntry[]>;
    abortRun(runId: string): Promise<void>;

    // ── Threads (F.1, LangGraph thread_id analogue) ──
    startThread(graphId: string): Promise<GraphThread>;
    postToThread(threadId: string, input?: Record<string, unknown>): Promise<GraphRun>;
    listThreads(graphId?: string): Promise<GraphThread[]>;
}
