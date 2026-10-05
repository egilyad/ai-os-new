import { createTestDb, type TestDb } from '../dal/_test-harness';
import { createDexieStorage, resetDexieStorage } from './storage/dexie-storage';
import { ChatBookmarksService } from './chat-bookmarks-service';
import { seedBookmarksDemo, DEMO_BOOKMARK_NOTE } from './bookmarks-demo-seed';
import type { IEventBus } from '../types/interfaces';
import type { IDatabaseService } from '../types/interfaces';

describe('bookmarks-demo-seed', () => {
    let tdb: TestDb;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        resetDexieStorage();
    });

    function makeService() {
        const events: string[] = [];
        const eventBus = {
            emit: (name: string) => {
                events.push(name);
            },
            on: () => () => undefined,
        } as unknown as IEventBus;
        return new ChatBookmarksService({
            eventBus,
            database: tdb.db as unknown as IDatabaseService,
        });
    }

    it('bookmarks the demo chat assistant reply', async () => {
        const service = makeService();
        await service.init();
        const sessions = createDexieStorage().sessions;
        const bookmark = await seedBookmarksDemo(service, sessions);
        expect(bookmark.note).toBe(DEMO_BOOKMARK_NOTE);
        expect(bookmark.role).toBe('assistant');
        expect(bookmark.content).toContain('журналом');
        expect(bookmark.tags).toContain('демо');
    });

    it('is idempotent: repeated calls reuse the bookmark', async () => {
        const service = makeService();
        await service.init();
        const sessions = createDexieStorage().sessions;
        const first = await seedBookmarksDemo(service, sessions);
        const second = await seedBookmarksDemo(service, sessions);
        expect(second.id).toBe(first.id);
    });
});
