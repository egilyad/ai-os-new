import { getDexieDb, type DatabaseService } from '../services/database-service';
import type { AgemsTask, AgemsTaskStatus } from '../types/agems-task';

export interface TaskFilters {
    status?: AgemsTaskStatus;
    assigneeId?: string;
    projectId?: string;
}

/**
 * TaskRepository — DAL wrapper for AGEMS task persistence.
 * ЗАКОН 1/2: domain-операции идут через repository, не напрямую в Dexie.
 */
export class TaskRepository {
    constructor(private db: DatabaseService) {}

    async create(task: AgemsTask): Promise<AgemsTask> {
        await this.db.agemsTasks.add(task as never);
        return task;
    }

    async get(id: string): Promise<AgemsTask | undefined> {
        return (await this.db.agemsTasks.get(id)) as unknown as AgemsTask | undefined;
    }

    async list(filters?: TaskFilters): Promise<AgemsTask[]> {
        let all: AgemsTask[];
        if (filters?.status) {
            all = (await this.db.agemsTasks
                .where('status')
                .equals(filters.status)
                .toArray()) as unknown as AgemsTask[];
        } else {
            all = (await this.db.agemsTasks.toCollection().toArray()) as unknown as AgemsTask[];
        }
        if (filters?.assigneeId) all = all.filter((t) => t.assigneeId === filters.assigneeId);
        if (filters?.projectId) all = all.filter((t) => t.projectId === filters.projectId);
        return all.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    async updateStatus(id: string, status: AgemsTaskStatus): Promise<AgemsTask | undefined> {
        await this.db.agemsTasks.update(id, { status, updatedAt: Date.now() } as never);
        return this.get(id);
    }

    async updateFields(id: string, patch: Partial<AgemsTask>): Promise<AgemsTask | undefined> {
        await this.db.agemsTasks.update(id, { ...patch, updatedAt: Date.now() } as never);
        return this.get(id);
    }

    async claim(id: string, workerId: string, ttlMs: number): Promise<boolean> {
        const db = getDexieDb();
        return db.transaction('rw!', db.agemsTasks, async () => {
            const task = (await db.agemsTasks.get(id)) as unknown as AgemsTask | undefined;
            if (!task) return false;
            const now = Date.now();
            const lockedByOther =
                task.lockedBy &&
                task.lockedUntil &&
                task.lockedUntil > now &&
                task.lockedBy !== workerId;
            if (lockedByOther) return false;
            await db.agemsTasks.update(id, {
                lockedBy: workerId,
                lockedUntil: now + ttlMs,
                updatedAt: now,
            } as never);
            return true;
        });
    }

    async release(id: string): Promise<void> {
        await this.db.agemsTasks.update(id, {
            lockedBy: undefined,
            lockedUntil: undefined,
            updatedAt: Date.now(),
        } as never);
    }

    async delete(id: string): Promise<void> {
        await this.db.agemsTasks.delete(id);
    }
}
