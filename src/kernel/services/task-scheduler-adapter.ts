import { agemsTaskService, AgemsTaskService } from './agems-task-service';
import type { AgemsTask, CronSchedule } from '../types/agems-task';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const HOUR_MS = 60 * 60 * 1000;

export function cronIntervalMs(schedule: CronSchedule): number {
    if (schedule.kind === 'preset') {
        switch (schedule.preset) {
            case 'HOURLY':
                return HOUR_MS;
            case 'DAILY':
                return DAY_MS;
            case 'WEEKDAY':
                return DAY_MS;
            case 'WEEKLY':
                return WEEK_MS;
            case 'MONTHLY':
                return MONTH_MS;
        }
    }
    // custom: minute/hour granularity — approximate by nearest hour
    return HOUR_MS;
}

export function isDue(schedule: CronSchedule, lastRunAt?: number, now = Date.now()): boolean {
    if (!lastRunAt) return true;
    return now - lastRunAt >= cronIntervalMs(schedule);
}

/**
 * M5.1 — spawns ONE_TIME instances for due RECURRING tasks.
 * Returns the list of created instances.
 */
export async function fireDueRecurring(
    service: AgemsTaskService = agemsTaskService,
    now = Date.now(),
): Promise<AgemsTask[]> {
    const tasks = await service.list();
    const recurring = tasks.filter((t) => t.type === 'RECURRING' && t.cronSchedule);
    const created: AgemsTask[] = [];
    for (const t of recurring) {
        if (!isDue(t.cronSchedule!, t.lastRunAt ?? t.updatedAt, now)) continue;
        const instance = await service.create({
            title: t.title,
            description: t.description,
            type: 'ONE_TIME',
            priority: t.priority,
            assigneeId: t.assigneeId,
            projectId: t.projectId,
            labels: t.labels,
            parentId: t.id,
        });
        created.push(instance);
        await service.repo.updateFields(t.id, { lastRunAt: now });
    }
    return created;
}
