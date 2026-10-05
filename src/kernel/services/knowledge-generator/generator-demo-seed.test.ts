import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { GeneratorRepository } from '../../dal/generator-repository';
import { KnowledgeGeneratorService } from './knowledge-generator-service';
import { seedGeneratorDemo, DEMO_GENERATOR_TOPIC } from './generator-demo-seed';
import type { IEventBus } from '../../types/interfaces';

describe('generator-demo-seed', () => {
    let tdb: TestDb;
    let service: KnowledgeGeneratorService;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        const eventBus = {
            emit: () => {},
            on: () => () => undefined,
            onSafe: () => () => undefined,
            off: () => undefined,
            emitOnce: () => true,
            subscribeAll: () => () => undefined,
        } as unknown as IEventBus;
        service = new KnowledgeGeneratorService({
            repository: new GeneratorRepository(tdb.db),
            eventBus,
            lensEngine: { getLens: () => undefined, listLenses: () => [] } as never,
            crystalVault: {
                search: async () => [],
                propose: async () => 'crystal-demo',
                crystallize: async () => {},
            } as never,
        });
        await service.init();
    });

    it('runs the pipeline to a completed job', async () => {
        const job = await seedGeneratorDemo(service, new GeneratorRepository(tdb.db));
        expect(job.topic).toBe(DEMO_GENERATOR_TOPIC);
        expect(job.status).toBe('completed');
        expect(job.hypothesis.length).toBeGreaterThan(0);
    });

    it('is idempotent: repeated calls reuse the job', async () => {
        const repo = new GeneratorRepository(tdb.db);
        const first = await seedGeneratorDemo(service, repo);
        const second = await seedGeneratorDemo(service, repo);
        expect(second.id).toBe(first.id);
    });
});
