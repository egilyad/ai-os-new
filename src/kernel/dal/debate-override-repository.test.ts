import { beforeEach, describe, expect, it } from 'vitest';
import type { DebateOverride } from '../contracts/session-manager';
import { DebateOverrideRepository } from './debate-override-repository';
import { createTestDb, type TestDb } from './_test-harness';

function override(id: string, sessionId: string, appliedAt: number): DebateOverride {
    return { id, sessionId, type: 'strategy', payload: '{}', appliedAt };
}

describe('DebateOverrideRepository', () => {
    let testDb: TestDb;
    let repo: DebateOverrideRepository;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        repo = new DebateOverrideRepository(testDb.db);
    });

    it('getBySessionId returns overrides sorted by appliedAt', async () => {
        await repo.put(override('o2', 's1', 2));
        await repo.put(override('o1', 's1', 1));
        const overrides = await repo.getBySessionId('s1');
        expect(overrides.map((o) => o.id)).toEqual(['o1', 'o2']);
    });

    it('deleteBySessionId removes only that session overrides', async () => {
        await repo.put(override('o1', 's1', 1));
        await repo.put(override('o2', 's2', 1));
        await repo.deleteBySessionId('s1');
        expect(await repo.getBySessionId('s1')).toHaveLength(0);
        expect(await repo.getBySessionId('s2')).toHaveLength(1);
    });

    it('clear wipes all overrides', async () => {
        await repo.put(override('o1', 's1', 1));
        await repo.clear();
        expect(await testDb.db.debateOverrides.count()).toBe(0);
    });
});
