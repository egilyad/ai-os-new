import { beforeEach, describe, expect, it } from 'vitest';
import type { SessionLink } from '../contracts/session-manager';
import { SessionLinkRepository } from './session-link-repository';
import { createTestDb, type TestDb } from './_test-harness';

function link(id: string, fromId: string, toId: string): SessionLink {
    return {
        id,
        fromId,
        toId,
        linkType: 'continuation',
        context: 'ctx',
        createdAt: 1,
    };
}

describe('SessionLinkRepository', () => {
    let testDb: TestDb;
    let repo: SessionLinkRepository;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        repo = new SessionLinkRepository(testDb.db);
    });

    it('put persists a link and queries by fromId and toId', async () => {
        await repo.put(link('l1', 'a', 'b'));
        expect((await repo.getByFromId('a')).map((l) => l.id)).toEqual(['l1']);
        expect((await repo.getByToId('b')).map((l) => l.id)).toEqual(['l1']);
        expect((await repo.getByEitherId('a')).map((l) => l.id)).toEqual(['l1']);
    });

    it('getByEitherId unions from + to matches', async () => {
        await repo.put(link('l1', 'a', 'b'));
        await repo.put(link('l2', 'c', 'a'));
        const matches = await repo.getByEitherId('a');
        expect(matches.map((l) => l.id).sort()).toEqual(['l1', 'l2']);
    });

    it('deleteByFromId / deleteByToId remove matching links', async () => {
        await repo.put(link('l1', 'a', 'b'));
        await repo.put(link('l2', 'c', 'b'));
        await repo.deleteByFromId('a');
        expect(await repo.getByFromId('a')).toHaveLength(0);
        await repo.deleteByToId('b');
        expect(await repo.getByToId('b')).toHaveLength(0);
    });

    it('deleteByEitherId removes links pointing either direction', async () => {
        await repo.put(link('l1', 'a', 'b'));
        await repo.put(link('l2', 'c', 'a'));
        await repo.deleteByEitherId('a');
        expect(await testDb.db.sessionLinks.count()).toBe(0);
    });

    it('clear wipes all links', async () => {
        await repo.put(link('l1', 'a', 'b'));
        await repo.clear();
        expect(await testDb.db.sessionLinks.count()).toBe(0);
    });
});
