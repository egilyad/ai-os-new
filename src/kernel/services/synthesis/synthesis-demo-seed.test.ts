import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { SynthesisRepository } from '../../dal/synthesis-repository';
import { SynthesisEngineService } from './synthesis-engine-service';
import { seedSynthesisDemo, DEMO_SYNTHESIS_QUESTION } from './synthesis-demo-seed';
import type { IEventBus } from '../../types/interfaces';

describe('synthesis-demo-seed', () => {
    let tdb: TestDb;
    let service: SynthesisEngineService;

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
        service = new SynthesisEngineService({
            repository: new SynthesisRepository(tdb.db),
            eventBus,
            lensEngine: { getLens: () => undefined, listLenses: () => [] } as never,
            crystalVault: { search: async () => [] } as never,
        });
        await service.init();
    });

    it('synthesizes a completed statement', async () => {
        const synthesis = await seedSynthesisDemo(service);
        expect(synthesis.input.question).toBe(DEMO_SYNTHESIS_QUESTION);
        expect(synthesis.status).toBe('completed');
        expect(synthesis.synthesizedStatement.length).toBeGreaterThan(0);
        expect(synthesis.perspectives.length).toBeGreaterThan(0);
    });

    it('is idempotent: repeated calls reuse the synthesis', async () => {
        const first = await seedSynthesisDemo(service);
        const second = await seedSynthesisDemo(service);
        expect(second.id).toBe(first.id);
    });
});
