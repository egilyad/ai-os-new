import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { FrontierRepository } from '../../dal/frontier-repository';
import { EvalService } from './eval-service';
import { seedFrontierDemo, DEMO_BENCHMARK_NAME } from './frontier-demo-seed';
import type { IEventBus } from '../../types/interfaces';

describe('frontier-demo-seed', () => {
    let tdb: TestDb;
    let service: EvalService;

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
        service = new EvalService(new FrontierRepository(tdb.db), eventBus);
    });

    it('seeds a benchmark and a passing run', async () => {
        const run = await seedFrontierDemo(service);
        expect(run.total).toBe(run.maxTotal);
        const benchmarks = await service.listBenchmarks();
        expect(benchmarks.map((b) => b.name)).toContain(DEMO_BENCHMARK_NAME);
    });

    it('is idempotent: repeated calls reuse the run', async () => {
        const first = await seedFrontierDemo(service);
        const second = await seedFrontierDemo(service);
        expect(second.id).toBe(first.id);
    });
});
