import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { JunctionRepository } from '../../dal/junction-repository';
import { seedJunctionDemo, DEMO_JUNCTION_PREFIX } from './junction-demo-seed';

describe('junction-demo-seed', () => {
    let tdb: TestDb;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
    });

    it('seeds one validated junction linking crystal and forum', async () => {
        const junction = await seedJunctionDemo(new JunctionRepository(tdb.db));
        expect(junction.content.startsWith(DEMO_JUNCTION_PREFIX)).toBe(true);
        expect(junction.status).toBe('validated');
        expect(junction.inputs).toHaveLength(2);
        expect(junction.inputs.map((i) => i.kind).sort()).toEqual(['crystal', 'forum']);
    });

    it('is idempotent: repeated calls reuse the junction', async () => {
        const repo = new JunctionRepository(tdb.db);
        const first = await seedJunctionDemo(repo);
        const second = await seedJunctionDemo(repo);
        expect(second.id).toBe(first.id);
        expect(await repo.list()).toHaveLength(1);
    });
});
