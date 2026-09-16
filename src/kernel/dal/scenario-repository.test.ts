import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDb } from './_test-harness';
import { ScenarioRepository } from './scenario-repository';
import type { ConversationScenario, ScenarioStatus } from '../contracts/conversation';
import { ConversationScenarioSchema } from '../types/schema-types';

const makeScenario = (
    id: string,
    version = 1,
    status: ScenarioStatus = 'draft',
): ConversationScenario => ({
    id,
    name: `Scenario ${id}`,
    description: 'test scenario',
    topic: 'architecture review',
    version,
    status,
    participants: [{ id: 'a', role: 'Architect' }],
    turns: [
        {
            participantId: 'a',
            objective: { type: 'INTRODUCE', description: 'open', constraints: [] },
        },
        {
            participantId: 'a',
            objective: { type: 'ANALYZE', description: 'analyze', constraints: ['concise'] },
        },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
});

describe('ScenarioRepository', () => {
    let tdb: TestDb;
    let repo: ScenarioRepository;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        repo = new ScenarioRepository(tdb.db);
    });

    it('creates and retrieves a scenario', async () => {
        await repo.put(makeScenario('s1'));
        const got = await repo.get('s1');
        expect(got?.id).toBe('s1');
        expect(got?.turns).toHaveLength(2);
        expect(got?.participants[0]?.id).toBe('a');
    });

    it('save is an alias for put', async () => {
        await repo.save(makeScenario('s2'));
        expect(await repo.get('s2')).toBeDefined();
    });

    it('lists and filters by status', async () => {
        await repo.put(makeScenario('a', 1, 'draft'));
        await repo.put(makeScenario('b', 1, 'active'));
        await repo.put(makeScenario('c', 1, 'archived'));
        const all = await repo.list();
        expect(all.map((s) => s.id).sort()).toEqual(['a', 'b', 'c']);
        const active = await repo.list({ status: 'active' });
        expect(active.map((s) => s.id)).toEqual(['b']);
    });

    it('archives a scenario (soft delete)', async () => {
        await repo.put(makeScenario('s1', 1, 'active'));
        await repo.archive('s1');
        const got = await repo.get('s1');
        expect(got?.status).toBe('archived');
        // archive is a status flip, not a physical delete
        expect(got).toBeDefined();
    });

    it('bumps version and updatedAt', async () => {
        const start = Date.now();
        await repo.put(makeScenario('s1', 1));
        const bumped = await repo.bumpVersion('s1');
        expect(bumped?.version).toBe(2);
        expect(bumped?.updatedAt).toBeGreaterThanOrEqual(start);
        const got = await repo.get('s1');
        expect(got?.version).toBe(2);
    });

    it('deletes a scenario', async () => {
        await repo.put(makeScenario('s1'));
        await repo.delete('s1');
        expect(await repo.get('s1')).toBeUndefined();
    });

    it('duplicates a scenario into a fresh draft', async () => {
        const src = makeScenario('s1', 3, 'active');
        await repo.put(src);

        const copy = await repo.duplicate('s1');

        // new identity, reset lifecycle, name suffix
        expect(copy.id).not.toBe('s1');
        expect(copy.id.startsWith('scenario-')).toBe(true);
        expect(copy.name).toBe('Scenario s1 (copy)');
        expect(copy.status).toBe('draft');
        expect(copy.version).toBe(1);
        // content (turns/participants) carried over
        expect(copy.turns).toHaveLength(2);
        expect(copy.participants[0]?.id).toBe('a');
        // persisted as a separate record; original untouched
        const original = await repo.get('s1');
        expect(original?.status).toBe('active');
        expect(original?.version).toBe(3);
        expect(await repo.list()).toHaveLength(2);
    });

    it('duplicate throws when the source is missing', async () => {
        await expect(repo.duplicate('ghost')).rejects.toThrow(/cannot duplicate/);
    });

    it('creates a scenario draft with generated id and draft status', async () => {
        const created = await repo.create({
            name: 'New Scenario',
            description: 'a brand-new draft',
            topic: 'objective',
            participants: [{ id: 'a', role: 'Architect' }],
            turns: [
                {
                    participantId: 'a',
                    objective: { type: 'INTRODUCE', description: 'open', constraints: [] },
                },
            ],
        });
        // generated identity + lifecycle metadata assigned at the repository boundary
        expect(created.id.startsWith('scenario-')).toBe(true);
        expect(created.status).toBe('draft');
        expect(created.version).toBe(1);
        expect(created.createdAt).toBeGreaterThan(0);
        // content carried through intact
        expect(created.turns).toHaveLength(1);
        expect(created.turns[0]?.objective.constraints).toEqual([]);
        const got = await repo.get(created.id);
        expect(got?.name).toBe('New Scenario');
        expect(got?.topic).toBe('objective');
    });

    it('Zod schema rejects a malformed turn (validation contract)', () => {
        const invalid = { ...makeScenario('bad') };
        // @ts-expect-error intentionally corrupt the shape for the validation test
        invalid.turns = [{ participantId: 'a' }];
        const result = ConversationScenarioSchema.safeParse(invalid);
        expect(result.success).toBe(false);
        // a well-formed scenario passes validation
        expect(ConversationScenarioSchema.safeParse(makeScenario('good')).success).toBe(true);
    });
});
