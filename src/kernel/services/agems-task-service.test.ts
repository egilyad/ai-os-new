import { AgemsTaskService } from './agems-task-service';
import { getDexieDb } from './database-service';
import { TaskIllegalTransitionError } from './task-state-machine';
import type { AgemsTask } from '../types/agems-task';

const service = new AgemsTaskService();

async function makeTask(overrides: Partial<AgemsTask> = {}): Promise<AgemsTask> {
    return service.create({
        title: 'test task',
        type: 'ONE_TIME',
        status: 'PENDING',
        priority: 'MEDIUM',
        ...overrides,
    });
}

describe('agems-task-service', () => {
    beforeEach(async () => {
        await getDexieDb().agemsTasks.clear();
    });

    afterEach(async () => {
        await getDexieDb().agemsTasks.clear();
    });

    it('claim is atomic under concurrent callers', async () => {
        const task = await makeTask();
        const results = await Promise.all([
            service.claimTask(task.id, 'agent-a'),
            service.claimTask(task.id, 'agent-b'),
        ]);
        expect(results.filter(Boolean)).toHaveLength(1);
        const after = (await service.list()).find((t) => t.id === task.id);
        expect(after?.lockedBy ?? '').toBeTruthy();
    });

    it('claim returns false for a task locked by another worker', async () => {
        const task = await makeTask();
        await service.claimTask(task.id, 'agent-a', 60000);
        const second = await service.claimTask(task.id, 'agent-b');
        expect(second).toBe(false);
    });

    it('claim succeeds for the same worker re-locking', async () => {
        const task = await makeTask();
        await service.claimTask(task.id, 'agent-a');
        const again = await service.claimTask(task.id, 'agent-a');
        expect(again).toBe(true);
    });

    it('claim on missing task returns false', async () => {
        expect(await service.claimTask('nope', 'agent-a')).toBe(false);
    });

    it('updateStatus rejects illegal transitions', async () => {
        const task = await makeTask({ status: 'COMPLETED' });
        await expect(service.updateStatus(task.id, 'PENDING')).rejects.toThrow(
            TaskIllegalTransitionError,
        );
    });

    it('updateStatus allows legal transitions', async () => {
        const task = await makeTask();
        const updated = await service.updateStatus(task.id, 'IN_PROGRESS');
        expect(updated?.status).toBe('IN_PROGRESS');
    });

    it('updateStatus allows re-queue from FAILED to PENDING', async () => {
        const task = await makeTask({ status: 'FAILED' });
        const updated = await service.updateStatus(task.id, 'PENDING');
        expect(updated?.status).toBe('PENDING');
    });

    it('releaseTask clears lock', async () => {
        const task = await makeTask();
        await service.claimTask(task.id, 'agent-a');
        await service.releaseTask(task.id);
        const after = (await service.list()).find((t) => t.id === task.id);
        expect(after?.lockedBy).toBeUndefined();
        expect(after?.lockedUntil).toBeUndefined();
    });

    it('records status history transitions', async () => {
        const task = await makeTask();
        await service.updateStatus(task.id, 'IN_PROGRESS', 'agent-a');
        await service.updateStatus(task.id, 'IN_REVIEW', 'agent-a');
        const history = await getDexieDb()
            .taskStatusHistory.where('taskId')
            .equals(task.id)
            .toArray();
        expect(history).toHaveLength(2);
        expect(history[0]?.fromStatus).toBe('PENDING');
        expect(history[0]?.toStatus).toBe('IN_PROGRESS');
        expect(history[1]?.toStatus).toBe('IN_REVIEW');
    });
});
