import { EVENTS } from '../events/event-names';
import type { IEventBus } from '../types/interfaces';
import type { IDeadLetterQueue } from '../contracts/dead-letter-queue';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ExecutionQueue');

// W8-017: bound the queue so runaway/compromised agents cannot grow memory
// without limit. Tasks beyond the cap are dropped with a warning.
const MAX_QUEUE_TASKS = 10_000;

export type QueuePriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

interface QueueTask {
    id: string;
    priority: QueuePriority;
    payload: unknown;
    enqueuedAt: number;
}

export class ExecutionQueue {
    private queues: Record<QueuePriority, QueueTask[]> = {
        critical: [],
        high: [],
        normal: [],
        low: [],
        background: [],
    };
    private inFlight = 0;
    private _draining = false;
    private _destroyed = false;
    private maxConcurrency: number;
    private schedulerTimer: ReturnType<typeof setTimeout> | null = null;
    private processor: (task: QueueTask) => Promise<void>;
    private totalEnqueued = 0;
    private totalProcessed = 0;
    private totalErrors = 0;
    private deadLetterQueue?: IDeadLetterQueue;
    private _eventBus: IEventBus | null = null;
    private taskTimeoutMs: number;
    private watchdogs = new Set<ReturnType<typeof setTimeout>>();

    constructor(
        processor: (task: QueueTask) => Promise<void>,
        maxConcurrency = 3,
        deadLetterQueue?: IDeadLetterQueue,
        eventBus?: IEventBus,
        taskTimeoutMs = 120_000,
    ) {
        this.processor = processor;
        this.maxConcurrency = maxConcurrency;
        this.deadLetterQueue = deadLetterQueue;
        this._eventBus = eventBus ?? null;
        this.taskTimeoutMs = taskTimeoutMs;
    }

    enqueue(priority: QueuePriority, payload: unknown): string {
        const id = `q-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
        // No resurrection: tasks enqueued after destroy are dropped instead
        // of restarting the scheduler on a dead queue.
        if (this._destroyed) {
            LOGGER.warn('ExecutionQueue', 'enqueue after destroy — task dropped', {
                priority,
            });
            return id;
        }
        const pending = Object.values(this.queues).reduce((s, q) => s + q.length, 0);
        if (pending >= MAX_QUEUE_TASKS) {
            LOGGER.warn('ExecutionQueue', 'queue full — task dropped', { priority, pending });
            return id;
        }
        this.queues[priority].push({ id, priority, payload, enqueuedAt: Date.now() });
        this.totalEnqueued++;
        this.schedule();
        return id;
    }

    private schedule() {
        if (this._destroyed) return;
        if (this.schedulerTimer) return;
        this.schedulerTimer = setTimeout(() => {
            this.schedulerTimer = null;
            this.drain();
        }, 0);
    }

    private drain() {
        if (this._draining || this._destroyed) return;
        this._draining = true;
        try {
            while (this.inFlight < this.maxConcurrency) {
                const task = this.dequeueHighest();
                if (!task) break;
                this.inFlight++;
                this.runTask(task);
            }
        } finally {
            this._draining = false;
        }
    }

    /** P0-5: run one task with a watchdog. If the processor never settles,
     *  the timer finalizes it (logs, emits, DLQ) and releases the slot so the
     *  queue keeps moving instead of being blocked forever by a hung task. */
    private runTask(task: QueueTask): void {
        let settled = false;
        // True once the watchdog has finalized a hung task — the processor's own
        // late settle must not double-report / double-push DLQ.
        let final = false;
        const timers = { current: undefined as ReturnType<typeof setTimeout> | undefined };
        const release = () => {
            if (settled) return;
            settled = true;
            const t = timers.current;
            if (t !== undefined) {
                clearTimeout(t);
                this.watchdogs.delete(t);
            }
            this.inFlight--;
            try {
                this.drain();
            } catch (e) {
                LOGGER.error('ExecutionQueue', 'drain failed', { error: e });
            }
        };

        const watchdog = setTimeout(() => {
            final = true;
            LOGGER.warn('ExecutionQueue', 'Task hung — watchdog finalized task', {
                taskId: task.id,
                priority: task.priority,
                age: Date.now() - task.enqueuedAt,
                timeoutMs: this.taskTimeoutMs,
            });
            this._eventBus?.emit(EVENTS.QUEUE_TASK_FAILED, {
                taskId: task.id,
                priority: task.priority,
                error: `Task timed out after ${this.taskTimeoutMs}ms`,
                timestamp: Date.now(),
            });
            this.deadLetterQueue
                ?.push({
                    event: EVENTS.QUEUE_TASK_FAILED,
                    payload: {
                        taskId: task.id,
                        priority: task.priority,
                        payload: task.payload,
                    },
                    error: `Task timed out after ${this.taskTimeoutMs}ms`,
                    context: { age: Date.now() - task.enqueuedAt },
                    retryCount: 0,
                })
                .catch((dlqErr) =>
                    LOGGER.error('ExecutionQueue', 'DLQ push failed', { error: dlqErr }),
                );
            release();
        }, this.taskTimeoutMs);
        timers.current = watchdog;
        this.watchdogs.add(watchdog);

        this.processor(task)
            .then(() => {
                if (!final) this.totalProcessed++;
            })
            .catch((err) => {
                if (final) return;
                this.totalErrors++;
                LOGGER.error('ExecutionQueue', 'Task failed', {
                    taskId: task.id,
                    priority: task.priority,
                    age: Date.now() - task.enqueuedAt,
                    error: err,
                });
                this._eventBus?.emit(EVENTS.QUEUE_TASK_FAILED, {
                    taskId: task.id,
                    priority: task.priority,
                    error: String(err),
                    timestamp: Date.now(),
                });
                this.deadLetterQueue
                    ?.push({
                        event: EVENTS.QUEUE_TASK_FAILED,
                        payload: {
                            taskId: task.id,
                            priority: task.priority,
                            payload: task.payload,
                        },
                        error: String(err),
                        context: { age: Date.now() - task.enqueuedAt },
                        retryCount: 0,
                    })
                    .catch((dlqErr) =>
                        LOGGER.error('ExecutionQueue', 'DLQ push failed', { error: dlqErr }),
                    );
            })
            .finally(release);
    }

    private dequeueHighest(): QueueTask | undefined {
        for (const level of [
            'critical',
            'high',
            'normal',
            'low',
            'background',
        ] as QueuePriority[]) {
            if (this.queues[level].length > 0) return this.queues[level].shift();
        }
        return undefined;
    }

    get pending(): number {
        return Object.values(this.queues).reduce((sum, q) => sum + q.length, 0);
    }

    get active(): number {
        return this.inFlight;
    }

    getStats() {
        return {
            pending: this.pending,
            active: this.inFlight,
            totalEnqueued: this.totalEnqueued,
            totalProcessed: this.totalProcessed,
            totalErrors: this.totalErrors,
        };
    }

    getQueuedTasks(): { id: string; priority: QueuePriority; age: number }[] {
        const now = Date.now();
        return Object.entries(this.queues).flatMap(([_p, tasks]) =>
            tasks.map((t) => ({ id: t.id, priority: t.priority, age: now - t.enqueuedAt })),
        );
    }

    clear() {
        for (const q of Object.values(this.queues)) q.length = 0;
    }

    destroy() {
        this._destroyed = true;
        if (this.schedulerTimer) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        for (const t of this.watchdogs) clearTimeout(t);
        this.watchdogs.clear();
        this.clear();
        this.inFlight = 0;
        this._draining = false;
    }
}
