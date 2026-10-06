import { ScenarioRepository } from '../dal/scenario-repository';
import { getDexieDb } from './database-service';
import type { DatabaseService } from './database-service';
import type { ConversationScenario } from '../contracts/conversation/scenario';

/**
 * Demo seed for the Conversation Director library: one scripted scenario
 * (three turns across three agents) ready to load into the run tab.
 *
 * Idempotent: scenarios named DEMO_SCENARIO_NAME are reused.
 */
export const DEMO_SCENARIO_NAME = 'Демо: планёрка по боту-напоминалке';

export async function seedDirectorDemo(repository?: ScenarioRepository): Promise<ConversationScenario> {
    const repo =
        repository ??
        new ScenarioRepository(getDexieDb() as unknown as DatabaseService);
    const existing = (await repo.list()).find((s) => s.name === DEMO_SCENARIO_NAME);
    if (existing) return existing;
    return repo.create({
        name: DEMO_SCENARIO_NAME,
        description: 'Демо-сценарий: три агента обсуждают план второго спринта.',
        topic: 'План второго спринта бота-напоминалки',
        participants: [
            { id: 'agent-architect', role: 'developer' },
            { id: 'agent-risk', role: 'researcher' },
            { id: 'agent-ethics', role: 'reviewer' },
        ],
        turns: [
            {
                participantId: 'agent-architect',
                objective: {
                    type: 'INTRODUCE',
                    description: 'Маркус открывает: каркас готов, предлагает план спринта.',
                    constraints: ['говорить кратко', 'без жаргона'],
                },
            },
            {
                participantId: 'agent-risk',
                objective: {
                    type: 'CRITIQUE',
                    description: 'Рафаэль указывает на риски плана: спам и часовые пояса.',
                    constraints: ['опереться на цифры'],
                },
            },
            {
                participantId: 'agent-ethics',
                objective: {
                    type: 'SUMMARIZE',
                    description: 'Элена подводит итог и фиксирует договорённости.',
                    constraints: ['зафиксировать ответственных'],
                },
            },
        ],
    });
}
