import type { RivalRepository } from '../../dal/rival-repository';
import { RivalRepository as RivalRepositoryImpl } from '../../dal/rival-repository';
import { getDexieDb } from '../database-service';
import type { DatabaseService } from '../database-service';
import type { AgentLoop } from '../../types/rival-types';
import { genId } from '../../../utils/gen-id';

/**
 * Demo seed for Dyad: one completed user↔assistant loop with a readable
 * transcript (written directly — no LLM turns needed).
 *
 * Idempotent: loops with DEMO_DYAD_GOAL are reused.
 */
export const DEMO_DYAD_GOAL = 'Демо: согласовать тихие часы';

export async function seedDyadDemo(repository?: RivalRepository): Promise<AgentLoop> {
    const repo =
        repository ?? new RivalRepositoryImpl(getDexieDb() as unknown as DatabaseService);
    const existing = (await repo.listLoops()).find((l) => l.goal === DEMO_DYAD_GOAL);
    if (existing) return existing;
    const now = Date.now();
    const loop: AgentLoop = {
        id: genId('loop'),
        kind: 'dyad',
        goal: DEMO_DYAD_GOAL,
        status: 'completed',
        iterations: 2,
        maxIterations: 10,
        taskList: [],
        log: [
            'Dyad on "Демо: согласовать тихие часы": AI User ↔ AI Assistant',
            '[AI Assistant]: Предлагаю тихие часы 23:00–7:00, прорыв — звонком человека.',
            '[AI User]: Согласен, но добавь список прорывных событий.',
            '[AI Assistant]: Готово: звонок человека + авария продакшена. <TASK_DONE>',
        ],
        result: 'Done in 2 turns.',
        createdAt: now - 60000,
        updatedAt: now,
    };
    await repo.putLoop(loop);
    return loop;
}
