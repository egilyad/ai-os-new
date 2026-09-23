import { getDexieDb } from './dexie-schema';
import type { AgemsTask, AgemsTaskStatus } from '../types/agems-task';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AgemsTask');

export class AgemsTaskService {
    async create(input: Omit<AgemsTask, 'id' | 'createdAt' | 'updatedAt' | 'labels'> & { labels?: string[] }): Promise<AgemsTask> {
        const task: AgemsTask = {
            id: `task-${crypto.randomUUID()}`,
            title: input.title.slice(0, 200),
            description: input.description?.slice(0, 2000),
            type: input.type,
            status: input.status ?? 'PENDING',
            priority: input.priority ?? 'MEDIUM',
            assigneeId: input.assigneeId,
            creatorId: input.creatorId,
            projectId: input.projectId,
            labels: input.labels ?? [],
            dueDate: input.dueDate,
            cronSchedule: input.cronSchedule,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await getDexieDb().agemsTasks.add(task as never);
        LOGGER.info('AgemsTask', 'created', { id: task.id, title: task.title });
        return task;
    }

    async list(filters?: { status?: AgemsTaskStatus; assigneeId?: string }): Promise<AgemsTask[]> {
        let col = getDexieDb().agemsTasks.toCollection();
        const all = (await col.toArray()) as unknown as AgemsTask[];
        let filtered = all;
        if (filters?.status) filtered = filtered.filter((t) => t.status === filters.status);
        if (filters?.assigneeId) filtered = filtered.filter((t) => t.assigneeId === filters.assigneeId);
        return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    async updateStatus(id: string, status: AgemsTaskStatus): Promise<AgemsTask | undefined> {
        await getDexieDb().agemsTasks.update(id, { status, updatedAt: Date.now() } as never);
        // 2.8 Triggers — fire after status change (lazy import to avoid cycle)
        try { const { taskTriggerService } = await import('./task-trigger-service'); await taskTriggerService.fire(id, status); } catch {}
        return (await getDexieDb().agemsTasks.get(id)) as unknown as AgemsTask | undefined;
    }

    async claimTask(taskId: string, workerId: string, ttlMs = 60000): Promise<boolean> {
        const task = (await getDexieDb().agemsTasks.get(taskId)) as unknown as AgemsTask | undefined;
        if (!task) return false;
        if (task.lockedBy && task.lockedUntil && task.lockedUntil > Date.now() && task.lockedBy !== workerId) return false;
        await getDexieDb().agemsTasks.update(taskId, { lockedBy: workerId, lockedUntil: Date.now() + ttlMs, updatedAt: Date.now() } as never);
        return true;
    }

    async releaseTask(taskId: string): Promise<void> {
        await getDexieDb().agemsTasks.update(taskId, { lockedBy: undefined, lockedUntil: undefined, updatedAt: Date.now() } as never);
    }

    async delete(id: string): Promise<void> {
        await getDexieDb().agemsTasks.delete(id);
    }
}

export const agemsTaskService = new AgemsTaskService();
