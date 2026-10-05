import { AgemsTaskService, agemsTaskService } from './agems-task-service';
import type { AgemsTask } from '../types/agems-task';

/**
 * Demo seed for the Tasks panel: three AGEMS tasks in three kanban states,
 * assigned to three different agents.
 *
 * Idempotent: tasks carrying DEMO_TASK_LABEL are reused.
 */
export const DEMO_TASK_LABEL = 'демо';

export async function seedTasksDemo(
    service: AgemsTaskService = agemsTaskService,
): Promise<AgemsTask[]> {
    const existing = (await service.list()).filter((t) => t.labels.includes(DEMO_TASK_LABEL));
    if (existing.length > 0) return existing;

    const doneCreated = await service.create({
        title: 'Демо: собрать утренний дайджест',
        description: 'Собрать задачи дня из всех источников и разослать участникам.',
        type: 'ONE_TIME',
        status: 'PENDING',
        priority: 'HIGH',
        assigneeId: 'agent-risk',
        creatorId: 'local-user',
        labels: [DEMO_TASK_LABEL],
    });
    const done = (await service.updateStatus(doneCreated.id, 'COMPLETED')) ?? doneCreated;

    const runningCreated = await service.create({
        title: 'Демо: проверить риски релиза',
        description: 'Прогнать чек-лист рисков перед пятничным релизом.',
        type: 'ONE_TIME',
        status: 'PENDING',
        priority: 'MEDIUM',
        assigneeId: 'agent-architect',
        creatorId: 'local-user',
        labels: [DEMO_TASK_LABEL],
    });
    const running =
        (await service.updateStatus(runningCreated.id, 'IN_PROGRESS')) ?? runningCreated;

    const queued = await service.create({
        title: 'Демо: этическая экспертиза дайджеста',
        description: 'Убедиться, что дайджест не раскрывает лишнего и уважает тишину ночью.',
        type: 'ONE_TIME',
        status: 'PENDING',
        priority: 'MEDIUM',
        assigneeId: 'agent-ethics',
        creatorId: 'local-user',
        labels: [DEMO_TASK_LABEL],
    });

    return [done, running, queued];
}
