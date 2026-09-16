import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { JunctionRepository } from '../../dal/junction-repository';
import { JunctionEngineService } from './junction-engine-service';
import type { IEventBus } from '../../types/interfaces';
import type { ICrystalVaultService } from '../../contracts/knowledge-crystal';
import type { JunctionSourceView } from '../../contracts/junction-engine';

describe('JunctionRepository', () => {
    let tdb: TestDb;
    let repo: JunctionRepository;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        repo = new JunctionRepository(tdb.db);
    });

    it('round-trips a junction', async () => {
        const junction = {
            id: 'j-1',
            inputs: [
                {
                    kind: 'crystal' as const,
                    id: 'crystal://c1',
                    label: 'A',
                    domain: 'arch',
                    statement: 'x',
                },
            ],
            synthesisType: 'structural_analogy' as const,
            confidence: 0.8,
            content: 'y',
            status: 'pending' as const,
            cognitiveDebt: 'test',
            rationale: 'r',
            agentRole: 'bridge-builder' as const,
            createdAt: 1,
        };
        await repo.put(junction);
        expect((await repo.get('j-1'))?.status).toBe('pending');
        expect(await repo.list()).toHaveLength(1);
    });

    it('deletes and clears junctions', async () => {
        await repo.put({
            id: 'j-2',
            inputs: [],
            synthesisType: 'abstraction',
            confidence: 0.7,
            content: 'c',
            status: 'validated',
            cognitiveDebt: 'd',
            rationale: 'r',
            agentRole: 'abstraction-elevator',
            createdAt: 2,
        });
        await repo.delete('j-2');
        expect(await repo.list()).toHaveLength(0);
        await repo.put({
            id: 'j-3',
            inputs: [],
            synthesisType: 'contradiction',
            confidence: 0.9,
            content: 'c',
            status: 'pending',
            cognitiveDebt: 'd',
            rationale: 'r',
            agentRole: 'contradiction-miner',
            createdAt: 3,
        });
        await repo.clear();
        expect(await repo.list()).toHaveLength(0);
    });
});

describe('JunctionEngineService', () => {
    let tdb: TestDb;
    let service: JunctionEngineService;
    const events: string[] = [];
    const sources: JunctionSourceView[] = [
        {
            kind: 'crystal',
            id: 'crystal://c1',
            label: 'Architecture: layering principle',
            domain: 'arch',
            statement:
                'Isolating responsibilities across layers improves architectural resilience.',
        },
        {
            kind: 'crystal',
            id: 'crystal://c2',
            label: 'LLM: prompt layering',
            domain: 'llm',
            statement:
                'Isolating responsibilities between prompt layers improves model reliability.',
        },
        {
            kind: 'crystal',
            id: 'crystal://c3',
            label: 'Gov: separation of powers',
            domain: 'gov',
            statement:
                'Distributing authority across independent institutions prevents concentration of power.',
        },
        {
            kind: 'crystal',
            id: 'crystal://c4',
            label: 'Security: trust zones',
            domain: 'security',
            statement: 'Trust boundaries across security zones prevent compromise from spreading.',
        },
    ];

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

        const crystalVault = {
            list: async () => [],
        } as unknown as ICrystalVaultService;

        service = new JunctionEngineService({
            repository: new JunctionRepository(tdb.db),
            eventBus,
            crystalVault,
            debateSources: async () => sources,
        });
        await service.init();
    });

    it('detects structural analogies across domains', async () => {
        const candidates = await service.detect();
        expect(candidates.length).toBeGreaterThan(0);
        expect(candidates[0]!.confidence).toBeGreaterThanOrEqual(0.5);
        expect(events).toContain('knowledge:junction:detected');
    });

    it('only pairs sources from different domains', async () => {
        const candidates = await service.detect();
        for (const c of candidates) {
            const domains = new Set(c.inputs.map((s) => s.domain));
            expect(domains.size).toBe(2);
        }
    });

    it('validates a candidate into a pending junction', async () => {
        const candidates = await service.detect();
        const junction = await service.validate(candidates[0]!.candidateId);
        expect(junction?.status).toBe('pending');
        expect(junction?.content.length).toBeGreaterThan(0);
        expect(junction?.cognitiveDebt.length).toBeGreaterThan(0);
        expect((await service.get(junction!.id))?.id).toBe(junction!.id);
    });

    it('submits a counterargument → validated', async () => {
        const candidates = await service.detect();
        const junction = await service.validate(candidates[0]!.candidateId);
        const resolved = await service.submitCounterargument(
            junction!.id,
            'Дополнительная деталь, уточняющая границы аналогии.',
        );
        expect(resolved?.status).toBe('validated');
        expect(resolved?.validatedAt).toBeDefined();
        expect(events).toContain('knowledge:junction:validated');
    });

    it('submits a strong contradiction → rejected', async () => {
        const candidates = await service.detect();
        const junction = await service.validate(candidates[0]!.candidateId);
        const resolved = await service.submitCounterargument(
            junction!.id,
            'This is false: isolating responsibilities across layers does NOT create any structural connection between architecture and prompt design.',
        );
        expect(resolved?.status).toBe('rejected');
        expect(resolved?.rejectedAt).toBeDefined();
        expect(events).toContain('knowledge:junction:rejected');
    });

    it('lists with status filter', async () => {
        const candidates = await service.detect();
        const j1 = await service.validate(candidates[0]!.candidateId);
        await service.submitCounterargument(j1!.id, 'Уточнение границ аналогии.');
        const pending = await service.list({ status: 'pending' });
        const validated = await service.list({ status: 'validated' });
        expect(validated.length).toBe(1);
        expect(pending.length).toBe(0);
    });

    it('rejects manually', async () => {
        const candidates = await service.detect();
        const j = await service.validate(candidates[0]!.candidateId);
        const rejected = await service.reject(j!.id, 'manual override');
        expect(rejected?.status).toBe('rejected');
    });

    it('returns null for unknown candidate validation', async () => {
        expect(await service.validate('nope')).toBeNull();
    });

    it('returns debate + crystal sources combined', async () => {
        const views = await service.getSources();
        expect(views.length).toBe(4);
    });
});
