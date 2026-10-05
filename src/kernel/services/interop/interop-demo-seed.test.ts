import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { InteropRepository } from '../../dal/interop-repository';
import { FederationService } from './federation-service';
import { seedInteropDemo, DEMO_PEER_NAME } from './interop-demo-seed';
import type { IEventBus } from '../../types/interfaces';

describe('interop-demo-seed', () => {
    let tdb: TestDb;
    let service: FederationService;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        const eventBus = {
            emit: () => {},
            on: () => () => undefined,
            onSafe: () => () => undefined,
            off: () => undefined,
            emitOnce: () => true,
            subscribeAll: () => () => undefined,
        } as unknown as IEventBus;
        service = new FederationService(new InteropRepository(tdb.db), eventBus);
    });

    it('seeds a known loopback peer', async () => {
        const peer = await seedInteropDemo(service);
        expect(peer.name).toBe(DEMO_PEER_NAME);
        expect(peer.baseUrl).toBe('local');
        expect(peer.trust).toBe('known');
        expect(peer.capabilities.length).toBeGreaterThan(0);
    });

    it('is idempotent: repeated calls reuse the peer', async () => {
        const first = await seedInteropDemo(service);
        const second = await seedInteropDemo(service);
        expect(second.id).toBe(first.id);
        expect(await service.listPeers()).toHaveLength(1);
    });
});
