import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { RivalRepository } from '../../dal/rival-repository';
import { seedAutonomyDemo, DEMO_AUTONOMY_GOAL } from './autonomy-demo-seed';

describe('autonomy-demo-seed', () => {
    let tdb: TestDb;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
    });

    it('seeds a completed autonomy loop with done tasks', async () => {
        const loop = await seedAutonomyDemo(new RivalRepository(tdb.db));
        expect(loop.goal).toBe(DEMO_AUTONOMY_GOAL);
        expect(loop.kind).toBe('autonomy');
        expect(loop.status).toBe('completed');
        expect(loop.taskList.filter((t) => t.status === 'done')).toHaveLength(3);
    });

    it('is idempotent: repeated calls reuse the loop', async () => {
        const repo = new RivalRepository(tdb.db);
        const first = await seedAutonomyDemo(repo);
        const second = await seedAutonomyDemo(repo);
        expect(second.id).toBe(first.id);
    });
});
