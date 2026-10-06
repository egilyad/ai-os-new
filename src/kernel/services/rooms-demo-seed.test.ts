import { createTestDb, type TestDb } from '../dal/_test-harness';
import { InvocationRepository } from './invocation/invocation-repository';
import { seedRoomsDemo, DEMO_INVOCATION_REASON } from './rooms-demo-seed';
import type { IDatabaseService } from '../types/interfaces';

describe('rooms-demo-seed', () => {
    let tdb: TestDb;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
    });

    it('seeds a completed room invocation', async () => {
        const inv = await seedRoomsDemo(
            new InvocationRepository(tdb.db as unknown as IDatabaseService),
        );
        expect(inv.reason).toBe(DEMO_INVOCATION_REASON);
        expect(inv.status).toBe('done');
        expect(inv.resolvedAgents.map((a) => a.id)).toEqual(['agent-risk']);
    });

    it('is idempotent: repeated calls reuse the invocation', async () => {
        const repo = new InvocationRepository(tdb.db as unknown as IDatabaseService);
        const first = await seedRoomsDemo(repo);
        const second = await seedRoomsDemo(repo);
        expect(second.id).toBe(first.id);
        expect(await repo.list()).toHaveLength(1);
    });
});
