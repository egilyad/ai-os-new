import { getDexieDb } from './database-service';
import type { Label, TaskLabel } from '../types/agems-task';

export class TaskLabelService {
    async createLabel(name: string, color: string): Promise<Label> {
        const id = await getDexieDb().labels.add({ name, color } as never);
        return { id: id as number, name, color };
    }

    async assign(taskId: string, labelId: number): Promise<void> {
        const existing = (await getDexieDb()
            .taskLabels.where('taskId')
            .equals(taskId)
            .toArray()) as unknown as TaskLabel[];
        if (existing.some((l) => l.labelId === labelId)) return;
        await getDexieDb().taskLabels.add({ taskId, labelId } as never);
    }

    async unassign(taskId: string, labelId: number): Promise<void> {
        const existing = (await getDexieDb()
            .taskLabels.where('taskId')
            .equals(taskId)
            .toArray()) as unknown as TaskLabel[];
        const match = existing.find((l) => l.labelId === labelId);
        if (match?.id !== undefined) await getDexieDb().taskLabels.delete(match.id);
    }

    async listForTask(taskId: string): Promise<Label[]> {
        const links = (await getDexieDb()
            .taskLabels.where('taskId')
            .equals(taskId)
            .toArray()) as unknown as TaskLabel[];
        const labelIds = links.map((l) => l.labelId);
        if (labelIds.length === 0) return [];
        const labels = (await getDexieDb().labels.toArray()) as unknown as Label[];
        const byId = new Map(labels.map((l) => [l.id, l]));
        return labelIds.map((id) => byId.get(id)).filter((l): l is Label => Boolean(l));
    }
}

export const taskLabelService = new TaskLabelService();
