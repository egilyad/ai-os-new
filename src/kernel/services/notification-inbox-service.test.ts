import { describe, expect, it, vi } from 'vitest';
import { NotificationInboxService } from './notification-inbox-service';
import { EVENTS } from '../events/event-names';

function fakeBus() {
    const handlers: Record<string, (data?: unknown) => void> = {};
    return {
        handlers,
        on: vi.fn((event: string, cb: (data?: unknown) => void) => {
            handlers[event] = cb;
            return () => {
                delete handlers[event];
            };
        }),
    };
}

function fakeDb() {
    const store = new Map<string, unknown>();
    return {
        store,
        getKv: vi.fn(async <T>(id: string): Promise<T | null> => (store.get(id) as T) ?? null),
        setKv: vi.fn(async <T>(id: string, value: T): Promise<void> => {
            store.set(id, value);
        }),
    };
}

describe('NotificationInboxService', () => {
    it('подписывается на system:notification и хранит уведомления', async () => {
        const bus = fakeBus();
        const svc = new NotificationInboxService({ eventBus: bus, now: () => 1000 });
        await svc.init();

        expect(bus.on).toHaveBeenCalledWith(EVENTS.NOTIFICATION, expect.any(Function));
        bus.handlers[EVENTS.NOTIFICATION]?.({
            message: 'debate finished',
            type: 'success',
            source: 'debate',
        });
        bus.handlers[EVENTS.NOTIFICATION]?.({ message: 'no type' });

        expect(svc.list()).toHaveLength(2);
        expect(svc.list()).toMatchObject([
            { message: 'debate finished', type: 'success', source: 'debate', read: false },
            { message: 'no type', type: 'info', read: false },
        ]);
        await svc.destroy();
        expect(bus.handlers[EVENTS.NOTIFICATION]).toBeUndefined();
    });

    it('игнорирует невалидные события и ограничивает размер инбокса', async () => {
        const bus = fakeBus();
        const svc = new NotificationInboxService({ eventBus: bus, now: () => 1000 });
        await svc.init();
        bus.handlers[EVENTS.NOTIFICATION]?.({ type: 'error' });
        bus.handlers[EVENTS.NOTIFICATION]?.(undefined);
        for (let i = 0; i < 150; i++) {
            svc.push({ message: `msg-${i}` });
        }
        const items = svc.list();
        expect(items).toHaveLength(100);
        expect(items[0]!.message).toBe('msg-50');
    });

    it('отмечает прочитанные и очищает инбокс', async () => {
        const bus = fakeBus();
        const svc = new NotificationInboxService({ eventBus: bus, now: () => 1000 });
        const first = svc.push({ message: 'a' });
        svc.push({ message: 'b' });

        expect(svc.markRead(first.id)).toBe(true);
        expect(svc.markRead('missing')).toBe(false);
        expect(svc.list(true).map((i) => i.message)).toEqual(['b']);
        svc.markAllRead();
        expect(svc.list(true)).toEqual([]);
        svc.clear();
        expect(svc.list()).toEqual([]);
    });

    it('сохраняет и восстанавливает инбокс через database', async () => {
        const db = fakeDb();
        const svc = new NotificationInboxService({
            eventBus: fakeBus(),
            database: db,
            now: () => 1000,
        });
        svc.push({ message: 'persisted', type: 'warning' });
        await Promise.resolve();

        const restored = new NotificationInboxService({
            eventBus: fakeBus(),
            database: db,
            now: () => 2000,
        });
        await restored.init();
        expect(restored.list()).toMatchObject([{ message: 'persisted', type: 'warning' }]);
    });
});
