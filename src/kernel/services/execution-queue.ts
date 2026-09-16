import { EVENTS } from '../events/event-names';
import type { IEventBus } from '../types/interfaces';
import type { IDeadLetterQueue } from '../contracts/dead-letter-queue';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ExecutionQueue');

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
    private maxConcurrency: number;
    private schedulerTimer: ReturnType<typeof setTimeout> | null = null;
    private processor: (task: QueueTask) => Promise<void>;
    private totalEnqueued = 0;
    private totalProcessed = 0;
    private totalErrors = 0;
    private deadLetterQueue?: IDeadLetterQueue;
    private _eventBus: IEventBus | null = null;

    constructor(
        processor: (task: QueueTask) => Promise<void>,
        maxConcurrency = 3,
        deadLetterQueue?: IDeadLetterQueue,
        eventBus?: IEventBus,
    ) {
        this.processor = processor;
        this.maxConcurrency = maxConcurrency;
        this.deadLetterQueue = deadLetterQueue;
        this._eventBus = eventBus ?? null;
    }

    enqueue(priority: QueuePriority, payload: unknown): string {
        const id = `q-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
        this.queues[priority].push({ id, priority, payload, enqueuedAt: Date.now() });
        this.totalEnqueued++;
        this.schedule();
        return id;
    }

    private schedule() {
        if (this.schedulerTimer) return;
        this.schedulerTimer = setTimeout(() => {
            this.schedulerTimer = null;
            this.drain();
        }, 0);
    }

    private drain() {
        if (this._draining) return;
        this._draining = true;
        try {
            while (this.inFlight < this.maxConcurrency) {
                const task = this.dequeueHighest();
                if (!task) break;
                this.inFlight++;
                this.processor(task)
                    .then(() => {
                        this.totalProcessed++;
                    })
                    .catch((err) => {
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
                                LOGGER.error('ExecutionQueue', 'DLQ push failed', {
                                    error: dlqErr,
                                }),
                            );
                    })
                    .finally(() => {
                        this.inFlight--;
                        try {
                            this.drain();
                        } catch (e) {
                            LOGGER.error('ExecutionQueue', 'drain failed', { error: e });
                        }
                    });
            }
        } finally {
            this._draining = false;
        }
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
        if (this.schedulerTimer) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        this.clear();
        this.inFlight = 0;
        this._draining = false;
    }
}
