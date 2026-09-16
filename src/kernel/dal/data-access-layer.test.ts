import { beforeEach, describe, expect, it } from 'vitest';
import { DataAccessLayerImpl } from './data-access-layer';
import { createTestDb, type TestDb } from './_test-harness';

describe('DataAccessLayerImpl', () => {
    let testDb: TestDb;
    let dal: DataAccessLayerImpl;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        dal = new DataAccessLayerImpl(testDb.db);
    });

    it('exposes all domain repositories', () => {
        expect(dal.memory).toBeDefined();
        expect(dal.session).toBeDefined();
        expect(dal.notes).toBeDefined();
        expect(dal.roles).toBeDefined();
        expect(dal.debate).toBeDefined();
        expect(dal.trace).toBeDefined();
        expect(dal.cognitive).toBeDefined();
        expect(dal.eventLog).toBeDefined();
        expect(dal.workspace).toBeDefined();
        expect(dal.kv).toBeDefined();
    });

    describe('kv repository', () => {
        it('set/get round-trips a value', async () => {
            await dal.kv.set('x', { a: 1 });
            expect(await dal.kv.get<{ a: number }>('x')).toEqual({ a: 1 });
        });

        it('get returns null for missing key', async () => {
            expect(await dal.kv.get('missing')).toBeNull();
        });

        it('delete removes a key', async () => {
            await dal.kv.set('x', 1);
            await dal.kv.delete('x');
            expect(await dal.kv.get('x')).toBeNull();
        });

        it('list returns entries, optionally filtered by prefix', async () => {
            await dal.kv.set('app:a', 1);
            await dal.kv.set('app:b', 2);
            await dal.kv.set('other:c', 3);
            const all = await dal.kv.list();
            expect(all).toHaveLength(3);
            const prefixed = await dal.kv.list('app:');
            expect(prefixed.map((e) => e.id).sort()).toEqual(['app:a', 'app:b']);
        });

        it('clear wipes all keys', async () => {
            await dal.kv.set('x', 1);
            await dal.kv.clear();
            expect(await dal.kv.list()).toHaveLength(0);
        });
    });

    describe('workspace via kv', () => {
        it('persists and reads a handle through the dal kv', async () => {
            const handle = { name: 'ws' } as FileSystemDirectoryHandle;
            await dal.workspace.saveHandle(handle);
            expect(await dal.workspace.getHandle()).toEqual(handle);
            await dal.workspace.deleteHandle();
            expect(await dal.workspace.getHandle()).toBeNull();
        });
    });
});
