import { beforeEach, describe, expect, it } from 'vitest';
import type { RecordedEvent } from '../services/event-sourcing/event-recorder';
import { EventLogRepository } from './event-log-repository';
import { createTestDb, type TestDb } from './_test-harness';

function ev(sequence: number): RecordedEvent {
    return {
        sequence,
        event: 'test.event',
        data: { seq: sequence },
        timestamp: 100,
        checksum: `c-${sequence}`,
    };
}

describe('EventLogRepository', () => {
    let testDb: TestDb;
    let repo: EventLogRepository;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        repo = new EventLogRepository(testDb.db, 5);
    });

    it('load returns empty when no events persisted', async () => {
        const loaded = await repo.load();
        expect(loaded).toEqual({ events: [], sequence: 0 });
    });

    it('save persists new events and load recovers them', async () => {
        const snapshot = { events: [ev(0), ev(1), ev(2)], sequence: 3 };
        await repo.save(snapshot);

        const loaded = await repo.load();
        expect(loaded?.events).toHaveLength(3);
        expect(loaded?.sequence).toBe(3);
        expect(loaded?.events.map((e) => e.sequence)).toEqual([0, 1, 2]);
    });

    it('save only inserts events after lastPersistedSeq (idempotent replay)', async () => {
        await repo.save({ events: [ev(0), ev(1)], sequence: 2 });
        // Replay the same snapshot — already-persisted sequences are skipped.
        await repo.save({ events: [ev(0), ev(1)], sequence: 2 });
        expect(await testDb.db.eventLog.count()).toBe(2);
    });

    it('capped by maxEvents keeps the newest events', async () => {
        await repo.save({ events: [ev(0), ev(1), ev(2)], sequence: 3 });
        await repo.save({ events: [ev(3), ev(4), ev(5)], sequence: 6 });
        const all = await testDb.db.eventLog.orderBy('sequence').toArray();
        expect(all).toHaveLength(5);
        expect(all.map((r) => r.sequence)).toEqual([1, 2, 3, 4, 5]);
    });

    it('clearAll empties the log and resets persistence', async () => {
        await repo.save({ events: [ev(0)], sequence: 1 });
        await repo.clearAll();
        const loaded = await repo.load();
        expect(loaded).toEqual({ events: [], sequence: 0 });
    });
});
