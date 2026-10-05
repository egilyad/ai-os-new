import type { IFederationService } from '../../contracts/interop';
import type { FederationPeer } from '../../types/interop-types';

/**
 * Demo seed for Fleet Interop: one loopback peer (offline-first, no
 * transport needed) advertising digest capabilities.
 *
 * Idempotent: peers named DEMO_PEER_NAME are reused.
 */
export const DEMO_PEER_NAME = 'Демо-стенд';

export async function seedInteropDemo(
    service: Pick<IFederationService, 'addPeer' | 'listPeers'>,
): Promise<FederationPeer> {
    const existing = (await service.listPeers()).find((p) => p.name === DEMO_PEER_NAME);
    if (existing) return existing;
    return service.addPeer({
        name: DEMO_PEER_NAME,
        baseUrl: 'local',
        trust: 'known',
        capabilities: ['дайджест', 'напоминания'],
    });
}
