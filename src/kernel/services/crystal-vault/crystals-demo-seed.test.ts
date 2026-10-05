import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { CrystalRepository } from '../../dal/crystal-repository';
import { CrystalVaultService } from './crystal-vault-service';
import { seedCrystalsDemo, DEMO_CRYSTAL_PREFIX } from './crystals-demo-seed';
import type { IEventBus } from '../../types/interfaces';

describe('crystals-demo-seed', () => {
    let tdb: TestDb;
    let service: CrystalVaultService;

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
        service = new CrystalVaultService({
            repository: new CrystalRepository(tdb.db),
            eventBus,
        });
        await service.init();
    });

    it('seeds one semi-crystal from three agents', async () => {
        const crystals = await seedCrystalsDemo(service);
        expect(crystals).toHaveLength(1);
        const c = crystals[0]!;
        expect(c.content.statement.startsWith(DEMO_CRYSTAL_PREFIX)).toBe(true);
        expect(c.status).toBe('semi');
        expect(c.provenance.contributingAgents).toHaveLength(3);
    });

    it('is idempotent: repeated calls reuse the crystal', async () => {
        const first = await seedCrystalsDemo(service);
        const second = await seedCrystalsDemo(service);
        expect(second.map((c) => c.crystalId)).toEqual(first.map((c) => c.crystalId));
    });
});
