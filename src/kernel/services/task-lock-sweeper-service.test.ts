import { TaskLockSweeperService } from './task-lock-sweeper-service';
import { AgemsTaskService } from './agems-task-service';
import { getDexieDb } from './database-service';

const service = new AgemsTaskService();
const sweeper = new TaskLockSweeperService();

describe('task-lock-sweeper-service', () => {
    beforeEach(async () => {
        await getDexieDb().agemsTasks.clear();
    });

    afterEach(async () => {
        await getDexieDb().agemsTasks.clear();
        sweeper.stop();
    });

    it('re-queues expired IN_PROGRESS tasks to PENDING and clears lock', async () => {
        const task = await service.create({
            title: 'orphaned',
            type: 'ONE_TIME',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
        });
        await getDexieDb().agemsTasks.update(task.id, {
            lockedBy: 'agent-a',
            lockedUntil: Date.now() - 1000,
        } as never);

        const requeued = await sweeper.sweep();

        expect(requeued).toBe(1);
        const after = (await service.list()).find((t) => t.id === task.id);
        expect(after?.status).toBe('PENDING');
        expect(after?.lockedBy).toBeUndefined();
        expect(after?.lockedUntil).toBeUndefined();
    });

    it('clears lock on expired non-IN_PROGRESS task without changing status', async () => {
        const task = await service.create({
            title: 'done but locked',
            type: 'ONE_TIME',
            status: 'COMPLETED',
            priority: 'MEDIUM',
        });
        await getDexieDb().agemsTasks.update(task.id, {
            lockedBy: 'agent-a',
            lockedUntil: Date.now() - 1000,
        } as never);

        const requeued = await sweeper.sweep();

        expect(requeued).toBe(0);
        const after = (await service.list()).find((t) => t.id === task.id);
        expect(after?.status).toBe('COMPLETED');
        expect(after?.lockedBy).toBeUndefined();
    });

    it('does not touch fresh locks', async () => {
        const task = await service.create({
            title: 'active',
            type: 'ONE_TIME',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
        });
        await getDexieDb().agemsTasks.update(task.id, {
            lockedBy: 'agent-a',
            lockedUntil: Date.now() + 60_000,
        } as never);

        const requeued = await sweeper.sweep();

        expect(requeued).toBe(0);
        const after = (await service.list()).find((t) => t.id === task.id);
        expect(after?.status).toBe('IN_PROGRESS');
        expect(after?.lockedBy).toBe('agent-a');
    });

    it('re-queues FAILED task with retry backoff (M5.3)', async () => {
        const task = await service.create({
            title: 'failed task',
            type: 'ONE_TIME',
            status: 'FAILED',
            priority: 'MEDIUM',
            retryCount: 0,
            maxRetries: 3,
        });

        await sweeper.sweep();

        const after = (await service.list()).find((t) => t.id === task.id);
        expect(after?.status).toBe('PENDING');
        expect(after?.retryCount).toBe(1);
        expect(after?.nextRetryAt).toBeGreaterThan(Date.now());
    });

    it('does not retry beyond maxRetries (M5.3)', async () => {
        const task = await service.create({
            title: 'failed task',
            type: 'ONE_TIME',
            status: 'FAILED',
            priority: 'MEDIUM',
            retryCount: 3,
            maxRetries: 3,
        });

        await sweeper.sweep();

        const after = (await service.list()).find((t) => t.id === task.id);
        expect(after?.status).toBe('FAILED');
    });

    it('spawns due RECURRING instances (M5.1)', async () => {
        const recurring = await service.create({
            title: 'daily digest',
            type: 'RECURRING',
            status: 'PENDING',
            priority: 'MEDIUM',
            cronSchedule: { kind: 'preset', preset: 'DAILY' },
            lastRunAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        });

        await sweeper.sweep();

        const all = await service.list();
        const instances = all.filter((t) => t.parentId === recurring.id);
        expect(instances).toHaveLength(1);
        expect(instances[0]?.type).toBe('ONE_TIME');
    });
});
