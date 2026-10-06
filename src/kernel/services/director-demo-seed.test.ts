import { createTestDb, type TestDb } from '../dal/_test-harness';
import { ScenarioRepository } from '../dal/scenario-repository';
import { seedDirectorDemo, DEMO_SCENARIO_NAME } from './director-demo-seed';

describe('director-demo-seed', () => {
    let tdb: TestDb;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
    });

    it('seeds a scripted scenario with three turns', async () => {
        const scenario = await seedDirectorDemo(new ScenarioRepository(tdb.db));
        expect(scenario.name).toBe(DEMO_SCENARIO_NAME);
        expect(scenario.participants).toHaveLength(3);
        expect(scenario.turns).toHaveLength(3);
        expect(scenario.status).toBe('draft');
    });

    it('is idempotent: repeated calls reuse the scenario', async () => {
        const repo = new ScenarioRepository(tdb.db);
        const first = await seedDirectorDemo(repo);
        const second = await seedDirectorDemo(repo);
        expect(second.id).toBe(first.id);
        expect(await repo.list()).toHaveLength(1);
    });
});
