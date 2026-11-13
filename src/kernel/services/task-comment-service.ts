import { getDexieDb } from './database-service';
import type { TaskComment } from '../types/agems-task';

export class TaskCommentService {
    async add(
        taskId: string,
        authorType: string,
        authorId: string,
        content: string,
    ): Promise<TaskComment> {
        const comment: TaskComment = {
            taskId,
            authorType,
            authorId,
            content,
            createdAt: Date.now(),
        };
        const id = await getDexieDb().taskComments.add(comment as never);
        return { ...comment, id: id as number };
    }

    async list(taskId: string): Promise<TaskComment[]> {
        const rows = (await getDexieDb()
            .taskComments.where('taskId')
            .equals(taskId)
            .toArray()) as unknown as TaskComment[];
        return rows.sort((a, b) => a.createdAt - b.createdAt);
    }

    async remove(id: number): Promise<void> {
        await getDexieDb().taskComments.delete(id);
    }
}

export const taskCommentService = new TaskCommentService();
