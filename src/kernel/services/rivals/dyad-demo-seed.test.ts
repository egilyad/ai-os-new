import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { RivalRepository } from '../../dal/rival-repository';
import { seedDyadDemo, DEMO_DYAD_GOAL } from './dyad-demo-seed';

describe('dyad-demo-seed', () => {
    let tdb: TestDb;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
    });

    it('seeds a completed dyad loop with transcript', async () => {
        const loop = await seedDyadDemo(new RivalRepository(tdb.db));
        expect(loop.goal).toBe(DEMO_DYAD_GOAL);
        expect(loop.kind).toBe('dyad');
        expect(loop.status).toBe('completed');
        expect(loop.log.length).toBeGreaterThanOrEqual(4);
        expect(loop.result).toContain('Done');
    });

    it('is idempotent: repeated calls reuse the loop', async () => {
        const repo = new RivalRepository(tdb.db);
        const first = await seedDyadDemo(repo);
        const second = await seedDyadDemo(repo);
        expect(second.id).toBe(first.id);
    });
});
