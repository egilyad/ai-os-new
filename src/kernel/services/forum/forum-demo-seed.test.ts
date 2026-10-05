import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { ForumRepository } from '../../dal/forum-repository';
import { ForumService } from './forum-service';
import { seedForumDemo, DEMO_TOPIC_TAG } from './forum-demo-seed';
import type { IEventBus } from '../../types/interfaces';
import type { ForumService as ForumServiceType } from './forum-service';

describe('forum-demo-seed', () => {
    let tdb: TestDb;
    let service: ForumServiceType;

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
        service = new ForumService({ repository: new ForumRepository(tdb.db), eventBus });
        await service.init();
    });

    it('seeds one thread with three distinct agent replies', async () => {
        const topicId = await seedForumDemo(service);
        const thread = await service.getThread(topicId);
        expect(thread).not.toBeNull();
        expect(thread!.topic.tags).toContain(DEMO_TOPIC_TAG);
        expect(thread!.posts).toHaveLength(4);

        const agentPosts = thread!.posts.filter((p) => p.author.kind === 'agent');
        expect(agentPosts).toHaveLength(3);
        const agentIds = new Set(agentPosts.map((p) => p.author.id));
        expect(agentIds.size).toBe(3);

        // One reply is threaded under another.
        const threaded = thread!.posts.filter((p) => p.parentId);
        expect(threaded).toHaveLength(1);

        // Votes landed: architect answer has score 2.
        const architect = agentPosts.find((p) => p.author.id === 'agent-architect')!;
        expect(architect.score).toBe(2);
    });

    it('is idempotent: repeated calls reuse the topic', async () => {
        const first = await seedForumDemo(service);
        const second = await seedForumDemo(service);
        expect(second).toBe(first);
        const thread = await service.getThread(first);
        expect(thread!.posts).toHaveLength(4);
    });
});
