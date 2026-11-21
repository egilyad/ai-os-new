import type { ILifecycle } from './lifecycle';

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

export interface MissionResult {
    missionId: string;
    goal: string;
    status: 'completed' | 'failed';
    outputs: Record<string, string>;
    failedNodeIds: string[];
}

export type MissionExecutor = (
    node: MissionNode,
    context: {
        goal: string;
        dependencyOutputs: Record<string, string>;
    },
) => Promise<string>;

/** Unified orchestrator: goal → dependency DAG → dispatched execution → result. */
export interface IOrchestratorService extends ILifecycle {
    plan(goal: string): Promise<MissionPlan>;
    run(goal: string, executor: MissionExecutor): Promise<MissionResult>;
}
