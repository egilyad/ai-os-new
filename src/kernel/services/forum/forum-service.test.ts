import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { ForumRepository } from '../../dal/forum-repository';
import { ForumService } from './forum-service';
import type { IEventBus } from '../../types/interfaces';
import type { ForumAuthor } from '../../types/forum-types';

const human: ForumAuthor = { kind: 'human', id: 'user-1', displayName: 'Алиса' };
const human2: ForumAuthor = { kind: 'human', id: 'user-2', displayName: 'Боб' };
const agent: ForumAuthor = {
    kind: 'agent',
    id: 'agent-1',
    roleId: 'arch',
    displayName: 'Архитектор',
};

describe('ForumRepository', () => {
    let tdb: TestDb;
    let repo: ForumRepository;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        repo = new ForumRepository(tdb.db);
    });

    it('round-trips a topic and filters listTopics', async () => {
        await repo.putTopic({
            id: 't-1',
            title: 'Architecture',
            category: 'arch',
            author: human,
            tags: ['design'],
            pinned: false,
            status: 'open',
            score: 0,
            postCount: 0,
            createdAt: 1,
            lastActivityAt: 1,
        });
        await repo.putTopic({
            id: 't-2',
            title: 'LLM',
            category: 'llm',
            author: agent,
            tags: ['models'],
            pinned: true,
            status: 'open',
            score: 0,
            postCount: 0,
            createdAt: 2,
            lastActivityAt: 2,
        });
        expect((await repo.getTopic('t-1'))?.title).toBe('Architecture');
        expect(await repo.listTopics({ category: 'llm' })).toHaveLength(1);
        expect(await repo.listTopics({ authorId: 'user-1' })).toHaveLength(1);
        expect(await repo.listTopics({ tag: 'design' })).toHaveLength(1);
    });

    it('lists posts for a topic with sincePostId', async () => {
        for (const i of [1, 2, 3]) {
            await repo.putPost({
                id: `p-${i}`,
                topicId: 't-1',
                author: human,
                body: `body ${i}`,
                renderedHtml: `body ${i}`,
                createdAt: i,
                score: 0,
                votes: [],
                moderation: { status: 'normal', action: 'none' },
            });
        }
        const all = await repo.listPosts('t-1');
        expect(all).toHaveLength(3);
        const since = await repo.listPosts('t-1', { sincePostId: 'p-2' });
        expect(since.map((r) => r.id)).toEqual(['p-3']);
    });

    it('keeps votes and subs unique by composite key', async () => {
        await repo.putVote({
            id: 'p-1:user-1',
            postId: 'p-1',
            voterId: 'user-1',
            vote: 'up',
            createdAt: 1,
        });
        expect((await repo.getVote('p-1', 'user-1'))?.vote).toBe('up');
        await repo.deleteVote('p-1', 'user-1');
        expect(await repo.getVote('p-1', 'user-1')).toBeUndefined();

        await repo.putSub({
            id: 't-1:user-1',
            topicId: 't-1',
            subscriberId: 'user-1',
            createdAt: 1,
        });
        expect((await repo.getSub('t-1', 'user-1'))?.subscriberId).toBe('user-1');
        expect(await repo.listSubs('t-1')).toHaveLength(1);
    });
});

