import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { CouncilRepository } from '../../dal/council-repository';
import { CouncilService } from './council-service';
import { seedCouncilDemo, DEMO_COUNCIL_TOPIC } from './council-demo-seed';
import type { IEventBus } from '../../types/interfaces';

describe('council-demo-seed', () => {
    let tdb: TestDb;
    let service: CouncilService;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        const events = { emit: () => {} } as unknown as IEventBus;
        service = new CouncilService({
            repository: new CouncilRepository(tdb.db),
            eventBus: events,
        });
    });

    it('seeds a session with three messages and a fact', async () => {
        const session = await seedCouncilDemo(service);
        expect(session.topic).toBe(DEMO_COUNCIL_TOPIC);
        expect(session.participants).toHaveLength(3);
        expect(session.messages).toHaveLength(3);
        const authors = new Set(session.messages.map((m) => m.authorId));
        expect(authors.size).toBe(3);
        expect(session.facts).toHaveLength(1);
    });

    it('is idempotent: repeated calls reuse the session', async () => {
        const first = await seedCouncilDemo(service);
        const second = await seedCouncilDemo(service);
        expect(second.id).toBe(first.id);
        expect(second.messages).toHaveLength(3);
    });
});
