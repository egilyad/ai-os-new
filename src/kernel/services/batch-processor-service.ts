const STORAGE_KEY = 'batch_jobs';

let nextJobId = Date.now();
function generateJobId(): string {
    return `batch-${nextJobId++}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface BatchTask {
    prompt: string;
    provider: string;
    model: string;
}

export interface BatchResult {
    prompt: string;
    provider: string;
    model: string;
    response: string;
    latency: number;
    tokens: number;
    error?: string;
    status: 'success' | 'error';
}

export interface BatchJob {
    id: string;
    label: string;
    tasks: BatchTask[];
    status: 'pending' | 'running' | 'completed' | 'cancelled' | 'failed';
    results: BatchResult[];
    total: number;
    completed: number;
    failed: number;
    createdAt: number;
    completedAt?: number;
}

import type { ILifecycle } from '../contracts/lifecycle';
import type { IDeadLetterQueue } from '../contracts/dead-letter-queue';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
const BATCH_LOGGER = rootLogger.child('BatchProcessorService');

const MAX_JOBS = 20;

export class BatchProcessorService implements ILifecycle {
    private jobs: BatchJob[] = [];
    private currentAbort: AbortController | null = null;
    private loaded = false;
    private deadLetterQueue?: IDeadLetterQueue;

    constructor(opts?: { deadLetterQueue?: IDeadLetterQueue }) {
        this.deadLetterQueue = opts?.deadLetterQueue;
    }

    async init(): Promise<void> {
        // Lazy init via ensureLoaded() — nothing to do upfront
    }

    async destroy(): Promise<void> {
        this.cancelJob();
    }

    private async db(): Promise<import('../types/interfaces').IDatabaseService> {
        const { database } = await import('../instances/core-references');
        return database;
    }

    private async ensureLoaded(): Promise<void> {
        if (this.loaded) return;
        const d = await this.db();
        const saved = await d.getKv<BatchJob[]>(STORAGE_KEY);
        this.jobs = saved ?? [];
        this.loaded = true;
    }

    private async persist(): Promise<void> {
        const d = await this.db();
        await d.setKv(STORAGE_KEY, this.jobs.slice(-MAX_JOBS));
    }

    async getJobs(): Promise<BatchJob[]> {
        await this.ensureLoaded();
        return [...this.jobs].reverse();
    }

    async getJob(id: string): Promise<BatchJob | undefined> {
        await this.ensureLoaded();
        return this.jobs.find((j) => j.id === id);
    }

    async createJob(label: string, tasks: BatchTask[]): Promise<BatchJob> {
        await this.ensureLoaded();
        const job: BatchJob = {
            id: generateJobId(),
            label,
            tasks,
            status: 'pending',
            results: [],
            total: tasks.length,
            completed: 0,
            failed: 0,
            createdAt: Date.now(),
        };
        this.jobs.push(job);
        await this.persist();
        return job;
    }

    async runJob(jobId: string, onProgress?: (job: BatchJob) => void): Promise<BatchJob> {
        await this.ensureLoaded();
        const job = this.jobs.find((j) => j.id === jobId);
        if (!job) throw new Error(`Job ${jobId} not found`);

        const { adapterRegistry, keyService, eventBus } =
            await import('../instances/core-references');
        const abortController = new AbortController();
        this.currentAbort = abortController;

        job.status = 'running';
        await this.persist();

        const allKeys = keyService.getKeys();
        const keyRotationIndex: Record<string, number> = {};

        const CONCURRENCY = 5;
        const TASK_TIMEOUT_MS = 60_000;
        const MAX_RETRIES = 3;
        const RETRY_DELAY_MS = 1_000;
        const dlq = this.deadLetterQueue;

        async function processTask(task: BatchTask, signal: AbortSignal): Promise<BatchResult> {
            const startTime = Date.now();
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const adapter = adapterRegistry.getAdapter(task.provider);
                    if (!adapter)
                        throw new Error(`Adapter not found for provider: ${task.provider}`);

                    const providerKeys = allKeys.filter((k) => k.provider === task.provider);
                    if (providerKeys.length === 0)
                        throw new Error(`No key found for provider: ${task.provider}`);
                    const idx = (keyRotationIndex[task.provider] ?? 0) % providerKeys.length;
                    keyRotationIndex[task.provider] = idx + 1;
                    const key = providerKeys[idx]!;

                    const response = await adapter.sendMessage(
                        [{ role: 'user', content: task.prompt }],
                        task.model,
                        key.key,
                        signal,
                        { temperature: 0.7, maxOutputTokens: 1024 },
                    );

                    return {
                        prompt: task.prompt,
                        provider: task.provider,
                        model: task.model,
                        response: response.content ?? '',
                        latency: Date.now() - startTime,
                        tokens: response.tokens ?? 0,
                        status: 'success',
                    };
                } catch (err) {
                    if (attempt < MAX_RETRIES && !signal.aborted) {
                        const jitter = 0.5 + Math.random() * 0.5;
                        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt * jitter));
                        continue;
                    }
                    eventBus?.emit(EVENTS.QUEUE_TASK_FAILED, {
                        taskId: `${task.provider}:${task.model}`,
                        priority: 'batch',
                        error: String(err),
                        timestamp: Date.now(),
                    });
                    if (dlq) {
                        dlq.push({
                            event: 'batch:task_failed',
                            payload: { task, attempt },
                            error: String(err),
                            context: { jobId },
                            retryCount: attempt - 1,
                        }).catch((dlqErr) => {
                            BATCH_LOGGER.error('BatchProcessorService', 'DLQ push failed', {
                                error: dlqErr,
                            });
                        });
                    }
                    return {
                        prompt: task.prompt,
                        provider: task.provider,
                        model: task.model,
                        response: '',
                        latency: Date.now() - startTime,
                        tokens: 0,
                        error: String(err),
                        status: 'error',
                    };
                }
            }
            // Unreachable — either returned success, or returned error after exhausting retries
            throw new Error('unreachable');
        }

        try {
            const tasks = job.tasks.slice();
            for (let i = 0; i < tasks.length && !abortController.signal.aborted; i += CONCURRENCY) {
                const chunk = tasks.slice(i, i + CONCURRENCY);
                const timeout = new Promise<BatchResult>((_, reject) => {
                    const t = setTimeout(() => reject(new Error('Task timeout')), TASK_TIMEOUT_MS);
                    abortController.signal.addEventListener(
                        'abort',
                        () => {
                            clearTimeout(t);
                            reject(new Error('Cancelled'));
                        },
                        { once: true },
                    );
                });
                const chunkResults = await Promise.allSettled(
                    chunk.map((task) =>
                        Promise.race([processTask(task, abortController.signal), timeout]),
                    ),
                );
                for (const r of chunkResults) {
                    if (r.status === 'fulfilled') {
                        job.results.push(r.value);
                        if (r.value.status === 'success') job.completed++;
                        else job.failed++;
                    } else {
                        job.results.push({
                            prompt: '',
                            provider: '',
                            model: '',
                            response: '',
                            latency: 0,
                            tokens: 0,
                            error: r.reason instanceof Error ? r.reason.message : String(r.reason),
                            status: 'error',
                        });
                        job.failed++;
                    }
                }
                onProgress?.(job);
            }

            if (job.status === 'running') {
                job.status = 'completed';
            }
            job.completedAt = Date.now();
        } finally {
            this.currentAbort = null;
        }
        await this.persist();
        return job;
    }

    cancelJob(): void {
        this.currentAbort?.abort();
        this.currentAbort = null;
    }

    async clearHistory(): Promise<void> {
        this.jobs = [];
        this.loaded = true;
        const d = await this.db();
        await d.setKv(STORAGE_KEY, []);
    }
}
