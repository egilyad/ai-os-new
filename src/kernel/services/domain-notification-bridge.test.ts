import { describe, expect, it, vi } from 'vitest';
import { DomainNotificationBridge } from './domain-notification-bridge';
import { EVENTS } from '../events/event-names';

function fakeBus() {
    const handlers: Record<string, (data?: unknown) => void> = {};
    return {
        handlers,
        emit: vi.fn(),
        on: vi.fn((event: string, cb: (data?: unknown) => void) => {
            handlers[event] = cb;
            return () => {
                delete handlers[event];
            };
        }),
    };
}

describe('DomainNotificationBridge', () => {
    it('превращает завершение дебата в уведомление об успехе', async () => {
        const bus = fakeBus();
        const bridge = new DomainNotificationBridge({ eventBus: bus });
        await bridge.init();

        bus.handlers[EVENTS.DEBATE_SESSION_COMPLETED]?.({ sessionId: 'deb-1' });
        expect(bus.emit).toHaveBeenCalledWith(EVENTS.NOTIFICATION, {
            message: 'Дебат deb-1 завершён',
            type: 'success',
            source: 'debate',
        });
        await bridge.destroy();
    });

    it('ошибка дебата даёт error-уведомление', async () => {
        const bus = fakeBus();
        const bridge = new DomainNotificationBridge({ eventBus: bus });
        await bridge.init();
        bus.handlers[EVENTS.DEBATE_SESSION_FAILED]?.({ sessionId: 'deb-2', error: 'timeout' });
        expect(bus.emit).toHaveBeenCalledWith(
            EVENTS.NOTIFICATION,
            expect.objectContaining({ type: 'error', source: 'debate' }),
        );
        expect(bus.emit.mock.calls[0]?.[1]).toMatchObject({
            message: expect.stringContaining('timeout'),
        });
    });

    it('опровержение кристалла и повышение памяти тоже уведомляют', async () => {
        const bus = fakeBus();
        const bridge = new DomainNotificationBridge({ eventBus: bus });
        await bridge.init();
        bus.handlers[EVENTS.CRYSTAL_REFUTED]?.({ crystalId: 'cr-1', reason: 'contradiction' });
        bus.handlers[EVENTS.MEMORY_PROMOTED]?.({ memoryId: 'mem-1', tier: 'long' });

        expect(bus.emit).toHaveBeenCalledTimes(2);
        expect(bus.emit.mock.calls[0]?.[1]).toMatchObject({ type: 'warning', source: 'crystal' });
        expect(bus.emit.mock.calls[1]?.[1]).toMatchObject({ type: 'info', source: 'memory' });
    });

    it('не эмитирует NOTIFICATION при чтении самого NOTIFICATION', async () => {
        const bus = fakeBus();
        const bridge = new DomainNotificationBridge({ eventBus: bus });
        await bridge.init();
        await bridge.destroy();
        expect(bus.handlers[EVENTS.NOTIFICATION]).toBeUndefined();
        expect(bus.emit).not.toHaveBeenCalled();
    });
});
