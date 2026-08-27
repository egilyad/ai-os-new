import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDb } from './_test-harness';
import { CrystalRepository } from './crystal-repository';
import type { Crystal } from '../types/crystal-types';

const makeCrystal = (id: string, version: number, statement: string): Crystal => ({
    crystalId: id,
    version,
    content: { statement, evidence: [] },
    provenance: {
        originKind: 'human',
        originId: 'test',
        contributingAgents: [],
        modelIds: [],
        totalTokensSpent: 0,
    },
    validation: { proArguments: [], conArguments: [], reviewers: [], humanApproved: false },
    confidence: 0.6,
    status: version === 1 ? 'crystal' : 'semi',
    contradictingCrystalIds: [],
    supportingCrystalIds: [],
    linkedLensIds: [],
    linkedRoleIds: [],
    applicableDomain: 'general',
    createdAt: Date.now(),
    contentHash: `hash-${id}-${version}`,
});

describe('CrystalRepository', () => {
    let tdb: TestDb;
    let repo: CrystalRepository;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        repo = new CrystalRepository(tdb.db);
    });

    it('stores and retrieves latest version', async () => {
        await repo.put(makeCrystal('c1', 1, 'Test statement'));
        const got = await repo.get('c1');
        expect(got?.crystalId).toBe('c1');
        expect(got?.version).toBe(1);
    });

    it('retrieves a specific historical version', async () => {
        await repo.put(makeCrystal('c1', 1, 'v1'));
        await repo.put(makeCrystal('c1', 2, 'v2'));
        const v1 = await repo.getVersion('c1', 1);
        const v2 = await repo.getVersion('c1', 2);
        expect(v1?.content.statement).toBe('v1');
        expect(v2?.content.statement).toBe('v2');
    });

    it('lists version history in order', async () => {
        await repo.put(makeCrystal('c1', 1, 'v1'));
        await repo.put(makeCrystal('c1', 2, 'v2'));
        await repo.put(makeCrystal('c1', 3, 'v3'));
        const history = await repo.getHistory('c1');
        expect(history.map((h) => h.version)).toEqual([1, 2, 3]);
    });

    it('lists all latest crystals', async () => {
        await repo.put(makeCrystal('c1', 1, 'a'));
        await repo.put(makeCrystal('c2', 1, 'b'));
        await repo.put(makeCrystal('c2', 2, 'b2'));
        const all = await repo.list();
        expect(all.map((c) => c.crystalId).sort()).toEqual(['c1', 'c2']);
    });

    it('deletes crystal and all versions', async () => {
        await repo.put(makeCrystal('c1', 1, 'a'));
        await repo.put(makeCrystal('c1', 2, 'b'));
        await repo.delete('c1');
        expect(await repo.get('c1')).toBeUndefined();
        expect(await repo.getHistory('c1')).toEqual([]);
    });

    it('clears all crystals', async () => {
        await repo.put(makeCrystal('c1', 1, 'a'));
        await repo.put(makeCrystal('c2', 1, 'b'));
        await repo.clear();
        expect(await repo.list()).toEqual([]);
    });
});
