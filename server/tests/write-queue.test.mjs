import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { enqueueDbWrite, __resetWriteQueueForTests } from '../write-queue.mjs';

describe('write-queue (C-6)', () => {
    beforeEach(() => {
        __resetWriteQueueForTests();
    });

    it('a rejected unit does not wedge later units', async () => {
        const order = [];
        const failing = enqueueDbWrite(async () => {
            order.push('fail');
            throw new Error('boom');
        });
        const ok = enqueueDbWrite(async () => {
            order.push('ok');
            return 'second';
        });
        await assert.rejects(failing, /boom/);
        assert.equal(await ok, 'second');
        assert.deepEqual(order, ['fail', 'ok']);
    });

    it('preserves FIFO order across mixed outcomes', async () => {
        const order = [];
        const mk = (name, ms, fail = false) => () =>
            new Promise((resolve, reject) =>
                setTimeout(() => {
                    order.push(name);
                    if (fail) reject(new Error(name));
                    else resolve(name);
                }, ms),
            );
        const results = await Promise.allSettled([
            enqueueDbWrite(mk('a', 30)),
            enqueueDbWrite(mk('b', 5, true)),
            enqueueDbWrite(mk('c', 1)),
        ]);
        assert.deepEqual(order, ['a', 'b', 'c']);
        assert.equal(results[0].status, 'fulfilled');
        assert.equal(results[1].status, 'rejected');
        assert.equal(results[2].status, 'fulfilled');
    });

    it('chain survives back-to-back failures', async () => {
        for (let i = 0; i < 3; i++) {
            await assert.rejects(
                enqueueDbWrite(async () => {
                    throw new Error(`fail-${i}`);
                }),
                new RegExp(`fail-${i}`),
            );
        }
        assert.equal(
            await enqueueDbWrite(async () => 'alive'),
            'alive',
        );
    });
});
