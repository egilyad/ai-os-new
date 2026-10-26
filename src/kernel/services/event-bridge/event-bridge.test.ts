import { describe, expect, it } from 'vitest';
import { EventBridge } from './event-bridge';
import { ProjectionRegistry } from './projection-registry';
import type { KernelEvent } from '../../contracts/event-log';

function fakeBus() {
    const listeners: Array<(p: { event: string; data: unknown }) => void> = [];
    return {
        subscribeAll: (fn: (p: { event: string; data: unknown }) => void) => {
            listeners.push(fn);
            return () => {
                const i = listeners.indexOf(fn);
                if (i >= 0) listeners.splice(i, 1);
            };
        },
        emit: (event: string, data: unknown) => {
            for (const l of [...listeners]) l({ event, data });
        },
        __listeners: listeners,
    };
}

describe('EventBridge', () => {
    it('assigns monotonically increasing seq to dispatched kernel events (E8)', () => {
        const bus = fakeBus() as ReturnType<typeof fakeBus>;
        const registry = new ProjectionRegistry();
        const seen: KernelEvent[] = [];
        registry.register({
            reduce: (e: KernelEvent) => {
                seen.push(e);
            },
            getState: () => ({}),
            reset: () => {},
        } as never);

        const bridge = new EventBridge(bus as never, registry);
        bridge.start();
        // cognitive events are skipped
        bus.emit('cognitive:trace:updated', {});
        bus.emit('chat:stream:chunk', { i: 1 });
        bus.emit('key:state:changed', { k: 2 });

        expect(seen.map((e) => e.seq)).toEqual([1, 2]);
        expect(seen[0]).toMatchObject({ type: 'chat:stream:chunk', payload: { i: 1 } });
        expect(seen[1]).toMatchObject({ type: 'key:state:changed', payload: { k: 2 } });
        bridge.destroy();
    });

    it('replays buffered pre-start events with increasing seq', () => {
        const bus = fakeBus() as ReturnType<typeof fakeBus>;
        const registry = new ProjectionRegistry();
        const seen: KernelEvent[] = [];
        registry.register({
            reduce: (e: KernelEvent) => {
                seen.push(e);
            },
            getState: () => ({}),
            reset: () => {},
        } as never);

        const bridge = new EventBridge(bus as never, registry);
        bridge.bufferEvent('a:event', { v: 1 });
        bridge.start();
        bus.emit('b:event', { v: 2 });

        expect(seen.map((e) => e.seq)).toEqual([1, 2]);
        expect(seen[0]).toMatchObject({ type: 'a:event', payload: { v: 1 } });
        bridge.destroy();
    });
});
