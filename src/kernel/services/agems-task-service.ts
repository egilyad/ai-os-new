import { getDexieDb } from './database-service';
import type { AgemsTask, AgemsTaskStatus } from '../types/agems-task';
import { rootLogger } from './logger-service';
import { canTransition, TaskIllegalTransitionError } from './task-state-machine';
import { TaskRepository } from '../dal/task-repository';

export interface AgemsTaskServiceDeps {
    repository?: TaskRepository;
    emit?: (event: string, payload: Record<string, unknown>) => void;
}

const LOGGER = rootLogger.child('AgemsTask');

export class AgemsTaskService {
    private readonly repo: TaskRepository;
    private readonly emit: (event: string, payload: Record<string, unknown>) => void;

    constructor(deps?: AgemsTaskServiceDeps) {
        this.repo = deps?.repository ?? new TaskRepository(getDexieDb() as never);
        this.emit = deps?.emit ?? (() => undefined);
    }

    async create(
        input: Omit<AgemsTask, 'id' | 'createdAt' | 'updatedAt' | 'labels'> & { labels?: string[] },
    ): Promise<AgemsTask> {
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
        await this.repo.create(task);
        LOGGER.info('AgemsTask', 'created', { id: task.id, title: task.title });
        this.emit('task:created', {
            taskId: task.id,
            title: task.title,
            creatorId: task.creatorId,
            assigneeId: task.assigneeId,
            projectId: task.projectId,
        });
        return task;
    }

    async list(filters?: { status?: AgemsTaskStatus; assigneeId?: string }): Promise<AgemsTask[]> {
        return this.repo.list(filters);
    }

    async updateStatus(id: string, status: AgemsTaskStatus): Promise<AgemsTask | undefined> {
        const existing = await this.repo.get(id);
        if (!existing) return undefined;
        if (!canTransition(existing.status, status))
            throw new TaskIllegalTransitionError(existing.status, status);
        const updated = await this.repo.updateStatus(id, status);
        this.emit('task:status:changed', {
            taskId: id,
            from: existing.status,
            to: status,
        });
        // 2.8 Triggers — fire after status change (lazy import to avoid cycle)
        try {
            const { taskTriggerService } = await import('./task-trigger-service');
            await taskTriggerService.fire(id, status);
        } catch {
            /* trigger optional */
        }
        return updated;
    }

    async claimTask(taskId: string, workerId: string, ttlMs = 60000): Promise<boolean> {
        const ok = await this.repo.claim(taskId, workerId, ttlMs);
        if (ok) this.emit('task:claimed', { taskId, workerId, ttlMs });
        return ok;
    }

    async releaseTask(taskId: string): Promise<void> {
        await this.repo.release(taskId);
        this.emit('task:released', { taskId, workerId: 'unknown' });
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
        this.emit('task:deleted', { taskId: id });
    }
}

export const agemsTaskService = new AgemsTaskService();
