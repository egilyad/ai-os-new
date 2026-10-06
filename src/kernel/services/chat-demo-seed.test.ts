import { createTestDb, type TestDb } from '../dal/_test-harness';
import { createDexieStorage, resetDexieStorage } from './storage/dexie-storage';
import { seedChatDemo, DEMO_CHAT_ID, DEMO_CHAT_TITLE } from './chat-demo-seed';

describe('chat-demo-seed', () => {
    let tdb: TestDb;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        resetDexieStorage();
    });

    it('seeds a completed user/assistant exchange', async () => {
        const store = createDexieStorage().sessions;
        const id = await seedChatDemo(store);
        expect(id).toBe(DEMO_CHAT_ID);

        const session = await store.getSession(id);
        expect(session?.title).toBe(DEMO_CHAT_TITLE);
        expect(session?.history).toHaveLength(4);
        expect(session?.history.map((e) => e.role)).toEqual([
            'user',
            'assistant',
            'user',
            'assistant',
        ]);
        const firstReply = session?.history[1]?.responses[0];
        expect(firstReply?.status).toBe('done');
        expect(firstReply?.content).toContain('журналом');
    });

    it('is idempotent: repeated calls reuse the session', async () => {
        const store = createDexieStorage().sessions;
        const first = await seedChatDemo(store);
        const second = await seedChatDemo(store);
        expect(second).toBe(first);
        expect((await store.getSession(first))?.history).toHaveLength(4);
    });
});
