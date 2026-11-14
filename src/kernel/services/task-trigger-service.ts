import { getDexieDb } from './database-service';
import type { TaskTrigger, AgemsTaskStatus } from '../types/agems-task';
import { eventBus } from '../events/event-bus';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('TaskTrigger');

export const taskTriggerService = {
    async add(
        taskId: string,
        onStatus: AgemsTaskStatus,
        action: string,
        target?: string,
    ): Promise<TaskTrigger> {
        const rec: TaskTrigger = {
            taskId,
            onStatus,
            action,
            target,
            enabled: true,
            createdAt: Date.now(),
        };
        const id = await getDexieDb().taskTriggers.add(rec as never);
        rec.id = id as number;
        return rec;
    },
    list(taskId: string) {
        return getDexieDb().taskTriggers.where('taskId').equals(taskId).toArray() as Promise<
            TaskTrigger[]
        >;
    },
    async fire(taskId: string, newStatus: AgemsTaskStatus): Promise<TaskTrigger[]> {
        const triggers = await getDexieDb()
            .taskTriggers.where('taskId')
            .equals(taskId)
            .and((t) => t.onStatus === newStatus)
            .toArray();
        for (const t of triggers.filter((x) => x.enabled)) {
            await dispatchTrigger(t, taskId, newStatus);
        }
        return triggers;
    },
    toggle(id: number, enabled: boolean) {
        return getDexieDb().taskTriggers.update(id, { enabled } as never);
    },
    remove(id: number) {
        return getDexieDb().taskTriggers.delete(id);
    },
};

async function dispatchTrigger(
    t: TaskTrigger,
    taskId: string,
    status: AgemsTaskStatus,
): Promise<void> {
    const action = t.action || '';
    try {
        if (action.startsWith('agent:')) {
            // M5.2 — agent dispatch via handoff protocol
            const { TaskHandoffService } = await import('./task-handoff');
            const handoff = new TaskHandoffService({
                eventBus: { emit: (e, d) => eventBus.emit(e as never, d as never) },
                database: getDexieDb() as never,
                getLifecycleState: () => 'active',
            });
            const toAgent = (action.slice('agent:'.length) || t.target || '').trim();
            await handoff.handoff({
                fromAgent: 'system',
                toAgent,
                description: `task ${taskId} -> ${status}`,
                context: `task:${taskId} status:${status}`,
            });
        } else if (action.startsWith('http:')) {
            const url = (t.target || action.slice('http:'.length)).trim();
            if (url.startsWith('http')) {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskId, status }),
                });
                if (!res.ok)
                    LOGGER.warn('TaskTrigger', 'http dispatch failed', { url, status: res.status });
            }
        } else if (action === 'notify' || action === 'notification') {
            LOGGER.info('TaskTrigger', 'notify', { taskId, status });
        } else {
            LOGGER.info('TaskTrigger', 'dispatch', { taskId, status, action, target: t.target });
        }
        eventBus.emit(EVENTS.TASK_TRIGGER_FIRED, { taskId, status, action, target: t.target });
    } catch (e) {
        LOGGER.warn('TaskTrigger', 'dispatch failed', { taskId, action, error: e });
    }
}
