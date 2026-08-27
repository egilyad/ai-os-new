import { beforeEach, describe, expect, it } from 'vitest';
import type { KeyNote } from '../types/metrics-types';
import { NoteRepository } from './note-repository';
import { createTestDb, type TestDb } from './_test-harness';

function note(id: string, keyId: string, timestamp: number): KeyNote {
    return { id, keyId, type: 'ai', text: `note-${id}`, timestamp };
}

describe('NoteRepository', () => {
    let testDb: TestDb;
    let repo: NoteRepository;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        repo = new NoteRepository(testDb.db);
    });

    it('save/get round-trips a note', async () => {
        await repo.save(note('n1', 'k1', 1));
        expect((await repo.get('n1'))?.keyId).toBe('k1');
    });

    it('listByKey filters and sorts descending by timestamp', async () => {
        await repo.save(note('a', 'k1', 100));
        await repo.save(note('b', 'k1', 200));
        await repo.save(note('c', 'k2', 300));
        const forK1 = await repo.listByKey('k1');
        expect(forK1.map((n) => n.id)).toEqual(['b', 'a']);
    });

    it('deleteByKeyId removes all notes for a key and returns count', async () => {
        await repo.save(note('a', 'k1', 1));
        await repo.save(note('b', 'k1', 2));
        const removed = await repo.deleteByKeyId('k1');
        expect(removed).toBe(2);
        expect(await repo.listByKey('k1')).toHaveLength(0);
        expect(await testDb.db.notes.count()).toBe(0);
    });

    it('delete removes a single note', async () => {
        await repo.save(note('a', 'k1', 1));
        await repo.delete('a');
        expect(await repo.get('a')).toBeUndefined();
    });
});
