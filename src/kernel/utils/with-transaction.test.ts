import { describe, expect, it } from 'vitest';
import { withTransaction } from './with-transaction';

describe('withTransaction', () => {
    it('commits and returns the result on success', async () => {
        const events: string[] = [];
        const result = await withTransaction('test', async (tx) => {
            tx.onCommit(() => events.push('committed'));
            return 42;
        }, { emit: (e) => events.push(e) });
        expect(result).toBe(42);
        expect(events).toContain('committed');
    });

    it('rolls back and rethrows on failure', async () => {
        const events: string[] = [];
        await expect(
            withTransaction(
                'test',
                async (tx) => {
                    tx.onRollback(() => events.push('rolledback'));
                    throw new Error('boom');
                },
                { emit: (e) => events.push(e) },
            ),
        ).rejects.toThrow('boom');
        expect(events).toContain('rolledback');
    });

    it('emit deferred events on commit', async () => {
        const events: string[] = [];
        await withTransaction(
            'test',
            async (tx) => {
                tx.deferEmit('my:event', { ok: true });
                return 'ok';
            },
            { emit: (e, d) => events.push(`${e}:${JSON.stringify(d)}`) },
        );
        expect(events).toContain('my:event:{"ok":true}');
    });
});
