import { beforeEach, describe, expect, it } from 'vitest';
import type { ChatSession } from '../contracts/storage/session-store';
import { SessionRepository } from './session-repository';
import { createTestDb, type TestDb } from './_test-harness';

function session(id: string, updatedAt: number): ChatSession {
    return { id, title: `session-${id}`, history: [], createdAt: updatedAt, updatedAt };
}

describe('SessionRepository', () => {
    let testDb: TestDb;
    let repo: SessionRepository;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        repo = new SessionRepository(testDb.db);
    });

    it('save persists a session and get returns it', async () => {
        await repo.save(session('s1', 100));
        const got = await repo.get('s1');
        expect(got?.title).toBe('session-s1');
        const fromDb = await testDb.db.sessions.get('s1');
        expect(fromDb?.id).toBe('s1');
    });

    it('getAll returns all saved sessions', async () => {
        await repo.save(session('a', 1));
        await repo.save(session('b', 2));
        expect((await repo.getAll()).map((s) => s.id).sort()).toEqual(['a', 'b']);
    });

    it('listRecent returns most recently updated, capped by limit', async () => {
        await repo.save(session('old', 1));
        await repo.save(session('mid', 2));
        await repo.save(session('new', 3));
        const recent = await repo.listRecent(2);
        expect(recent.map((s) => s.id)).toEqual(['new', 'mid']);
    });

    it('delete removes a session from db and cache', async () => {
        await repo.save(session('x', 1));
        await repo.delete('x');
        expect(await repo.get('x')).toBeUndefined();
        expect(await testDb.db.sessions.get('x')).toBeUndefined();
    });

    it('clearCache forces re-read from Dexie', async () => {
        await repo.save(session('cached', 5));
        expect((await repo.get('cached'))?.id).toBe('cached');
        await testDb.db.sessions.put(session('external', 6));
        repo.clearCache();
        expect(await repo.get('external')).toBeDefined();
    });
});
