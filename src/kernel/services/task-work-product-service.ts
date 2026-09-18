import { getDexieDb } from './dexie-schema';
import type { TaskWorkProduct } from '../types/agems-task';

export const taskWorkProductService = {
    async add(taskId: string, fileName: string, opts?: { filePath?: string; mimeType?: string; size?: number }): Promise<TaskWorkProduct> {
        const rec: TaskWorkProduct = { taskId, fileName, filePath: opts?.filePath, mimeType: opts?.mimeType, size: opts?.size, createdAt: Date.now() };
        const id = await getDexieDb().taskWorkProducts.add(rec as never);
        rec.id = id as number;
        return rec;
    },
    list(taskId: string) { return getDexieDb().taskWorkProducts.where('taskId').equals(taskId).toArray() as Promise<TaskWorkProduct[]>; },
    remove(id: number) { return getDexieDb().taskWorkProducts.delete(id); },
};
