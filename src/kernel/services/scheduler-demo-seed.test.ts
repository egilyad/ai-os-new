import { SchedulerService } from './scheduler-service';
import type { Schedule } from './scheduler-service';
import type { IEventBus } from '../types/interfaces';
import { seedSchedulerDemo, DEMO_SCHEDULE_PREFIX } from './scheduler-demo-seed';

function makeService(saved: Schedule[] | null = null): {
    service: SchedulerService;
    db: { getKv: ReturnType<typeof vi.fn>; setKv: ReturnType<typeof vi.fn> };
} {
    const eventBus = {
        emit: vi.fn(),
        on: vi.fn(),
        onSafe: vi.fn(),
        emitOnce: vi.fn(),
        off: vi.fn(),
    } as unknown as IEventBus;
    const db = { getKv: vi.fn().mockResolvedValue(saved), setKv: vi.fn() };
    return { service: new SchedulerService(db as never, eventBus), db };
}

describe('scheduler-demo-seed', () => {
    it('seeds two schedules for two agents', async () => {
        const { service } = makeService();
        const schedules = await seedSchedulerDemo(service);
        expect(schedules).toHaveLength(2);
        for (const s of schedules) {
            expect(s.name.startsWith(DEMO_SCHEDULE_PREFIX)).toBe(true);
            expect(s.enabled).toBe(true);
        }
        const agentIds = new Set(schedules.map((s) => s.agentId));
        expect(agentIds.size).toBe(2);
        service.destroy();
    });

    it('is idempotent: repeated calls reuse schedules', async () => {
        const { service } = makeService();
        const first = await seedSchedulerDemo(service);
        const second = await seedSchedulerDemo(service);
        expect(second.map((s) => s.id).sort()).toEqual(first.map((s) => s.id).sort());
        service.destroy();
    });
});
