import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { GeneratorRepository } from '../../dal/generator-repository';
import { KnowledgeGeneratorService } from './knowledge-generator-service';
import { LensEngineService } from '../lens-engine/lens-engine-service';
import type { IEventBus } from '../../types/interfaces';
import type { ICrystalVaultService } from '../../contracts/knowledge-crystal';
import type { GenerationTrigger } from '../../types/generator-types';

describe('GeneratorRepository', () => {
    let tdb: TestDb;
    let repo: GeneratorRepository;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        repo = new GeneratorRepository(tdb.db);
    });

    it('round-trips a job with trigger and full job object', async () => {
        await repo.putJob({
            id: 'gen-1',
            trigger: { kind: 'gap', gapDescription: 'Missing guidance on X' },
            topic: 'Missing guidance on X',
            status: 'completed',
            stage: 'done',
            hypothesis: 'H',
            confidence: 0.7,
            createdAt: 1,
            job: {
                id: 'gen-1',
                trigger: { kind: 'gap', gapDescription: 'Missing guidance on X' },
                topic: 'Missing guidance on X',
                status: 'completed',
                stage: 'done',
                hypothesis: 'H',
                roleIds: [],
                lensIds: [],
                evidences: [],
                reviews: [],
                confidence: 0.7,
                tokensSpent: 10,
                createdAt: 1,
            },
        });
        expect((await repo.getJob('gen-1'))?.status).toBe('completed');
        expect((await repo.getJob('gen-1'))?.job?.confidence).toBe(0.7);
    });

    it('filters by status and trigger.kind', async () => {
        await repo.putJob({
            id: 'gen-2',
            trigger: { kind: 'scheduled', cron: '0 0 * * 1', topic: 'T' },
            topic: 'T',
            status: 'queued',
            stage: 'hypothesis',
            hypothesis: '',
            confidence: 0,
            createdAt: 2,
        });
        await repo.putJob({
            id: 'gen-3',
            trigger: { kind: 'gap', gapDescription: 'G' },
            topic: 'G',
            status: 'completed',
            stage: 'done',
            hypothesis: '',
            confidence: 0,
            createdAt: 3,
        });
        expect(await repo.listJobs({ status: 'queued' })).toHaveLength(1);
        expect(await repo.listJobs({ triggerKind: 'scheduled' })).toHaveLength(1);
        expect(await repo.listJobs({ status: 'completed' })).toHaveLength(1);
    });

    it('deletes a job', async () => {
        await repo.putJob({
            id: 'gen-4',
            trigger: { kind: 'gap', gapDescription: 'G' },
            topic: 'G',
            status: 'queued',
            stage: 'hypothesis',
            hypothesis: '',
            confidence: 0,
            createdAt: 4,
        });
        await repo.delete('gen-4');
        expect(await repo.getJob('gen-4')).toBeUndefined();
    });
});

