import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { RivalRepository } from '../../dal/rival-repository';
import { seedRunQueueDemo, DEMO_QUEUE_REF } from './runqueue-demo-seed';

describe('runqueue-demo-seed', () => {
    let tdb: TestDb;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
    });

    it('seeds a queued crew item', async () => {
        const item = await seedRunQueueDemo(new RivalRepository(tdb.db));
        expect(item.refId).toBe(DEMO_QUEUE_REF);
        expect(item.kind).toBe('crew');
        expect(item.status).toBe('queued');
    });

    it('is idempotent: repeated calls reuse the item', async () => {
        const repo = new RivalRepository(tdb.db);
        const first = await seedRunQueueDemo(repo);
        const second = await seedRunQueueDemo(repo);
        expect(second.id).toBe(first.id);
        expect(await repo.listQueued()).toHaveLength(1);
    });
});
