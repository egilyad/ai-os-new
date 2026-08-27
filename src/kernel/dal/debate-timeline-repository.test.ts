import { beforeEach, describe, expect, it } from 'vitest';
import type { DebateTimelineEntry } from '../contracts/session-manager';
import { DebateTimelineRepository } from './debate-timeline-repository';
import { createTestDb, type TestDb } from './_test-harness';

function entry(id: string, sessionId: string, timestamp: number): DebateTimelineEntry {
    return { id, sessionId, timestamp, type: 'argument', payload: '{}' };
}

describe('DebateTimelineRepository', () => {
    let testDb: TestDb;
    let repo: DebateTimelineRepository;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        repo = new DebateTimelineRepository(testDb.db);
    });

    it('getBySessionId returns entries sorted by timestamp', async () => {
        await repo.put(entry('e2', 's1', 2));
        await repo.put(entry('e1', 's1', 1));
        await repo.put(entry('other', 's2', 1));
        const entries = await repo.getBySessionId('s1');
        expect(entries.map((e) => e.id)).toEqual(['e1', 'e2']);
    });

    it('deleteBySessionId removes only that session entries', async () => {
        await repo.put(entry('e1', 's1', 1));
        await repo.put(entry('e2', 's2', 1));
        await repo.deleteBySessionId('s1');
        expect(await repo.getBySessionId('s1')).toHaveLength(0);
        expect(await repo.getBySessionId('s2')).toHaveLength(1);
    });

    it('clear wipes all entries', async () => {
        await repo.put(entry('e1', 's1', 1));
        await repo.clear();
        expect(await testDb.db.debateTimeline.count()).toBe(0);
    });
});