describe('KnowledgeGeneratorService', () => {
    let tdb: TestDb;
    let service: KnowledgeGeneratorService;
    const events: string[] = [];
    let proposed: string[] = [];
    let crystallized: string[] = [];

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        events.length = 0;
        proposed = [];
        crystallized = [];

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
            propose: async (input: { content: { statement: string } }) => {
                const id = `crystal-gen-${proposed.length + 1}`;
                proposed.push(input.content.statement);
                return id;
            },
            crystallize: async (id: string) => {
                crystallized.push(id);
                return null;
            },
            search: async () => [],
            list: async () => [],
        } as unknown as ICrystalVaultService;

        service = new KnowledgeGeneratorService({
            repository: new GeneratorRepository(tdb.db),
            eventBus,
            lensEngine: new LensEngineService(),
            crystalVault,
            roles: async (roleId: string) =>
                roleId === 'arch'
                    ? ({
                          id: 'arch',
                          name: 'Архитектор',
                          description: 'Оценивает структурную целостность решения.',
                          systemPrompt: 'Ты архитектор систем.',
                          capabilities: ['architecture'],
                          permissions: [],
                          metadata: { category: 'analytical', created: 1, updated: 1 },
                      } as never)
                    : undefined,
        });
        await service.init();
    });

    it('runs a scheduled trigger end-to-end and emits events', async () => {
        const trigger: GenerationTrigger = {
            kind: 'scheduled',
            cron: '0 0 * * 1',
            topic: 'Надёжность распределённых систем',
        };
        const id = await service.generateFromTrigger(trigger);
        expect(id.startsWith('gen-')).toBe(true);
        expect(events).toContain('generator:started');
        expect(events).toContain('generator:stage');
        expect(events).toContain('generator:completed');

        const job = await service.getStatus(id);
        expect(job).not.toBeNull();
        expect(job!.status).toBe('completed');
        expect(job!.stage).toBe('done');
        expect(job!.topic).toBe('Надёжность распределённых систем');
        expect(job!.hypothesis.length).toBeGreaterThan(10);
        expect(job!.evidences.length).toBeGreaterThan(0);
        expect(job!.reviews).toHaveLength(4);
        expect(job!.confidence).toBeGreaterThan(0);
        expect(job!.crystalId).toBeTruthy();
    });

    it('derives topic from trigger kind', async () => {
        const id = await service.generateFromTrigger({
            kind: 'gap',
            gapDescription: 'Дыра в правилах',
        });
        const job = await service.getStatus(id);
        expect(job!.topic).toBe('Дыра в правилах');

        const id2 = await service.generateFromTrigger({
            kind: 'cross-domain',
            sourceDomains: ['arch', 'security'],
        });
        const job2 = await service.getStatus(id2);
        expect(job2!.topic).toContain('arch');
    });

    it('skips crystallization when threshold is high', async () => {
        service.setLimits({ crystallizationThreshold: 0.99 });
        const id = await service.generateFromTrigger({
            kind: 'anomaly',
            detectedAnomalyId: 'anom-42',
        });
        const job = await service.getStatus(id);
        expect(job!.status).toBe('completed');
        expect(job!.crystalId).toBeUndefined();
        expect(proposed).toHaveLength(0);
    });

    it('crystallizes a strong hypothesis into a crystal', async () => {
        const id = await service.generateFromTrigger({
            kind: 'forum-question',
            topicId: 'topic-1',
        });
        const job = await service.getStatus(id);
        expect(job!.confidence).toBeGreaterThanOrEqual(0.55);
        expect(job!.crystalId).toBeTruthy();
        expect(proposed).toHaveLength(1);
        expect(crystallized).toHaveLength(1);
    });

    it('getStatus returns null for an unknown job', async () => {
        expect(await service.getStatus('nope')).toBeNull();
    });

    it('cancel marks a queued job cancelled and emits event', async () => {
        const id = await service.generateFromTrigger({ kind: 'gap', gapDescription: 'G' });
        // job already completed — cancel must refuse
        expect(await service.cancel(id)).toBe(false);

        // Inject a queued job directly, then cancel it.
        const queuedId = 'gen-queued-1';
        await tdb.db.genJobs.put({
            id: queuedId,
            trigger: { kind: 'gap', gapDescription: 'Q' },
            topic: 'Q',
            status: 'queued',
            stage: 'hypothesis',
            hypothesis: '',
            confidence: 0,
            createdAt: Date.now(),
            job: {
                id: queuedId,
                trigger: { kind: 'gap', gapDescription: 'Q' },
                topic: 'Q',
                status: 'queued',
                stage: 'hypothesis',
                hypothesis: '',
                roleIds: [],
                lensIds: [],
                evidences: [],
                reviews: [],
                confidence: 0,
                tokensSpent: 0,
                createdAt: Date.now(),
            },
        });
        expect(await service.cancel(queuedId)).toBe(true);
        expect(events).toContain('generator:cancelled');
        const job = await service.getStatus(queuedId);
        expect(job!.status).toBe('cancelled');
    });

    it('listActiveJobs returns queued/running jobs only', async () => {
        await service.generateFromTrigger({ kind: 'gap', gapDescription: 'A' });
        expect(await service.listActiveJobs()).toHaveLength(0);

        const activeId = 'gen-active-1';
        await tdb.db.genJobs.put({
            id: activeId,
            trigger: { kind: 'anomaly', detectedAnomalyId: 'x' },
            topic: 'X',
            status: 'running',
            stage: 'evidence',
            hypothesis: '',
            confidence: 0,
            createdAt: Date.now(),
            job: {
                id: activeId,
                trigger: { kind: 'anomaly', detectedAnomalyId: 'x' },
                topic: 'X',
                status: 'running',
                stage: 'evidence',
                hypothesis: '',
                roleIds: [],
                lensIds: [],
                evidences: [],
                reviews: [],
                confidence: 0,
                tokensSpent: 0,
                createdAt: Date.now(),
            },
        });
        const active = await service.listActiveJobs();
        expect(active.length).toBe(1);
        expect(active[0]!.id).toBe(activeId);
    });

    it('enforces maxConcurrentJobs', async () => {
        service.setLimits({ maxConcurrentJobs: 1 });
        const p1 = service.generateFromTrigger({ kind: 'gap', gapDescription: 'First' });
        const p2 = service.generateFromTrigger({ kind: 'gap', gapDescription: 'Second' });
        await expect(p2).rejects.toThrow(/maxConcurrentJobs/);
        await p1;
    });

    it('marks a job failed when a stage throws', async () => {
        const failing = new KnowledgeGeneratorService({
            repository: new GeneratorRepository(tdb.db),
            eventBus: {
                emit: (name: string) => {
                    events.push(name);
                },
            } as unknown as IEventBus,
            lensEngine: new LensEngineService(),
            crystalVault: {
                propose: async () => 'c-1',
                crystallize: async () => null,
                search: async () => {
                    throw new Error('vault down');
                },
            } as unknown as ICrystalVaultService,
            roles: async () => {
                throw new Error('role registry down');
            },
        });
        await failing.init();
        const id = await failing.generateFromTrigger({ kind: 'gap', gapDescription: 'G' });
        const job = await failing.getStatus(id);
        expect(job!.status).toBe('failed');
        expect(job!.error).toContain('role registry down');
        expect(events).toContain('generator:failed');
    });

    it('rejects a trigger without a research topic', async () => {
        await expect(
            service.generateFromTrigger({ kind: 'gap', gapDescription: '   ' }),
        ).rejects.toThrow();
    });
});
