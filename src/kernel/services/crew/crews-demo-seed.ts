import type { ICrewService } from '../../contracts/crew';
import type { Crew } from '../../contracts/crew';

/**
 * Demo seed for Fleet Crews: one crew with three roles and two tasks.
 * Task execution stays offline (deterministic echo executor).
 *
 * Idempotent: crews named DEMO_CREW_NAME are reused.
 */
export const DEMO_CREW_NAME = 'Демо: утренняя газета';

export async function seedCrewsDemo(
    service: Pick<ICrewService, 'createCrew' | 'listCrews'>,
): Promise<Crew> {
    const existing = (await service.listCrews()).find((c) => c.name === DEMO_CREW_NAME);
    if (existing) return existing;
    return service.createCrew({
        name: DEMO_CREW_NAME,
        description: 'Демо-экипаж: каждое утро собирает дайджест из задач дня.',
        process: 'sequential',
        roles: [
            {
                name: 'Редактор',
                role: 'Editor',
                goal: 'Собрать задачи дня в короткий дайджест',
                backstory: 'Демо-роль редактора утренней газеты.',
                agentId: 'agent-architect',
            },
            {
                name: 'Корректор',
                role: 'Proofreader',
                goal: 'Проверить риски и убрать спам',
                backstory: 'Демо-роль корректора.',
                agentId: 'agent-risk',
            },
            {
                name: 'Цензор вежливости',
                role: 'ToneChecker',
                goal: 'Проследить за тоном и тихими часами',
                backstory: 'Демо-роль хранителя вежливости.',
                agentId: 'agent-ethics',
            },
        ],
        tasks: [
            {
                description: 'Собрать задачи дня из всех источников',
                expectedOutput: 'Список из 3–5 пунктов с ответственными',
                assigneeId: 'agent-architect',
            },
            {
                description: 'Проверить дайджест на риски и спам',
                expectedOutput: 'Список правок или пометка «чисто»',
                assigneeId: 'agent-risk',
            },
        ],
    });
}
