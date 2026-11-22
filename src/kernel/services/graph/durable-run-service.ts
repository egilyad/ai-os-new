/**
 * Durable resume planner (LangGraph-inspired, P1).
 *
 * Given a failed run and its checkpoints, chooses a safe resume point:
 * the last successful checkpoint (replay that node) or a full restart when
 * no checkpoint is available. Pure logic — no persistence, no side effects.
 */
import type {
    IDurableRunService,
    FailedRunView,
    ResumePointView,
    ResumePlan,
} from '../../contracts/durable-run';

export class DurableRunService implements IDurableRunService {
    async init(): Promise<void> {}

    async destroy(): Promise<void> {}

    lastCheckpoint(runId: string, checkpoints: ResumePointView[]): ResumePointView | null {
        return (
            checkpoints
                .filter((c) => c.runId === runId)
                .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null
        );
    }

    planResume(run: FailedRunView, checkpoints: ResumePointView[]): ResumePlan | null {
        if (run.status !== 'failed' && run.status !== 'aborted') return null;
        const cp = this.lastCheckpoint(run.id, checkpoints);
        if (!cp) {
            return {
                checkpointId: '',
                nodeId: '',
                strategy: 'restart-from-entry',
                reason: 'no checkpoint available — restart from graph entry',
            };
        }
        return {
            checkpointId: cp.id,
            nodeId: cp.nodeId,
            strategy: 'replay-node',
            reason: `resume from last checkpoint at node ${cp.nodeId}${run.error ? ` after: ${run.error.slice(0, 120)}` : ''}`,
        };
    }
}
