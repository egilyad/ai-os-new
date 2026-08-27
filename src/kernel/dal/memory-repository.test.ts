import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRepository } from './memory-repository';
import { createTestDb, type TestDb } from './_test-harness';

describe('MemoryRepository', () => {
    let testDb: TestDb;
    let repo: MemoryRepository;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        repo = new MemoryRepository(testDb.db);
    });

    it('store persists an entry and returns a deterministic id', async () => {
        const entry = await repo.store({
            content: 'alpha',
            metadata: { source: 'fact', type: 'note', timestamp: 10, importance: 1 },
        });
        expect(entry.id).toBeTruthy();
        const fromDb = await testDb.db.memories.get(entry.id);
        expect(fromDb?.content).toBe('alpha');
        const got = await repo.get(entry.id);
        expect(got?.content).toBe('alpha');
    });

    it('getAll returns cached entries, newest first', async () => {
        await repo.store(fixtureInput('old', 100));
        await repo.store(fixtureInput('new', 200));
        const all = await repo.getAll();
        expect(all.map((e) => e.content)).toEqual(['new', 'old']);
    });

    it('upsert inserts when missing and merges when present', async () => {
        const created = await repo.store(fixtureInput('base', 100));
        // Same content+source+type => same deterministic id => merge path
        const merged = await repo.upsert({
            content: 'base',
            metadata: { source: 'fact', type: 'note', timestamp: 100, importance: 5 },
        });
        expect(merged.id).toBe(created.id);
        expect(merged.metadata.importance).toBe(5);
    });

    it('delete removes entry from db and cache', async () => {
        const { id } = await repo.store(fixtureInput('gone', 50));
        await repo.delete(id);
        expect(await repo.get(id)).toBeUndefined();
        expect(await testDb.db.memories.get(id)).toBeUndefined();
    });

    it('getCount reflects persisted count', async () => {
        await repo.store(fixtureInput('a', 1));
        await repo.store(fixtureInput('b', 2));
        expect(await repo.getCount()).toBe(2);
    });

    it('update partially modifies an entry', async () => {
        const { id } = await repo.store(fixtureInput('orig', 10));
        await repo.update(id, { content: 'changed' });
        const got = await repo.get(id);
        expect(got?.content).toBe('changed');
        expect(got?.metadata.timestamp).toBe(10);
    });

    it('storeBatch persists multiple entries atomically', async () => {
        const created = await repo.storeBatch([fixtureInput('x', 1), fixtureInput('y', 2)]);
        expect(created).toHaveLength(2);
        expect(await repo.getCount()).toBe(2);
    });

    it('search matches content substring with a limit', async () => {
        await repo.store(fixtureInput('hello world', 1));
        await repo.store(fixtureInput('hello there', 2));
        await repo.store(fixtureInput('craft beer', 3));
        const hits = await repo.search('hello', { limit: 10 });
        // Cache is (re)loaded from Dexie newest-first, so matches are in that order
        expect(hits.map((e) => e.content)).toEqual(['hello there', 'hello world']);
        const capped = await repo.search('hello', { limit: 1 });
        expect(capped).toHaveLength(1);
    });

    it('prune deletes entries older than the threshold', async () => {
        await repo.store(fixtureInput('old', 100));
        await repo.store(fixtureInput('new', 200));
        const removed = await repo.prune(150);
        expect(removed).toBe(1);
        expect((await repo.getAll()).map((e) => e.content)).toEqual(['new']);
    });

    it('clear wipes all memories', async () => {
        await repo.store(fixtureInput('a', 1));
        await repo.clear();
        expect(await repo.getCount()).toBe(0);
        expect(await repo.getAll()).toHaveLength(0);
    });
});

function fixtureInput(content: string, timestamp: number) {
    return {
        content,
        metadata: { source: 'fact' as const, type: 'note', timestamp, importance: 1 },
    };
}
