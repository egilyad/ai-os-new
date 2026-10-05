import { JunctionRepository } from '../../dal/junction-repository';
import type { Junction } from '../../types/junction-types';
import { getDexieDb } from '../database-service';
import type { DatabaseService } from '../database-service';
import { genId } from '../../../utils/gen-id';

/**
 * Demo seed for the Junction Engine: one validated junction linking the
 * demo crystal (quiet hours) with the demo forum thread (agent veto).
 * Written straight to the repository — detection heuristics are data
 * dependent, while the demo must be deterministic.
 *
 * Idempotent: junctions whose content starts with DEMO_JUNCTION_PREFIX are reused.
 */
export const DEMO_JUNCTION_PREFIX = 'Демо: ';

export async function seedJunctionDemo(repository?: JunctionRepository): Promise<Junction> {
    const repo =
        repository ??
        new JunctionRepository(getDexieDb() as unknown as DatabaseService);
    const existing = (await repo.list()).find((j) =>
        j.content.startsWith(DEMO_JUNCTION_PREFIX),
    );
    if (existing) return existing;

    const now = Date.now();
    const junction: Junction = {
        id: genId('junction'),
        inputs: [
            {
                kind: 'crystal',
                id: 'crystal://demo-quiet-hours',
                label: 'Тихие часы 23:00–7:00',
                domain: 'general',
                statement: 'Демо: тихие часы 23:00–7:00 снижают отток от уведомлений.',
            },
            {
                kind: 'forum',
                id: 'forum://demo-veto',
                label: 'Право вето агентов',
                domain: 'general',
                statement: 'Демо: вето агентов работает только с журналом причин и кнопкой отмены.',
            },
        ],
        synthesisType: 'structural_analogy',
        confidence: 0.8,
        content:
            'Демо: и вето, и тихие часы — один паттерн «ограничитель с апелляцией»: запрет по умолчанию плюс явный путь обхода.',
        status: 'validated',
        cognitiveDebt: 'Демо: проверить на реальных данных удержания.',
        rationale: 'Демо: обе практики ограничивают действие агента, оставляя человеку понятный выход.',
        agentRole: 'bridge-builder',
        createdAt: now,
        validatedAt: now,
    };
    await repo.put(junction);
    return junction;
}
