import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { PersonaRepository } from '../../dal/persona-repository';
import { SharedContextService } from './shared-context-service';
import { seedPersonaDemo, DEMO_CONTEXT_NAME, DEMO_GOAL_TITLE } from './persona-demo-seed';
import type { IEventBus } from '../../types/interfaces';

describe('persona-demo-seed', () => {
    let tdb: TestDb;
    let service: SharedContextService;

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
        service = new SharedContextService(new PersonaRepository(tdb.db), eventBus);
    });

    it('seeds a room context with three members and a goal', async () => {
        const { context, goal } = await seedPersonaDemo(service);
        expect(context.name).toBe(DEMO_CONTEXT_NAME);
        expect(context.memberIds).toHaveLength(3);
        expect(goal.title).toBe(DEMO_GOAL_TITLE);
        expect(goal.status).toBe('active');
    });

    it('is idempotent: repeated calls reuse context and goal', async () => {
        const first = await seedPersonaDemo(service);
        const second = await seedPersonaDemo(service);
        expect(second.context.id).toBe(first.context.id);
        expect(second.goal.id).toBe(first.goal.id);
    });
});
