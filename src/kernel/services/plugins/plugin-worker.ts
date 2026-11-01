import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('PluginWorker');

const WORKER_URL = new URL('../../workers/plugin.worker.ts', import.meta.url).href;

export const PLUGIN_WORKER_TIMEOUT_MS = 10_000;

interface PendingRequest {
    resolve: (value: { type: string; payload: unknown }) => void;
    reject: (reason?: unknown) => void;
    timerId?: ReturnType<typeof setTimeout>;
}

export interface PluginWorkerRunOptions {
    code: string;
    data?: unknown;
    timeout?: number;
}

/**
 * PluginWorkerClient — RPC-обёртка вокруг plugin.worker.ts (SPEC_06 §3).
 *
 * Изолированное исполнение кода плагинного хендлера в Web Worker: нет доступа
 * к DOM/window/localStorage, сеть — только через executeTool-мост, запросы
 * коррелируются по requestId с таймаутом, pending-запросы отклоняются при destroy.
 */
export class PluginWorkerClient {
    private worker: Worker | null = null;
    private pendingRequests = new Map<string, PendingRequest>();

    get ready(): boolean {
        return this.worker !== null;
    }

    /** Гарантирует наличие воркера (лениво). */
    ensure(): void {
        if (this.worker) return;
        try {
            const worker = new Worker(WORKER_URL, { type: 'module' });
            worker.onmessage = (e) => this.handleWorkerMessage(e);
            worker.onerror = (e) => LOGGER.error('PluginWorker', 'Worker error', { error: e });
            this.worker = worker;
        } catch (e) {
            LOGGER.warn('PluginWorker', 'Worker not available', { error: e });
            this.worker = null;
        }
    }

    /**
     * Выполняет код плагинного хендлера в изолированном воркере.
     * Возвращает результат выполнения (unknown).
     */
    run(options: PluginWorkerRunOptions): Promise<unknown> {
        return new Promise((resolve, reject) => {
            this.ensure();
            if (!this.worker) {
                reject(new Error('PluginWorker not available'));
                return;
            }
            const requestId = crypto.randomUUID();
            const timeoutMs = options.timeout ?? PLUGIN_WORKER_TIMEOUT_MS;
            const timerId = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error(`Plugin worker request timed out after ${timeoutMs}ms`));
                }
            }, timeoutMs);
            this.pendingRequests.set(requestId, {
                resolve: (res) => resolve(res.payload),
                reject,
                timerId,
            });
            this.worker.postMessage({
                requestId,
                type: 'run',
                payload: { code: options.code, data: options.data, timeout: timeoutMs },
            });
        });
    }

    private handleWorkerMessage(event: MessageEvent) {
        const { requestId, type, payload } = event.data;
        const pending = this.pendingRequests.get(requestId);
        if (!pending) return;
        if (pending.timerId) clearTimeout(pending.timerId);
        this.pendingRequests.delete(requestId);
        if (type === 'error') {
            pending.reject(new Error(payload?.message));
        } else {
            pending.resolve({ type, payload });
        }
    }

    /** Отклоняет все pending и терминатует воркер. */
    destroy(): void {
        for (const [, req] of this.pendingRequests) {
            if (req.timerId) clearTimeout(req.timerId);
            req.reject(new Error('PluginWorker destroyed'));
        }
        this.pendingRequests.clear();
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}
