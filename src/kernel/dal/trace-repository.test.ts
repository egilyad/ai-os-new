import { beforeEach, describe, expect, it } from 'vitest';
import type { ExecutionTrace } from '../contracts/observability';
import { TraceRepository } from './trace-repository';
import { createTestDb, type TestDb } from './_test-harness';

function trace(id: string, startTime: number): ExecutionTrace {
    return { id, startTime, input: `input-${id}`, status: 'completed', steps: [] };
}

describe('TraceRepository', () => {
    let testDb: TestDb;
    let repo: TraceRepository;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        repo = new TraceRepository(testDb.db);
    });

    it('save persists a trace and get returns it', async () => {
        await repo.save(trace('t1', 100));
        expect((await repo.get('t1'))?.status).toBe('completed');
    });

    it('getAll returns newest first, capped by limit', async () => {
        await repo.save(trace('a', 1));
        await repo.save(trace('b', 2));
        await repo.save(trace('c', 3));
        const all = await repo.getAll();
        expect(all.map((t) => t.id)).toEqual(['c', 'b', 'a']);
        const capped = await repo.getAll(2);
        expect(capped.map((t) => t.id)).toEqual(['c', 'b']);
    });

    it('listRecent delegates to getAll', async () => {
        await repo.save(trace('a', 1));
        await repo.save(trace('b', 2));
        expect((await repo.listRecent()).map((t) => t.id)).toEqual(['b', 'a']);
    });

    it('delete removes a trace', async () => {
        await repo.save(trace('x', 1));
        await repo.delete('x');
        expect(await repo.get('x')).toBeUndefined();
    });

    it('clear wipes all traces', async () => {
        await repo.save(trace('a', 1));
        await repo.clear();
        expect(await testDb.db.traces.count()).toBe(0);
    });
});
