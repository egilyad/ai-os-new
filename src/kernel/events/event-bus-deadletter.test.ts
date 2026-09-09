import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from './event-bus';

const FAIL_VALIDATOR = {
    safeParse: () => ({ success: false, error: { issues: [{ message: 'bad payload' }] } }),
};

describe('EventBus dead-letter sink (B-03)', () => {
    let bus: EventBus;
    beforeEach(() => {
        bus = new EventBus(true);
    });

    it('captures a strict-mode validation drop in the dead-letter sink', () => {
        bus.registerValidator('test:drop', FAIL_VALIDATOR);
        bus.emit('test:drop' as never, { foo: 'bar' } as never);
        const dlq = bus.getDeadLetterQueue();
        expect(dlq).toHaveLength(1);
        expect(dlq[0]!.event).toBe('test:drop');
        expect(dlq[0]!.reason).toBe('strict-validation');
    });

    it('does NOT drop on validation failure in non-strict mode and delivers the event', () => {
        const received: unknown[] = [];
        bus.on('test:drop' as never, (d) => received.push(d));
        bus.registerValidator('test:drop', FAIL_VALIDATOR);
        bus.setStrictMode(false);
        bus.emit('test:drop' as never, { foo: 'bar' } as never);
        expect(received).toHaveLength(1);
        expect(bus.getDeadLetterQueue()).toHaveLength(0);
    });

    it('bounds the dead-letter sink to MAX_DEAD_LETTER (evicts oldest)', () => {
        bus.registerValidator('test:drop', FAIL_VALIDATOR);
        for (let i = 0; i < 1001; i++) {
            bus.emit('test:drop' as never, { i } as never);
        }
        const dlq = bus.getDeadLetterQueue();
        expect(dlq).toHaveLength(1000);
        // oldest (i=0) was evicted; most recent (i=1000) is present
        expect(dlq[0]!.data).toStrictEqual({ i: 1 });
    });

    it('drainDeadLetterQueue returns the entries and clears the sink', () => {
        bus.registerValidator('test:drop', FAIL_VALIDATOR);
        bus.emit('test:drop' as never, { a: 1 } as never);
        bus.emit('test:drop' as never, { a: 2 } as never);
        const drained = bus.drainDeadLetterQueue();
        expect(drained).toHaveLength(2);
        expect(bus.getDeadLetterQueue()).toHaveLength(0);
    });

    it('clears the sink on clearAllSubscriptions', () => {
        bus.registerValidator('test:drop', FAIL_VALIDATOR);
        bus.emit('test:drop' as never, { a: 1 } as never);
        expect(bus.getDeadLetterQueue()).toHaveLength(1);
        bus.clearAllSubscriptions();
        expect(bus.getDeadLetterQueue()).toHaveLength(0);
    });
});
