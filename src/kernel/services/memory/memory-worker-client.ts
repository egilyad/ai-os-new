import type { MemoryEntry } from '../../types/memory-types';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('MemoryEngine');

const WORKER_URL = new URL('../../workers/memory.worker.ts', import.meta.url).href;

export const MEMORY_PENDING_TIMEOUT_MS = 30_000;

interface PendingRequest {
    resolve: (value: { type: string; payload: unknown }) => void;
    reject: (reason?: unknown) => void;
    timerId?: ReturnType<typeof setTimeout>;
}

export interface MemoryWorkerClientHooks {
    /** Called when the worker replies with an `insert` message carrying an embedding. */
    onBackfill?: (id: string, vector: number[]) => void;
}

/**
 * MemoryWorkerClient — RPC wrapper around the memory.worker.ts Web Worker.
 *
 * Encapsulates worker lifecycle (ensure/init/terminate), request-id correlation
 * with a per-request timeout, and routing of unsolicited `insert` replies to a
 * backfill hook. M-4: pending requests are rejected on destroy.
 */
export class MemoryWorkerClient {
    private worker: Worker | null = null;
    private workerInitPromise: Promise<void> | null = null;
    private pendingRequests = new Map<string, PendingRequest>();
    private isDbReady = false;
    private readonly PENDING_TIMEOUT_MS = MEMORY_PENDING_TIMEOUT_MS;
    private hooks: MemoryWorkerClientHooks;

    constructor(hooks: MemoryWorkerClientHooks = {}) {
        this.hooks = hooks;
    }

    get ready(): boolean {
        return this.worker !== null;
    }

    get dbReady(): boolean {
        return this.isDbReady;
    }

    async ensure(initialMemories: MemoryEntry[]): Promise<void> {
        if (this.worker) return;
        if (this.workerInitPromise) return this.workerInitPromise;
        this.workerInitPromise = this.initWorker(initialMemories);
        try {
            return await this.workerInitPromise;
        } finally {
            if (!this.worker) this.workerInitPromise = null;
        }
    }

    private async initWorker(initialMemories: MemoryEntry[]): Promise<void> {
        try {
            const worker = new Worker(WORKER_URL, { type: 'module' });
            worker.onmessage = (e) => this.handleWorkerMessage(e);
            worker.onerror = (e) => LOGGER.error('MemoryEngine', 'Worker error', { error: e });
            this.worker = worker;
            await this.send('init', { memories: initialMemories });
            this.isDbReady = true;
        } catch (e) {
            LOGGER.warn('MemoryEngine', 'Worker not available, using local search', { error: e });
            this.worker?.terminate();
            this.worker = null;
            this.workerInitPromise = null;
            this.isDbReady = false;
        }
    }

    send(type: string, payload?: unknown): Promise<{ type: string; payload: unknown }> {
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error('Worker not available'));
                return;
            }
            const requestId = crypto.randomUUID();
            const timerId = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(
                        new Error(
                            `Worker request ${type} timed out after ${this.PENDING_TIMEOUT_MS}ms`,
                        ),
                    );
                }
            }, this.PENDING_TIMEOUT_MS);
            this.pendingRequests.set(requestId, { resolve, reject, timerId });
            this.worker.postMessage({ requestId, type, payload });
        });
    }

    private handleWorkerMessage(event: MessageEvent) {
        const { requestId, type, payload } = event.data;
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
            if (pending.timerId) clearTimeout(pending.timerId);
            this.pendingRequests.delete(requestId);
            if (type === 'error') {
                pending.reject(new Error(payload?.message));
            } else {
                pending.resolve({ type, payload });
            }
        } else if (type === 'insert' && payload?.embedding) {
            this.hooks.onBackfill?.(payload.id, payload.embedding);
        }
    }

    /** M-4: reject all pending requests before terminating the worker. */
    destroy(): void {
        for (const [, req] of this.pendingRequests) {
            if (req.timerId) clearTimeout(req.timerId);
            req.reject(new Error('MemoryEngine destroyed'));
        }
        this.pendingRequests.clear();
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.workerInitPromise = null;
        this.isDbReady = false;
    }
}
