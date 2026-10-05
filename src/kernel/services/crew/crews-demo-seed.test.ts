import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { CrewRepository } from '../../dal/crew-repository';
import { CrewService } from './crew-service';
import { seedCrewsDemo, DEMO_CREW_NAME } from './crews-demo-seed';
import type { IEventBus } from '../../types/interfaces';

describe('crews-demo-seed', () => {
    let tdb: TestDb;
    let service: CrewService;

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
        service = new CrewService({ repository: new CrewRepository(tdb.db), eventBus });
    });

    it('seeds a crew with three roles and two tasks', async () => {
        const crew = await seedCrewsDemo(service);
        expect(crew.name).toBe(DEMO_CREW_NAME);
        expect(crew.roles).toHaveLength(3);
        expect(crew.taskIds).toHaveLength(2);
        const agentIds = new Set(crew.roles.map((r) => r.agentId));
        expect(agentIds.size).toBe(3);
    });

    it('is idempotent: repeated calls reuse the crew', async () => {
        const first = await seedCrewsDemo(service);
        const second = await seedCrewsDemo(service);
        expect(second.id).toBe(first.id);
        expect(await service.listCrews()).toHaveLength(1);
    });
});
