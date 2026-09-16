import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDb } from './_test-harness';
import { ScenarioRepository } from './scenario-repository';
import type { ConversationScenario } from '../contracts/conversation';

const makeScenario = (id: string): ConversationScenario => ({
    id,
    name: `Scenario ${id}`,
    description: 'migration test',
    topic: 'review',
    version: 1,
    status: 'draft',
    participants: [{ id: 'a', role: 'Architect' }],
    turns: [
        {
            participantId: 'a',
            objective: { type: 'INTRODUCE', description: 'open', constraints: [] },
        },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
});

describe('ScenarioRepository migration (Dexie v19)', () => {
    let tdb: TestDb;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
    });

    it('opens the database at schema version 19 with the scenarios table', async () => {
        expect(tdb.dexie.verno).toBe(19);
        expect(tdb.dexie.scenarios).toBeDefined();
    });

    it('does not break prior tables (workflows still usable)', async () => {
        await tdb.db.workflows.put({
            id: 'w1',
            title: 'w',
            status: 'draft',
            version: 1,
            nodeCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        expect(await tdb.db.workflows.get('w1')).toBeDefined();
    });

    it('persists and reloads a scenario through the new table', async () => {
        const repo = new ScenarioRepository(tdb.db);
        await repo.put(makeScenario('s1'));
        const got = await repo.get('s1');
        expect(got?.id).toBe('s1');
        expect(got?.turns).toHaveLength(1);
    });

    it('round-trips multiple scenarios and lists them newest-first', async () => {
        const repo = new ScenarioRepository(tdb.db);
        await repo.put({ ...makeScenario('old'), updatedAt: 1000 });
        await repo.put({ ...makeScenario('new'), updatedAt: 2000 });
        const all = await repo.list();
        expect(all.map((s) => s.id)).toEqual(['new', 'old']);
    });
});
