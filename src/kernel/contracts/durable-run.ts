import type { ILifecycle } from './lifecycle';

export interface FailedRunView {
    id: string;
    status: 'running' | 'paused' | 'aborted' | 'failed' | 'completed';
    error?: string;
    currentNodeId?: string;
}

export interface ResumePointView {
    id: string;
    runId: string;
    nodeId: string;
    createdAt: number;
}

export interface ResumePlan {
    checkpointId: string;
    nodeId: string;
    strategy: 'replay-node' | 'restart-from-entry';
    reason: string;
}

/** Plan a durable resume after a failed run (LangGraph P1). */
export interface IDurableRunService extends ILifecycle {
    planResume(run: FailedRunView, checkpoints: ResumePointView[]): ResumePlan | null;
    /** Choose the last checkpoint for a run, newest first. */
    lastCheckpoint(runId: string, checkpoints: ResumePointView[]): ResumePointView | null;
}
