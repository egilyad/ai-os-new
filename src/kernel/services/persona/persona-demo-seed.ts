import type { ISharedContextService } from '../../contracts/persona';
import type { SharedContext, Goal } from '../../types/persona-types';

/**
 * Demo seed for the Fleet Persona tab (shared contexts + goals): one room
 * context with the three demo agents and one team goal.
 *
 * Idempotent: contexts/goals named DEMO_* are reused.
 */
export const DEMO_CONTEXT_NAME = 'Демо: кают-компания';
export const DEMO_GOAL_TITLE = 'Демо: запустить бота-напоминалку';

export async function seedPersonaDemo(
    service: Pick<ISharedContextService, 'createContext' | 'listContexts' | 'createGoal' | 'listGoals'>,
): Promise<{ context: SharedContext; goal: Goal }> {
    let context = (await service.listContexts()).find((c) => c.name === DEMO_CONTEXT_NAME);
    if (!context) {
        context = await service.createContext({
            name: DEMO_CONTEXT_NAME,
            scope: { kind: 'room', ref: 'fleet' },
            memberIds: ['agent-architect', 'agent-risk', 'agent-ethics'],
        });
    }
    let goal = (await service.listGoals()).find((g) => g.title === DEMO_GOAL_TITLE);
    if (!goal) {
        goal = await service.createGoal({
            ownerId: 'local-user',
            title: DEMO_GOAL_TITLE,
            level: 'team',
            description: 'Собрать, проверить и запустить бота-напоминалку за неделю.',
            contextId: context.id,
        });
    }
    return { context, goal };
}
