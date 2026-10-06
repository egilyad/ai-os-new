import type { RivalRepository } from '../../dal/rival-repository';
import { RivalRepository as RivalRepositoryImpl } from '../../dal/rival-repository';
import { getDexieDb } from '../database-service';
import type { DatabaseService } from '../database-service';
import type { AgentLoop } from '../../types/rival-types';
import { genId } from '../../../utils/gen-id';

/**
 * Demo seed for Autonomy: one completed goal loop with a readable log
 * (written directly — no LLM run needed).
 *
 * Idempotent: loops with DEMO_AUTONOMY_GOAL are reused.
 */
export const DEMO_AUTONOMY_GOAL = 'Демо: навести порядок в напоминаниях';

export async function seedAutonomyDemo(repository?: RivalRepository): Promise<AgentLoop> {
    const repo =
        repository ?? new RivalRepositoryImpl(getDexieDb() as unknown as DatabaseService);
    const existing = (await repo.listLoops()).find((l) => l.goal === DEMO_AUTONOMY_GOAL);
    if (existing) return existing;
    const now = Date.now();
    const loop: AgentLoop = {
        id: genId('loop'),
        kind: 'autonomy',
        goal: DEMO_AUTONOMY_GOAL,
        status: 'completed',
        iterations: 3,
        maxIterations: 8,
        taskList: [
            { id: 't1', text: 'Составить список напоминаний', status: 'done' },
            { id: 't2', text: 'Убрать ночной спам', status: 'done' },
            { id: 't3', text: 'Включить тихие часы', status: 'done' },
        ],
        log: [
            'План: 3 задачи.',
            'Выполнено: список напоминаний.',
            'Выполнено: ночной спам убран.',
            'Выполнено: тихие часы включены.',
        ],
        result: 'Порядок наведён: 3/3 задачи.',
        createdAt: now - 60000,
        updatedAt: now,
    };
    await repo.putLoop(loop);
    return loop;
}
