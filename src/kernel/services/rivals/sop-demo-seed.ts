import type { ISopService } from '../../contracts/rivals';
import type { SopDefinition } from '../../types/rival-types';

/**
 * Demo seed for SOPs: a three-phase morning-digest procedure owned by the
 * three demo agents.
 *
 * NOTE: SOP definitions are in-memory only (lost on reload); the seed
 * re-creates the demo SOP per session. Idempotent within a session: SOPs
 * named DEMO_SOP_NAME are reused.
 */
export const DEMO_SOP_NAME = 'Демо: утренний дайджест';

export async function seedSopDemo(
    service: Pick<ISopService, 'defineSop' | 'listSops'>,
): Promise<SopDefinition> {
    const existing = (await service.listSops()).find((s) => s.name === DEMO_SOP_NAME);
    if (existing) return existing;
    return service.defineSop(DEMO_SOP_NAME, [
        {
            name: 'Сбор',
            role: 'Architect',
            artifact: 'task-list',
            instruction: 'Собери задачи дня из всех источников в один список.',
        },
        {
            name: 'Риски',
            role: 'RiskAnalyst',
            artifact: 'risk-notes',
            instruction: 'Отметь задачи с риском срыва и предложи смягчение.',
        },
        {
            name: 'Вежливость',
            role: 'EthicsOfficer',
            artifact: 'digest',
            instruction: 'Сожми итог в 3–5 пунктов, проверь тон и тихие часы.',
        },
    ]);
}
