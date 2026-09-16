import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SchedulerService, initSchedulerService, type Schedule } from './scheduler-service';
import { BucketStorageAdapter } from './storage-adapter';
import type { IEventBus } from '../types/interfaces';

describe('SchedulerService', () => {
    let service: SchedulerService;
    let db: { getKv: ReturnType<typeof vi.fn>; setKv: ReturnType<typeof vi.fn> };
    let eventBus: IEventBus;
    let emitSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        eventBus = {
            emit: vi.fn(),
            on: vi.fn(),
            onSafe: vi.fn(),
            emitOnce: vi.fn(),
            off: vi.fn(),
        } as unknown as IEventBus;
        emitSpy = eventBus.emit as ReturnType<typeof vi.fn>;
        vi.spyOn(BucketStorageAdapter.AGENTS, 'get').mockResolvedValue(null);
        vi.spyOn(BucketStorageAdapter.AGENTS, 'set').mockResolvedValue(undefined);
        vi.spyOn(BucketStorageAdapter.AGENTS, 'remove').mockResolvedValue(undefined);

        db = { getKv: vi.fn(), setKv: vi.fn() };
        service = new SchedulerService(db as never, eventBus);
    });

    afterEach(() => {
        service.destroy();
        vi.restoreAllMocks();
    });

    describe('init', () => {
        it('loads schedules from database', async () => {
            const saved: Schedule[] = [
                {
                    id: 's1',
                    name: 'Morning',
                    agentId: 'a1',
                    cronExpression: '0 9 * * *',
                    taskParams: {},
                    enabled: true,
                    runCount: 0,
                    createdAt: 100,
                    updatedAt: 100,
                },
            ];
            vi.mocked(db.getKv).mockResolvedValue(saved);
            await service.init();
            expect(service.getAll()).toHaveLength(1);
            expect(service.getById('s1')?.name).toBe('Morning');
        });

        it('loads schedules from bucket storage if no db data', async () => {
            vi.mocked(db.getKv).mockResolvedValue(null);
            const saved: Schedule[] = [
                {
                    id: 's2',
                    name: 'Night',
                    agentId: 'a2',
                    cronExpression: '0 22 * * *',
                    taskParams: {},
                    enabled: true,
                    runCount: 0,
                    createdAt: 200,
                    updatedAt: 200,
                },
            ];
            vi.mocked(BucketStorageAdapter.AGENTS.get).mockResolvedValue(saved);
            await service.init();
            expect(service.getAll()).toHaveLength(1);
            expect(service.getById('s2')?.name).toBe('Night');
        });

        it('migrates from bucket to db when both exist', async () => {
            vi.mocked(db.getKv).mockResolvedValue(null);
            const saved: Schedule[] = [
                {
                    id: 's3',
                    name: 'Migrate',
                    agentId: 'a3',
                    cronExpression: '0 9 * * *',
                    taskParams: {},
                    enabled: true,
                    runCount: 0,
                    createdAt: 300,
                    updatedAt: 300,
                },
            ];
            vi.mocked(BucketStorageAdapter.AGENTS.get).mockResolvedValue(saved);
            await service.init();
            expect(db.setKv).toHaveBeenCalledWith('schedules', saved);
            expect(BucketStorageAdapter.AGENTS.remove).toHaveBeenCalled();
        });

        it('is idempotent', async () => {
            vi.mocked(db.getKv).mockResolvedValue([]);
            await service.init();
            await service.init();
            expect(db.getKv).toHaveBeenCalledTimes(1);
        });

        it('starts the scheduler on init', async () => {
            vi.mocked(db.getKv).mockResolvedValue([]);
            await service.init();
            expect((service as unknown as { isRunning: boolean }).isRunning).toBe(true);
        });
    });

    describe('CRUD', () => {
        beforeEach(async () => {
            vi.mocked(db.getKv).mockResolvedValue([]);
            await service.init();
        });

        it('creates a schedule with frequency', async () => {
            const s = await service.create({
                name: 'Test Job',
                agentId: 'agent-1',
                frequency: 'daily',
                taskParams: { prompt: 'hello' },
            });
            expect(s.id).toBeTruthy();
            expect(s.name).toBe('Test Job');
            expect(s.agentId).toBe('agent-1');
            expect(s.cronExpression).toBe('0 9 * * *');
            expect(s.enabled).toBe(true);
            expect(s.runCount).toBe(0);
            expect(s.nextRun).toBeGreaterThan(0);
            expect(db.setKv).toHaveBeenCalled();
        });

        it('creates with custom cron', async () => {
            const s = await service.create({
                name: 'Custom',
                agentId: 'agent-2',
                frequency: 'custom',
                cronExpression: '*/5 * * * *',
                taskParams: {},
            });
            expect(s.cronExpression).toBe('*/5 * * * *');
        });

        it('emits SCHEDULE_CREATED', async () => {
            await service.create({
                name: 'E1',
                agentId: 'a1',
                frequency: 'hourly',
                taskParams: {},
            });
            expect(emitSpy).toHaveBeenCalledWith(
                expect.stringContaining('created'),
                expect.objectContaining({ name: 'E1' }),
            );
        });

        it('updates fields and recalculates nextRun', async () => {
            await service.create({
                name: 'Orig',
                agentId: 'a1',
                frequency: 'daily',
                taskParams: {},
            });
            const s = service.getAll()[0];
            const origNext = s.nextRun;
            const updated = await service.update(s.id, {
                name: 'Upd',
                cronExpression: '0 12 * * *',
            });
            expect(updated?.name).toBe('Upd');
            expect(updated?.nextRun).not.toBe(origNext);
        });

        it('update returns null for unknown id', async () => {
            expect(await service.update('nope', { name: 'N' })).toBeNull();
        });

        it('update handles toggle via enabled field', async () => {
            await service.create({
                name: 'Tog',
                agentId: 'a1',
                frequency: 'daily',
                taskParams: {},
            });
            const s = service.getAll()[0];
            expect((await service.update(s.id, { enabled: false }))?.enabled).toBe(false);
        });

        it('emits SCHEDULE_UPDATED', async () => {
            await service.create({ name: 'E2', agentId: 'a1', frequency: 'daily', taskParams: {} });
            const s = service.getAll()[0];
            await service.update(s.id, { name: 'E2-Upd' });
            expect(emitSpy).toHaveBeenCalledWith(
                expect.stringContaining('updated'),
                expect.objectContaining({ name: 'E2-Upd' }),
            );
        });

        it('deletes a schedule', async () => {
            await service.create({
                name: 'Del',
                agentId: 'a1',
                frequency: 'daily',
                taskParams: {},
            });
            const s = service.getAll()[0];
            expect(await service.delete(s.id)).toBe(true);
            expect(service.getAll()).toHaveLength(0);
        });

        it('delete returns false for unknown id', async () => {
            expect(await service.delete('nope')).toBe(false);
        });

        it('emits SCHEDULE_DELETED', async () => {
            await service.create({
                name: 'Del-E',
                agentId: 'a1',
                frequency: 'daily',
                taskParams: {},
            });
            const s = service.getAll()[0];
            await service.delete(s.id);
            expect(emitSpy).toHaveBeenCalledWith(
                expect.stringContaining('deleted'),
                expect.objectContaining({ id: s.id }),
            );
        });

        it('toggle disables and enables', async () => {
            await service.create({
                name: 'Tog',
                agentId: 'a1',
                frequency: 'daily',
                taskParams: {},
            });
            const s = service.getAll()[0];
            expect((await service.toggle(s.id, false))?.enabled).toBe(false);
            expect((await service.toggle(s.id, true))?.enabled).toBe(true);
        });
    });

    describe('queries', () => {
        beforeEach(async () => {
            vi.mocked(db.getKv).mockResolvedValue([]);
            await service.init();
            await service.create({ name: 'S1', agentId: 'a1', frequency: 'daily', taskParams: {} });
            await service.create({
                name: 'S2',
                agentId: 'a1',
                frequency: 'weekly',
                taskParams: {},
            });
            await service.create({
                name: 'S3',
                agentId: 'a2',
                frequency: 'monthly',
                taskParams: {},
            });
        });

        it('getAll returns all', () => expect(service.getAll()).toHaveLength(3));
        it('getForAgent filters', () => {
            expect(service.getForAgent('a1')).toHaveLength(2);
            expect(service.getForAgent('a2')).toHaveLength(1);
        });
        it('getById returns schedule or undefined', () => {
            const all = service.getAll();
            expect(service.getById(all[0].id)?.id).toBe(all[0].id);
            expect(service.getById('nope')).toBeUndefined();
        });
    });

    describe('getDueSchedules', () => {
        beforeEach(async () => {
            vi.mocked(db.getKv).mockResolvedValue([]);
            await service.init();
        });

        it('returns enabled schedules with past nextRun', async () => {
            await service.create({
                name: 'Due',
                agentId: 'a1',
                frequency: 'hourly',
                taskParams: {},
            });
            const s = service.getAll()[0];
            await service.update(s.id, { nextRun: Date.now() - 10000 } as Partial<Schedule>);
            expect(service.getDueSchedules()).toHaveLength(1);
        });

        it('skips disabled schedules', async () => {
            await service.create({
                name: 'Nah',
                agentId: 'a1',
                frequency: 'hourly',
                taskParams: {},
            });
            const s = service.getAll()[0];
            await service.toggle(s.id, false);
            await service.update(s.id, { nextRun: Date.now() - 10000 } as Partial<Schedule>);
            expect(service.getDueSchedules()).toHaveLength(0);
        });

        it('skips schedules without nextRun', async () => {
            await service.create({
                name: 'NoNext',
                agentId: 'a1',
                frequency: 'hourly',
                taskParams: {},
            });
            const s = service.getAll()[0];
            await service.update(s.id, {
                nextRun: undefined as unknown as number,
            } as Partial<Schedule>);
            expect(service.getDueSchedules()).toHaveLength(0);
        });
    });

    describe('trigger', () => {
        beforeEach(async () => {
            vi.mocked(db.getKv).mockResolvedValue([]);
            await service.init();
        });

        it('runs schedule and increments runCount', async () => {
            await service.create({
                name: 'R',
                agentId: 'a1',
                frequency: 'hourly',
                taskParams: { prompt: 'p' },
            });
            const s = service.getAll()[0];
            expect(await service.trigger(s.id)).toBe(true);
            const updated = service.getById(s.id);
            expect(updated?.runCount).toBe(1);
            expect(updated?.lastRun).toBeGreaterThan(0);
        });

        it('emits TRIGGERED and COMPLETED events', async () => {
            await service.create({
                name: 'E',
                agentId: 'a1',
                frequency: 'hourly',
                taskParams: { prompt: 'p' },
            });
            const s = service.getAll()[0];
            await service.trigger(s.id);
            expect(emitSpy).toHaveBeenCalledWith(
                expect.stringContaining('triggered'),
                expect.objectContaining({ scheduleId: s.id, agentId: 'a1' }),
            );
            expect(emitSpy).toHaveBeenCalledWith(
                expect.stringContaining('completed'),
                expect.objectContaining({ success: true }),
            );
        });

        it('returns false for unknown schedule', async () => {
            expect(await service.trigger('nope')).toBe(false);
        });
    });

    describe('getUpcoming', () => {
        beforeEach(async () => {
            vi.mocked(db.getKv).mockResolvedValue([]);
            await service.init();
            await service.create({
                name: 'Soon',
                agentId: 'a1',
                frequency: 'hourly',
                taskParams: {},
            });
            await service.create({
                name: 'Later',
                agentId: 'a1',
                frequency: 'daily',
                taskParams: {},
            });
        });

        it('returns sorted upcoming runs', () => {
            const u = service.getUpcoming(5);
            for (let i = 1; i < u.length; i++) {
                expect(u[i - 1].nextRun).toBeLessThanOrEqual(u[i].nextRun);
            }
        });

        it('respects count limit', () => {
            expect(service.getUpcoming(1)).toHaveLength(1);
        });
    });

    describe('clear / destroy', () => {
        beforeEach(async () => {
            vi.mocked(db.getKv).mockResolvedValue([]);
            await service.init();
            await service.create({ name: 'C1', agentId: 'a1', frequency: 'daily', taskParams: {} });
            await service.create({
                name: 'C2',
                agentId: 'a2',
                frequency: 'weekly',
                taskParams: {},
            });
        });

        it('clear removes all and persists', async () => {
            await service.clear();
            expect(service.getAll()).toHaveLength(0);
            expect(db.setKv).toHaveBeenCalledWith('schedules', []);
        });

        it('destroy stops and clears', () => {
            service.destroy();
            expect(service.getAll()).toHaveLength(0);
        });
    });

    describe('cron utilities', () => {
        it('parseCron parses 5 parts', () => {
            expect(service.parseCron('30 14 1 6 5')).toEqual({
                minute: '30',
                hour: '14',
                dayOfMonth: '1',
                month: '6',
                dayOfWeek: '5',
            });
        });
        it('parseCron handles wildcards', () => {
            const p = service.parseCron('* * * * *');
            expect(p.minute).toBe('*');
            expect(p.hour).toBe('*');
        });
        it('validateCron accepts valid expressions', () => {
            expect(service.validateCron('0 9 * * *')).toBe(true);
            expect(service.validateCron('0-30 * * * *')).toBe(true);
            expect(service.validateCron('0 9 * * * *')).toBe(true);
        });
        it('validateCron rejects invalid', () => {
            expect(service.validateCron('60 * * * *')).toBe(false);
            expect(service.validateCron('* 24 * * *')).toBe(false);
            expect(service.validateCron('* * 0 * *')).toBe(false);
            expect(service.validateCron('* * * 13 *')).toBe(false);
            expect(service.validateCron('* * * * 8')).toBe(false);
            expect(service.validateCron('* * *')).toBe(false);
            expect(service.validateCron('a b c d e')).toBe(false);
            expect(service.validateCron('30-0 * * * *')).toBe(false);
            expect(service.validateCron('/5 * * * *')).toBe(false);
        });
        it('validateCron rejects step expressions', () => {
            expect(service.validateCron('*/5 * * * *')).toBe(false);
        });
    });

    describe('stop / start', () => {
        beforeEach(async () => {
            vi.mocked(db.getKv).mockResolvedValue([]);
            await service.init();
        });

        it('stop clears interval', () => {
            service.stop();
            expect((service as unknown as { isRunning: boolean }).isRunning).toBe(false);
            expect(
                (service as unknown as { intervalId: ReturnType<typeof setInterval> | null })
                    .intervalId,
            ).toBeNull();
        });

        it('start restarts', () => {
            service.stop();
            service.start();
            expect((service as unknown as { isRunning: boolean }).isRunning).toBe(true);
            expect(
                (service as unknown as { intervalId: ReturnType<typeof setInterval> | null })
                    .intervalId,
            ).not.toBeNull();
        });

        it('start is idempotent', () => {
            const id = (service as unknown as { intervalId: ReturnType<typeof setInterval> | null })
                .intervalId;
            service.start();
            expect(
                (service as unknown as { intervalId: ReturnType<typeof setInterval> | null })
                    .intervalId,
            ).toBe(id);
        });
    });

    describe('setDatabase', () => {
        it('injects database after construction', () => {
            const s = new SchedulerService();
            const fakeDb = { getKv: vi.fn(), setKv: vi.fn() };
            s.setDatabase(fakeDb as never);
            expect((s as unknown as { _database: unknown })._database).toBe(fakeDb);
        });
    });

    describe('singleton factory', () => {
        beforeEach(() => {
            vi.restoreAllMocks();
        });

        it('initSchedulerService creates singleton', () => {
            const s1 = initSchedulerService(db as never, eventBus);
            const s2 = initSchedulerService(db as never, eventBus);
            expect(s1).toBe(s2);
        });
    });
});
