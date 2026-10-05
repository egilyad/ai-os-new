import type { ICrystalVaultService } from '../../contracts/knowledge-crystal';
import type { Crystal, CrystalId } from '../../types/crystal-types';

/**
 * Demo seed for the Crystal Vault: one semi-crystal about notification
 * quiet hours, contributed by the three demo agents.
 *
 * Idempotent: crystals whose statement starts with DEMO_CRYSTAL_PREFIX are reused.
 */
export const DEMO_CRYSTAL_PREFIX = 'Демо: ';

export async function seedCrystalsDemo(
    service: Pick<ICrystalVaultService, 'propose' | 'list'>,
): Promise<Crystal[]> {
    const existing = (await service.list()).filter((c) =>
        c.content.statement.startsWith(DEMO_CRYSTAL_PREFIX),
    );
    if (existing.length > 0) return existing;

    const id: CrystalId = await service.propose({
        content: {
            statement: 'Демо: тихие часы 23:00–7:00 снижают отток от уведомлений.',
            elaboration:
                'Ночной спам — главная причина отключения уведомлений. Прорыв — только звонок человека.',
            assumptions: ['Часовые пояса пользователей известны', 'Срочное определяется списком прорывных событий'],
        },
        originKind: 'human',
        originId: 'demo-seed',
        contributingAgents: ['agent-architect', 'agent-risk', 'agent-ethics'],
        applicableDomain: 'general',
    });
    const created = (await service.list()).filter((c) => c.crystalId === id);
    return created;
}
