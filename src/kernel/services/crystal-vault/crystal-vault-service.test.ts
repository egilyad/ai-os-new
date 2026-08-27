import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { CrystalRepository } from '../../dal/crystal-repository';
import { CrystalVaultService } from './crystal-vault-service';
import type { IEventBus } from '../../types/interfaces';

describe('CrystalVaultService', () => {
    let tdb: TestDb;
    let service: CrystalVaultService;
    const events: string[] = [];

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        events.length = 0;
        const eventBus = {
            emit: (name: string) => {
                events.push(name);
            },
            on: () => () => undefined,
            onSafe: () => () => undefined,
            off: () => undefined,
            emitOnce: () => true,
            subscribeAll: () => () => undefined,
        } as unknown as IEventBus;
        service = new CrystalVaultService({
            repository: new CrystalRepository(tdb.db),
            eventBus,
        });
        await service.init();
    });

    const input = {
        content: { statement: 'Debates improve decision quality' },
        originKind: 'human' as const,
        originId: 'manual-1',
        contributingAgents: ['agent-a'],
    };

    it('proposes a semi crystal with confidence 0.3 and emits event', async () => {
        const id = await service.propose(input);
        const crystal = await service.get(id);
        expect(crystal?.status).toBe('semi');
        expect(crystal?.confidence).toBe(0.3);
        expect(crystal?.version).toBe(1);
        expect(crystal?.content.statement).toBe('Debates improve decision quality');
        expect(events).toContain('knowledge:crystal:proposed');
    });

    it('validates a crystal via debate', async () => {
        const id = await service.propose(input);
        const crystal = await service.validate(id, {
            debateId: 'deb-1',
            proArguments: ['pro-1'],
            conArguments: ['con-1'],
            reviewers: ['r1'],
            confidence: 0.7,
            humanApproved: true,
        });
        expect(crystal?.confidence).toBe(0.7);
        expect(crystal?.validation.debateId).toBe('deb-1');
        expect(crystal?.validation.humanApproved).toBe(true);
    });

    it('crystallizes semi → crystal and emits formed event', async () => {
        const id = await service.propose(input);
        const crystal = await service.crystallize(id);
        expect(crystal?.status).toBe('crystal');
        expect(crystal?.crystallizedAt).toBeDefined();
        expect(crystal?.confidence).toBeGreaterThanOrEqual(0.6);
        expect(events).toContain('knowledge:crystal:formed');
    });

    it('does not crystallize a refuted crystal', async () => {
        const id = await service.propose(input);
        await service.refute(id, 'bad');
        expect(await service.crystallize(id)).toBeNull();
    });

    it('supersedes a crystal and preserves history', async () => {
        const id = await service.propose(input);
        await service.crystallize(id);
        const next = await service.supersede(id, { statement: 'New refined statement' }, 'better');

        expect(next?.version).toBe(2);
        expect(next?.status).toBe('semi');
        expect(next?.content.statement).toBe('New refined statement');

        const history = await service.getHistory(id);
        expect(history).toHaveLength(2);
        expect(history[0]?.status).toBe('superseded');
        expect(history[0]?.supersededBy).toBe(`${id}#2`);
        expect(events).toContain('knowledge:crystal:superseded');
    });

    it('refutes a crystal', async () => {
        const id = await service.propose(input);
        const refuted = await service.refute(id, 'contradicted by evidence');
        expect(refuted?.status).toBe('refuted');
        expect(events).toContain('knowledge:crystal:refuted');
    });

    it('queries by status and confidence filters', async () => {
        const a = await service.propose(input);
        const b = await service.propose({
            ...input,
            content: { statement: 'Dissent must be preserved' },
        });
        await service.crystallize(a);
        await service.validate(b, {
            debateId: 'deb-2',
            proArguments: [],
            conArguments: [],
            reviewers: [],
            confidence: 0.9,
        });

        const crystals = await service.query({ status: 'crystal' });
        expect(crystals.map((c) => c.crystalId)).toContain(a);

        const high = await service.query({ minConfidence: 0.8 });
        expect(high.map((c) => c.crystalId)).toEqual([b]);
    });

    it('performs semantic search with ranked results', async () => {
        await service.propose(input);
        await service.propose({
            ...input,
            content: { statement: 'Cats are independent pets' },
        });
        const hits = await service.search('debate decision quality', 10);
        expect(hits.length).toBeGreaterThanOrEqual(1);
        expect(hits[0]!.crystal.content.statement).toBe('Debates improve decision quality');
    });

    it('detects contradicting crystals semantically', async () => {
        const a = await service.propose(input);
        const b = await service.propose({
            ...input,
            content: { statement: 'Debates worsen decision quality' },
        });
        const contradicting = await service.getContradicting(a);
        expect(contradicting.map((c) => c.crystalId)).toContain(b);
    });

    it('links a lens to a crystal', async () => {
        const id = await service.propose(input);
        const crystal = await service.linkToLens(id, 'lens:critical');
        expect(crystal?.linkedLensIds).toContain('lens:critical');
        const linked = await service.query({ lensId: 'lens:critical' });
        expect(linked.map((c) => c.crystalId)).toContain(id);
    });

    it('returns null for unknown crystal operations', async () => {
        expect(await service.get('nope')).toBeNull();
        expect(await service.crystallize('nope')).toBeNull();
        expect(await service.supersede('nope', { statement: 'x' }, 'r')).toBeNull();
        expect(
            await service.validate('nope', {
                debateId: 'd',
                proArguments: [],
                conArguments: [],
                reviewers: [],
            }),
        ).toBeNull();
    });
});
