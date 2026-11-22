import { describe, it, expect } from 'vitest';
import { DurableRunService } from './durable-run-service';

const cps = [
    { id: 'cp1', runId: 'r1', nodeId: 'a', createdAt: 1 },
    { id: 'cp3', runId: 'r1', nodeId: 'c', createdAt: 3 },
    { id: 'cp2', runId: 'r1', nodeId: 'b', createdAt: 2 },
    { id: 'other', runId: 'r2', nodeId: 'x', createdAt: 9 },
];

describe('DurableRunService', () => {
    it('picks the newest checkpoint for a run', () => {
        expect(new DurableRunService().lastCheckpoint('r1', cps)?.id).toBe('cp3');
    });

    it('plans replay from the last checkpoint after failure', () => {
        const plan = new DurableRunService().planResume(
            { id: 'r1', status: 'failed', error: 'LLM timeout' },
            cps,
        );
        expect(plan?.strategy).toBe('replay-node');
        expect(plan?.checkpointId).toBe('cp3');
        expect(plan?.nodeId).toBe('c');
        expect(plan?.reason).toContain('LLM timeout');
    });

    it('restarts from entry when there is no checkpoint', () => {
        const plan = new DurableRunService().planResume({ id: 'r9', status: 'failed' }, cps);
        expect(plan?.strategy).toBe('restart-from-entry');
    });

    it('does not plan resumes for non-failed runs', () => {
        const svc = new DurableRunService();
        expect(svc.planResume({ id: 'r1', status: 'running' }, cps)).toBeNull();
        expect(svc.planResume({ id: 'r1', status: 'completed' }, cps)).toBeNull();
    });
});
