import { describe, it, expect, vi } from 'vitest';
import { persistThenEmit, Outbox } from './persist-then-emit';

describe('persistThenEmit', () => {
    it('persists before emitting and returns the persisted value', async () => {
        const order: string[] = [];
        const persist = vi.fn(async () => {
            order.push('persist');
            return 42;
        });
        const emit = vi.fn(() => order.push('emit'));
        await expect(persistThenEmit(persist, emit)).resolves.toBe(42);
        expect(order).toEqual(['persist', 'emit']);
    });
});

describe('Outbox', () => {
    it('commits persists then emits in order', async () => {
        const outbox = new Outbox();
        const order: string[] = [];
        outbox.deferPersist(async () => {
            order.push('persist');
        });
        outbox.deferEmit('event:1', { a: 1 });
        outbox.deferEmit('event:2');
        const bus = { emit: vi.fn((event: string) => order.push(`emit:${event}`)) };
        await outbox.commit(bus);
        expect(order).toEqual(['persist', 'emit:event:1', 'emit:event:2']);
        expect(bus.emit).toHaveBeenNthCalledWith(1, 'event:1', { a: 1 });
    });

    it('tracks pending state and clears', () => {
        const outbox = new Outbox();
        expect(outbox.hasPending).toBe(false);
        outbox.deferEmit('e');
        expect(outbox.hasPending).toBe(true);
        outbox.clear();
        expect(outbox.hasPending).toBe(false);
    });
});
