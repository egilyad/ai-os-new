import { SopService } from './sop-service';
import { seedSopDemo, DEMO_SOP_NAME } from './sop-demo-seed';
import type { IEventBus } from '../../types/interfaces';

describe('sop-demo-seed', () => {
    function makeService(): SopService {
        const events = { emit: () => {} } as unknown as IEventBus;
        return new SopService({} as never, events);
    }

    it('seeds a three-phase demo SOP', async () => {
        const def = await seedSopDemo(makeService());
        expect(def.name).toBe(DEMO_SOP_NAME);
        expect(def.phases).toHaveLength(3);
    });

    it('is idempotent: repeated calls reuse the SOP', async () => {
        const service = makeService();
        const first = await seedSopDemo(service);
        const second = await seedSopDemo(service);
        expect(second.id).toBe(first.id);
        expect(await service.listSops()).toHaveLength(1);
    });
});
