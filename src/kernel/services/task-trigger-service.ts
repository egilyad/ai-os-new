import { getDexieDb } from './dexie-schema';
import type { TaskTrigger, AgemsTaskStatus } from '../types/agems-task';

export const taskTriggerService = {
    async add(taskId: string, onStatus: AgemsTaskStatus, action: string, target?: string): Promise<TaskTrigger> {
        const rec: TaskTrigger = { taskId, onStatus, action, target, enabled: true, createdAt: Date.now() };
        const id = await getDexieDb().taskTriggers.add(rec as never);
        rec.id = id as number;
        return rec;
    },
    list(taskId: string) { return getDexieDb().taskTriggers.where('taskId').equals(taskId).toArray() as Promise<TaskTrigger[]>; },
    async fire(taskId: string, newStatus: AgemsTaskStatus) {
        const triggers = await getDexieDb().taskTriggers.where({ taskId, onStatus: newStatus } as never).toArray() as unknown as TaskTrigger[];
        for (const t of triggers.filter(x => x.enabled)) {
            // minimal: log; in prod dispatch action target
            console.log(`[Trigger] ${taskId} ${newStatus} -> ${t.action} ${t.target ?? ''}`);
        }
        return triggers;
    },
    toggle(id: number, enabled: boolean) { return getDexieDb().taskTriggers.update(id, { enabled } as never); },
    remove(id: number) { return getDexieDb().taskTriggers.delete(id); },
};
