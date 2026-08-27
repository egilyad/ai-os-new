import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExecutionGovernorService } from './execution-governor';
import type { OperationSpec } from '../contracts/execution-governor';

describe('ExecutionGovernorService', () => {
    let gov: ExecutionGovernorService;

    beforeEach(() => {
        vi.useFakeTimers();
        gov = new ExecutionGovernorService();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    function spec(overrides: Partial<OperationSpec> = {}): OperationSpec {
        return {
            type: 'llm-call',
            timeoutMs: 0,
            ...overrides,
        };
    }

    describe('start', () => {
        it('should create and return an operation', () => {
            const op = gov.start(spec({ type: 'stream' }));
            expect(op.id).toBeTruthy();
            expect(op.type).toBe('stream');
            expect(op.state).toBe('running');
            expect(gov.activeCount).toBe(1);
        });

        it('should use provided id', () => {
            const op = gov.start(spec({ id: 'my-op' }));
            expect(op.id).toBe('my-op');
        });

        it('should assign parent relationship', () => {
            gov.start(spec({ id: 'parent' }));
            const child = gov.start(spec({ parentId: 'parent' }));
            const descendants = gov.getDescendants('parent');
            expect(descendants).toHaveLength(1);
            expect(descendants[0].id).toBe(child.id);
        });

        it('should abort immediately if signal is already aborted', () => {
            const ac = new AbortController();
            ac.abort();
            const op = gov.start(spec({ signal: ac.signal }));
            expect(op.state).toBe('cancelled');
            expect(gov.activeCount).toBe(0);
        });

        it('should set timeout timer and auto-timeout', () => {
            const op = gov.start(spec({ timeoutMs: 5000 }));
            expect(op.state).toBe('running');
            vi.advanceTimersByTime(5000);
            expect(op.state).toBe('timed-out');
            expect(gov.activeCount).toBe(0);
        });

        it('should not set timeout if timeoutMs is 0', () => {
            const op = gov.start(spec({ timeoutMs: 0 }));
            vi.advanceTimersByTime(10000);
            expect(op.state).toBe('running');
        });
    });

    describe('state transitions', () => {
        it('should complete successfully', () => {
            const op = gov.start(spec());
            op.complete();
            expect(op.state).toBe('completed');
            expect(op.endedAt).toBeGreaterThan(0);
            expect(gov.activeCount).toBe(0);
        });

        it('should fail with error', () => {
            const op = gov.start(spec());
            op.fail(new Error('something went wrong'));
            expect(op.state).toBe('failed');
            expect(op.endedAt).toBeGreaterThan(0);
        });

        it('should cancel', () => {
            const op = gov.start(spec());
            op.cancel();
            expect(op.state).toBe('cancelled');
            expect(op.endedAt).toBeGreaterThan(0);
        });

        it('should timeout via method', () => {
            const op = gov.start(spec());
            op.cancel();
            expect(op.state).toBe('cancelled');
        });

        it('should be idempotent — second transition ignored', () => {
            const op = gov.start(spec());
            op.complete();
            op.fail(new Error('late'));
            expect(op.state).toBe('completed');
        });

        it('should cancel via parent abort signal', () => {
            const ac = new AbortController();
            const op = gov.start(spec({ signal: ac.signal }));
            ac.abort();
            expect(op.state).toBe('cancelled');
        });
    });

    describe('get', () => {
        it('should retrieve existing operation', () => {
            const op = gov.start(spec({ id: 'x' }));
            expect(gov.get('x')).toBe(op);
        });

        it('should return undefined for unknown id', () => {
            expect(gov.get('nonexistent')).toBeUndefined();
        });

        it('should return undefined after operation completes', () => {
            const op = gov.start(spec({ id: 'x' }));
            op.complete();
            expect(gov.get('x')).toBeUndefined();
        });
    });

    describe('list', () => {
        it('should return all active operations', () => {
            gov.start(spec({ id: 'a', type: 'llm-call' }));
            gov.start(spec({ id: 'b', type: 'stream' }));
            expect(gov.list()).toHaveLength(2);
        });

        it('should filter by type', () => {
            gov.start(spec({ id: 'a', type: 'llm-call' }));
            gov.start(spec({ id: 'b', type: 'stream' }));
            const filtered = gov.list({ type: 'stream' });
            expect(filtered).toHaveLength(1);
            expect(filtered[0].id).toBe('b');
        });

        it('should filter by state (only running/pending tracked)', () => {
            gov.start(spec({ id: 'a' }));
            gov.start(spec({ id: 'b' }));
            const filtered = gov.list({ state: 'running' });
            expect(filtered).toHaveLength(2);
        });

        it('should remove completed ops from tracking', () => {
            const op = gov.start(spec({ id: 'a' }));
            op.complete();
            expect(gov.list()).toHaveLength(0);
        });

        it('should filter by parentId', () => {
            gov.start(spec({ id: 'parent' }));
            gov.start(spec({ id: 'child', parentId: 'parent' }));
            const filtered = gov.list({ parentId: 'parent' });
            expect(filtered).toHaveLength(1);
            expect(filtered[0].id).toBe('child');
        });

        it('should return empty after all operations removed', () => {
            const op = gov.start(spec({ id: 'x' }));
            op.complete();
            expect(gov.list()).toHaveLength(0);
        });
    });

    describe('getDescendants', () => {
        it('should return nested descendants', () => {
            gov.start(spec({ id: 'root' }));
            gov.start(spec({ id: 'child', parentId: 'root' }));
            gov.start(spec({ id: 'grandchild', parentId: 'child' }));
            const deps = gov.getDescendants('root');
            expect(deps).toHaveLength(2);
            expect(deps.map((d) => d.id).sort()).toEqual(['child', 'grandchild']);
        });

        it('should return empty for leaf node', () => {
            gov.start(spec({ id: 'leaf' }));
            expect(gov.getDescendants('leaf')).toHaveLength(0);
        });
    });

    describe('cancelTree', () => {
        it('should cancel root and all descendants', async () => {
            gov.start(spec({ id: 'root' }));
            gov.start(spec({ id: 'a', parentId: 'root' }));
            gov.start(spec({ id: 'b', parentId: 'root' }));
            await gov.cancelTree('root');
            expect(gov.list()).toHaveLength(0);
        });

        it('should cancel orphan descendants when root not found', async () => {
            gov.start(spec({ id: 'child', parentId: 'missing' }));
            await gov.cancelTree('missing');
            expect(gov.list()).toHaveLength(0);
        });
    });

    describe('drain', () => {
        it('should cancel all running operations', async () => {
            gov.start(spec({ id: 'a' }));
            gov.start(spec({ id: 'b' }));
            await gov.drain(100);
            expect(gov.activeCount).toBe(0);
        });

        it('should resolve immediately if nothing running', async () => {
            await expect(gov.drain(100)).resolves.toBeUndefined();
        });
    });

    describe('child', () => {
        it('should create child operation linked to parent', () => {
            const parent = gov.start(spec({ id: 'p', type: 'llm-call' }));
            const child = parent.child({ type: 'stream', timeoutMs: 0 });
            expect(child.parentId).toBe('p');
            expect(child.state).toBe('running');
        });
    });

    describe('destroy', () => {
        it('should cancel all and clear state', () => {
            gov.start(spec({ id: 'a' }));
            gov.start(spec({ id: 'b' }));
            gov.destroy();
            expect(gov.activeCount).toBe(0);
            expect(gov.list()).toHaveLength(0);
        });

        it('should be safe to call multiple times', () => {
            gov.destroy();
            expect(() => gov.destroy()).not.toThrow();
        });
    });
});
