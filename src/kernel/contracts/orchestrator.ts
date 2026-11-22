import type { ILifecycle } from './lifecycle';
import type { DispatchAssignment } from './dispatcher';

export interface MissionNode {
    id: string;
    description: string;
    /** IDs of nodes that must finish before this one can start. */
    dependsOn: string[];
    /** Optional role/expertise used by the dispatcher to pick an executor. */
    assignee?: { role?: string; expertise?: string[] };
    status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
    result?: string;
}

export interface MissionPlan {
    id: string;
    goal: string;
    nodes: MissionNode[];
    createdAt: number;
}

/** Per-node execution policy (LangGraph-style retry/cache). */
export interface NodePolicy {
    maxAttempts?: number;
    retryDelayMs?: number;
    /** Cache key derived from node + dependency outputs. */
    cacheKey?: (node: MissionNode, dependencyOutputs: Record<string, string>) => string;
}

/** Reason for cooperative cancellation (ChatDev-style). */
export interface CancellationRequest {
    reason: string;
    requestedAt: number;
}

/**
 * Typed artifact passed between mission nodes (PaperOrchestra-style:
 * plan → bibliography → draft → reviewed manuscript as first-class objects).
 */
export interface MissionArtifact {
    nodeId: string;
    type: 'text' | 'json' | 'code' | 'report' | 'review';
    content: string;
    /** Optional metadata (producer, path, metrics, reviewer scores...). */
    meta?: Record<string, unknown>;
    createdAt: number;
}

export interface MissionResult {
    missionId: string;
    goal: string;
    status: 'completed' | 'failed';
    outputs: Record<string, string>;
    artifacts: MissionArtifact[];
    failedNodeIds: string[];
}

export type MissionExecutor = (
    node: MissionNode,
    context: {
        goal: string;
        dependencyOutputs: Record<string, string>;
        /** Typed dependency artifacts (same data as dependencyOutputs). */
        dependencyArtifacts: MissionArtifact[];
    },
) => Promise<string | MissionArtifact>;

/** Unified orchestrator: goal → dependency DAG → dispatched execution → result. */
export interface IOrchestratorService extends ILifecycle {
    plan(goal: string): Promise<MissionPlan>;
    run(goal: string, executor: MissionExecutor): Promise<MissionResult>;
    /** Run with agents assigned by the dispatcher (node.assignee → concrete agent). */
    runWithDispatcher(
        goal: string,
        executor: MissionExecutor,
        dispatcher: { assign(nodes: MissionNode[]): DispatchAssignment[] },
    ): Promise<MissionResult & { assignments: DispatchAssignment[] }>;
}
