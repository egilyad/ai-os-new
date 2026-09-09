import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDb } from './_test-harness';
import { DirectorRepository } from './director-repository';
import type { ConversationSession, SessionStatus } from '../contracts/conversation/session';

const makeSession = (
    id: string,
    scenarioId = 'sc1',
    status: SessionStatus = 'completed',
): ConversationSession => ({
    id,
    scenarioId,
    scenarioName: `Scenario ${scenarioId}`,
    status,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    events: [],
    checkpoints: [],
    results: [],
    currentParticipantId: null,
    currentTurnIndex: null,
    plannedTotal: 2,
    plannedDone: 2,
    injectedDone: 0,
    failed: 0,
});

describe('DirectorRepository', () => {
    let tdb: TestDb;
    let repo: DirectorRepository;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        repo = new DirectorRepository(tdb.db);
    });

    it('creates and retrieves a session', async () => {
        await repo.put(makeSession('run-1'));
        const got = await repo.get('run-1');
        expect(got?.id).toBe('run-1');
        expect(got?.scenarioId).toBe('sc1');
    });

    it('lists and filters by scenarioId', async () => {
        await repo.put(makeSession('a', 'sc1'));
        await repo.put(makeSession('b', 'sc2'));
        await repo.put(makeSession('c', 'sc1'));
        const sc1 = await repo.list({ scenarioId: 'sc1' });
        expect(sc1.map((s) => s.id).sort()).toEqual(['a', 'c']);
    });

    it('lists and filters by status, newest first', async () => {
        await repo.put(makeSession('a', 'sc1', 'completed'));
        await repo.put(makeSession('b', 'sc1', 'aborted'));
        const aborted = await repo.list({ status: 'aborted' });
        expect(aborted.map((s) => s.id)).toEqual(['b']);
        const all = await repo.list();
        expect(all[0]!.id).toBe('b'); // sorted by updatedAt desc
    });

    it('persists operator checkpoints inside the session', async () => {
        const s = makeSession('run-1');
        s.checkpoints.push({
            id: 'cp-1',
            at: Date.now(),
            label: 'mid-run',
            cursor: 1,
            history: [],
            results: [],
            status: 'running',
        });
        await repo.put(s);
        const got = await repo.get('run-1');
        expect(got?.checkpoints).toHaveLength(1);
        expect(got?.checkpoints[0]?.label).toBe('mid-run');
    });

    it('deletes a session', async () => {
        await repo.put(makeSession('run-1'));
        await repo.delete('run-1');
        expect(await repo.get('run-1')).toBeUndefined();
    });

    it('clears all sessions', async () => {
        await repo.put(makeSession('a'));
        await repo.put(makeSession('b'));
        await repo.clear();
        expect(await repo.list()).toHaveLength(0);
    });
});