describe('ForumService', () => {
    let tdb: TestDb;
    let service: ForumService;
    const events: string[] = [];

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        events.length = 0;
        const eventBus = {
            emit: (name: string) => {
                events.push(name);
            },
            on: () => () => undefined,
            onSafe: () => () => undefined,
            off: () => undefined,
            emitOnce: () => true,
            subscribeAll: () => () => undefined,
        } as unknown as IEventBus;
        service = new ForumService({ repository: new ForumRepository(tdb.db), eventBus });
        await service.init();
    });

    it('creates a topic and emits event; opening post when body given', async () => {
        const topicId = await service.createTopic({
            title: 'Как улучшить маршрутизацию?',
            category: 'llm',
            author: human,
            tags: ['routing'],
            body: 'Открывающий пост',
        });
        expect(topicId.startsWith('topic-')).toBe(true);
        expect(events).toContain('forum:topic:created');
        expect(events).toContain('forum:post:added');

        const thread = await service.getThread(topicId);
        expect(thread!.topic.title).toBe('Как улучшить маршрутизацию?');
        expect(thread!.posts).toHaveLength(1);
        expect(thread!.posts[0]!.body).toBe('Открывающий пост');
        expect(thread!.topic.postCount).toBe(1);
    });

    it('rejects an empty topic title', async () => {
        await expect(
            service.createTopic({ title: '   ', category: 'general', author: human }),
        ).rejects.toThrow();
    });

    it('posts messages with rendered html and agent provenance', async () => {
        const topicId = await service.createTopic({
            title: 'T',
            category: 'general',
            author: human,
        });
        const postId = await service.postMessage(topicId, agent, 'Агент пишет **жирным** и `код`');
        const thread = await service.getThread(topicId);
        const post = thread!.posts[0]!;
        expect(post.id).toBe(postId);
        expect(post.renderedHtml).toContain('<strong>жирным</strong>');
        expect(post.renderedHtml).toContain('<code>код</code>');
        expect(post.agentProvenance).toBeDefined();
        expect(post.agentProvenance!.roleId).toBe('arch');
        expect(post.agentProvenance!.tokensCost).toBeGreaterThan(0);
    });

    it('rejects posting to unknown or closed topics and empty bodies', async () => {
        const topicId = await service.createTopic({
            title: 'T',
            category: 'general',
            author: human,
        });
        await service.pinTopic(topicId, true);
        // close via moderation is not in contract; use archived status via repository
        await tdb.db.forumTopics.update(topicId, { status: 'archived' });
        await expect(service.postMessage(topicId, human, 'x')).rejects.toThrow(/archived/);
        await expect(service.postMessage('nope', human, 'x')).rejects.toThrow(/not found/);
        await expect(service.postMessage(topicId, human, '   ')).rejects.toThrow(/required/);
    });

    it('votes up then down flip the score; same vote is idempotent', async () => {
        const topicId = await service.createTopic({
            title: 'T',
            category: 'general',
            author: human,
        });
        const postId = await service.postMessage(topicId, human, 'Пост');
        await service.votePost(postId, human2, 'up');
        let thread = await service.getThread(topicId);
        expect(thread!.posts[0]!.score).toBe(1);
        await service.votePost(postId, human2, 'up');
        thread = await service.getThread(topicId);
        expect(thread!.posts[0]!.score).toBe(1);

        await service.votePost(postId, human2, 'down');
        thread = await service.getThread(topicId);
        expect(thread!.posts[0]!.score).toBe(-1);
        expect(thread!.topic.score).toBe(-1);
        expect(events).toContain('forum:post:voted');
    });

    it('subscribe is idempotent and rejects unknown topics', async () => {
        const topicId = await service.createTopic({
            title: 'T',
            category: 'general',
            author: human,
        });
        await service.subscribe(topicId, agent);
        await service.subscribe(topicId, agent);
        expect((await tdb.db.forumSubs.toArray()).length).toBe(1);
        await expect(service.subscribe('nope', agent)).rejects.toThrow(/not found/);
    });

    it('listTopics paginates and filters', async () => {
        for (let i = 0; i < 5; i++) {
            await service.createTopic({ title: `T${i}`, category: 'general', author: human });
        }
        const page = await service.listTopics({ category: 'general', page: 0, pageSize: 2 });
        expect(page.total).toBe(5);
        expect(page.items).toHaveLength(2);
        const page2 = await service.listTopics({ category: 'general', page: 1, pageSize: 2 });
        expect(page2.items).toHaveLength(2);
    });

    it('getThread returns null for unknown topic and supports sincePostId', async () => {
        expect(await service.getThread('nope')).toBeNull();
        const topicId = await service.createTopic({
            title: 'T',
            category: 'general',
            author: human,
        });
        const p1 = await service.postMessage(topicId, human, 'first');
        await service.postMessage(topicId, human, 'second');
        const thread = await service.getThread(topicId, { sincePostId: p1 });
        expect(thread!.posts).toHaveLength(1);
        expect(thread!.posts[0]!.body).toBe('second');
    });

    it('pins and moderates posts', async () => {
        const topicId = await service.createTopic({
            title: 'T',
            category: 'general',
            author: human,
        });
        const postId = await service.postMessage(topicId, human, 'спам');
        await service.pinTopic(topicId, true);
        expect((await service.listTopics({})).items[0]!.pinned).toBe(true);

        await service.moderatePost(postId, 'hide', 'спам');
        let thread = await service.getThread(topicId);
        expect(thread!.posts[0]!.moderation.status).toBe('hidden');

        await service.moderatePost(postId, 'remove', 'дубликат');
        thread = await service.getThread(topicId);
        expect(thread!.posts).toHaveLength(0);
    });

    it('getConsensus reports open / consensus / contested', async () => {
        const openId = await service.createTopic({
            title: 'Open',
            category: 'general',
            author: human,
        });
        await service.postMessage(openId, human, '1');
        await service.postMessage(openId, human, '2');
        const open = await service.getConsensus(openId);
        expect(open!.status).toBe('open');

        const consensusId = await service.createTopic({
            title: 'Consensus',
            category: 'general',
            author: human,
        });
        const cp1 = await service.postMessage(consensusId, human, 'a');
        const cp2 = await service.postMessage(consensusId, human, 'b');
        const cp3 = await service.postMessage(consensusId, human2, 'c');
        await service.votePost(cp1, human2, 'up');
        await service.votePost(cp2, human2, 'up');
        await service.votePost(cp3, human2, 'up');
        const cons = await service.getConsensus(consensusId);
        expect(cons!.status).toBe('consensus');

        const contestedId = await service.createTopic({
            title: 'Contested',
            category: 'general',
            author: human,
        });
        for (let i = 0; i < 5; i++) {
            const author = i % 2 === 0 ? human : human2;
            await service.postMessage(contestedId, author, `post ${i}`);
        }
        const contested = await service.getConsensus(contestedId);
        expect(contested!.status).toBe('contested');
    });

    it('does not escalate a contested thread to a debate', async () => {
        const topicId = await service.createTopic({
            title: 'Hot',
            category: 'general',
            author: human,
        });
        for (let i = 0; i < 6; i++) {
            const author = i % 2 === 0 ? human : human2;
            await service.postMessage(topicId, author, `post ${i}`);
        }
        expect(events).not.toContain('forum:topic:escalated-to-debate');
    });

    it('enforces flood budget per author', async () => {
        const topicId = await service.createTopic({
            title: 'Flood',
            category: 'general',
            author: human,
        });
        for (let i = 0; i < 10; i++) {
            await service.postMessage(topicId, human, `post ${i}`);
        }
        await expect(service.postMessage(topicId, human, 'overflow')).rejects.toThrow(
            /flood budget/,
        );
    });
});
