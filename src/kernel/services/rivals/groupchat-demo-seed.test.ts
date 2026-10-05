import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { RivalRepository } from '../../dal/rival-repository';
import { GroupChatService } from './groupchat-service';
import { seedGroupChatDemo, DEMO_GROUPCHAT_NAME } from './groupchat-demo-seed';
import type { IEventBus } from '../../types/interfaces';

describe('groupchat-demo-seed', () => {
    let tdb: TestDb;
    let service: GroupChatService;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        const events = { emit: () => {} } as unknown as IEventBus;
        service = new GroupChatService(new RivalRepository(tdb.db), events);
    });

    it('seeds a running chat with one turn per member', async () => {
        const chat = await seedGroupChatDemo(service);
        expect(chat.name).toBe(DEMO_GROUPCHAT_NAME);
        expect(chat.members).toHaveLength(3);
        expect(chat.turns).toHaveLength(3);
        const speakers = new Set(chat.turns.map((t) => t.speaker));
        expect(speakers.size).toBe(3);
        expect(chat.status).toBe('running');
    });

    it('is idempotent: repeated calls reuse the chat', async () => {
        const first = await seedGroupChatDemo(service);
        const second = await seedGroupChatDemo(service);
        expect(second.id).toBe(first.id);
        expect(second.turns).toHaveLength(3);
    });
});
