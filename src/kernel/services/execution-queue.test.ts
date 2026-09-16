import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExecutionQueue } from './execution-queue';
import type { QueuePriority } from './execution-queue';

describe('ExecutionQueue', () => {
    let queue: ExecutionQueue;
    let processor: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();
        processor = vi.fn().mockResolvedValue(undefined);
        queue = new ExecutionQueue(processor as unknown as (task: unknown) => Promise<void>, 3);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('enqueue and processing', () => {
        it('should enqueue with generated id', () => {
            const id = queue.enqueue('normal', 'test');
            expect(id).toBeTruthy();
            expect(typeof id).toBe('string');
        });

        it('should process enqueued tasks', async () => {
            queue.enqueue('normal', { foo: 'bar' });
            await vi.runAllTimersAsync();
            expect(processor).toHaveBeenCalledTimes(1);
            expect(processor).toHaveBeenCalledWith(
                expect.objectContaining({ payload: { foo: 'bar' }, priority: 'normal' }),
            );
        });

        it('should respect max concurrency', async () => {
            processor.mockImplementation(() => new Promise(() => {}));
            queue.enqueue('normal', 'a');
            queue.enqueue('normal', 'b');
            queue.enqueue('normal', 'c');
            queue.enqueue('normal', 'd');
            await vi.runAllTimersAsync();
            expect(queue.active).toBe(3);
            expect(queue.pending).toBe(1);
        });

        it('should process tasks in priority order', async () => {
            const order: string[] = [];
            processor.mockImplementation(async (task: { id: string; priority: QueuePriority }) => {
                order.push(task.priority);
            });
            queue.enqueue('low', 'l');
            queue.enqueue('high', 'h');
            queue.enqueue('critical', 'c');
            queue.enqueue('normal', 'n');
            queue.enqueue('background', 'b');
            await vi.runAllTimersAsync();
            expect(order).toEqual(['critical', 'high', 'normal', 'low', 'background']);
        });
    });

    describe('stats', () => {
        it('should report zero stats initially', () => {
            const stats = queue.getStats();
            expect(stats.pending).toBe(0);
            expect(stats.active).toBe(0);
            expect(stats.totalEnqueued).toBe(0);
        });

        it('should update stats after processing', async () => {
            processor.mockResolvedValue(undefined);
            queue.enqueue('normal', 'x');
            await vi.runAllTimersAsync();
            const stats = queue.getStats();
            expect(stats.totalEnqueued).toBe(1);
            expect(stats.totalProcessed).toBe(1);
            expect(stats.pending).toBe(0);
        });

        it('should track errors', async () => {
            processor.mockRejectedValue(new Error('fail'));
            queue.enqueue('normal', 'x');
            await vi.runAllTimersAsync();
            const stats = queue.getStats();
            expect(stats.totalErrors).toBe(1);
        });
    });

    describe('getQueuedTasks', () => {
        it('should return queued tasks with age', () => {
            queue.enqueue('normal', 'x');
            queue.enqueue('high', 'y');
            const tasks = queue.getQueuedTasks();
            expect(tasks).toHaveLength(2);
            expect(tasks.some((t) => t.priority === 'high')).toBe(true);
            expect(tasks.some((t) => t.priority === 'normal')).toBe(true);
            tasks.forEach((t) => expect(t.age).toBeGreaterThanOrEqual(0));
        });
    });

    describe('clear', () => {
        it('should clear all pending tasks', () => {
            queue.enqueue('normal', 'x');
            queue.enqueue('high', 'y');
            queue.clear();
            expect(queue.pending).toBe(0);
        });
    });

    describe('destroy', () => {
        it('should clear all state', () => {
            queue.enqueue('normal', 'x');
            queue.destroy();
            expect(queue.pending).toBe(0);
            expect(queue.active).toBe(0);
        });

        it('should be safe to call multiple times', () => {
            queue.destroy();
            expect(() => queue.destroy()).not.toThrow();
        });
    });
});
