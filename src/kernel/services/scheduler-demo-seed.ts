import { SchedulerService } from './scheduler-service';
import type { Schedule } from './scheduler-service';

/**
 * Demo seed for the Scheduler panel: two schedules (daily digest + weekly
 * report) owned by two different agents.
 *
 * Idempotent: schedules whose name starts with DEMO_SCHEDULE_PREFIX are reused.
 */
export const DEMO_SCHEDULE_PREFIX = 'Демо: ';

export async function seedSchedulerDemo(service: SchedulerService): Promise<Schedule[]> {
    const existing = service
        .getAll()
        .filter((s) => s.name.startsWith(DEMO_SCHEDULE_PREFIX));
    if (existing.length > 0) return existing;

    const digest = await service.create({
        name: 'Демо: утренний дайджест',
        agentId: 'agent-risk',
        agentName: 'Rafael Stone',
        frequency: 'daily',
        taskParams: {
            prompt: 'Собери задачи дня и разошли участникам. Без спама.',
            priority: 'normal',
        },
    });

    const report = await service.create({
        name: 'Демо: пятничный отчёт',
        agentId: 'agent-architect',
        agentName: 'Marcus Hale',
        frequency: 'weekly',
        taskParams: {
            prompt: 'Подведи итоги недели: что построено, что в работе, что заблокировано.',
            priority: 'normal',
        },
    });

    return [digest, report];
}
