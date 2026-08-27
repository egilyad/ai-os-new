import type { ILifecycle } from '../contracts/lifecycle';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('LifecycleManager');

function getHeapMB(): number {
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    return mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : 0;
}

export interface InitStatus {
    name: string;
    status: 'ok' | 'error' | 'skipped';
    error?: string;
}

interface LifecycleEntry {
    name: string;
    service: ILifecycle;
}

export class LifecycleManager {
    destroy(): void {
        /* no-op — shutdown() handles lifecycle teardown */
    }

    private entries: LifecycleEntry[] = [];
    private statuses: InitStatus[] = [];
    private _initializing = false;
    private _shuttingDown = false;

    register(name: string, service: ILifecycle): void {
        if (this.entries.some((e) => e.name === name)) return;
        this.entries.push({ name, service });
    }

    async initAll(): Promise<void> {
        if (this._initializing) return;
        this._initializing = true;
        try {
            for (const entry of this.entries) {
                await this.tryInit(entry.name, () => entry.service.init());
            }
        } finally {
            this._initializing = false;
        }
    }

    async startAll(): Promise<void> {
        if (this._initializing || this._shuttingDown) return;
        let lastError: Error | undefined;
        for (const entry of this.entries) {
            if (!this.statuses.some((s) => s.name === entry.name && s.status === 'ok')) {
                LOGGER.warn(
                    'LifecycleManager',
                    `Skipping start() for ${entry.name} — init not completed`,
                );
                continue;
            }
            try {
                await entry.service.start?.();
            } catch (e) {
                lastError = e instanceof Error ? e : new Error(String(e));
                LOGGER.error('LifecycleManager', `start() failed for ${entry.name}`, { error: e });
            }
        }
        if (lastError) throw lastError;
    }

    async shutdown(): Promise<void> {
        if (this._shuttingDown) return;
        this._shuttingDown = true;
        const DESTROY_TIMEOUT_MS = 5000;
        try {
            for (const entry of this.entries.slice().reverse()) {
                const status = this.statuses.find((s) => s.name === entry.name);
                if (status && status.status !== 'ok') {
                    LOGGER.warn(
                        'LifecycleManager',
                        `Skipping destroy() for ${entry.name} — init failed or was skipped`,
                    );
                    continue;
                }
                try {
                    await Promise.race([
                        entry.service.destroy(),
                        new Promise<never>((_, reject) =>
                            setTimeout(
                                () =>
                                    reject(
                                        new Error(
                                            `destroy timed out after ${DESTROY_TIMEOUT_MS}ms`,
                                        ),
                                    ),
                                DESTROY_TIMEOUT_MS,
                            ),
                        ),
                    ]);
                } catch (e) {
                    LOGGER.error('LifecycleManager', `Error destroying ${entry.name}`, {
                        error: e,
                    });
                }
            }
        } finally {
            this.entries = [];
            this.statuses = [];
            this._shuttingDown = false;
        }
    }

    async tryInit(name: string, fn: () => Promise<void> | void, retries = 3): Promise<boolean> {
        const maxAttempts = 1 + retries;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await fn();
                this.statuses.push({ name, status: 'ok' });
                return true;
            } catch (e) {
                if (attempt < maxAttempts) {
                    const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    LOGGER.warn(
                        'LifecycleManager',
                        `${name} init attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs}ms...`,
                        { error: e },
                    );
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                } else {
                    const msg = e instanceof Error ? e.message : String(e);
                    this.statuses.push({ name, status: 'error', error: msg });
                    LOGGER.error(
                        'LifecycleManager',
                        `${name} init failed after ${maxAttempts} attempts`,
                        { error: e },
                    );
                }
            }
        }
        return false;
    }

    /**
     * Init a service that may or may not have an init() method. If the service
     * has no init() (e.g. stateless helper that only registered a destroy() no-op),
     * treat the init step as a success and return immediately. This prevents
     * "TypeError: init is not a function" cascades in bootstrap.
     */
    async tryInitIfPresent(
        name: string,
        service: { init?: () => Promise<void> | void },
        retries = 3,
    ): Promise<boolean> {
        if (typeof service.init !== 'function') {
            this.statuses.push({ name, status: 'ok' });
            return true;
        }
        return this.tryInit(name, () => service.init!(), retries);
    }

    async initAllSequential(names?: string[]): Promise<boolean[]> {
        const toInit = names ? this.entries.filter((e) => names.includes(e.name)) : this.entries;

        const results: boolean[] = [];
        let prevHeap = getHeapMB();

        for (const entry of toInit) {
            const ok = await this.tryInit(entry.name, () => entry.service.init());
            results.push(ok);

            const nowHeap = getHeapMB();
            const delta = nowHeap - prevHeap;
            const deltaStr = delta > 0 ? `+${delta}MB` : delta < 0 ? `${delta}MB` : '±0MB';
            LOGGER.info(
                'LifecycleManager',
                `[MEM] ${entry.name}: ${nowHeap}MB total (${deltaStr})`,
            );
            prevHeap = nowHeap;
        }

        return results;
    }

    getStatuses(): InitStatus[] {
        return this.statuses;
    }

    clearStatuses(): void {
        this.statuses = [];
    }

    getEntries(): ReadonlyArray<LifecycleEntry> {
        return this.entries;
    }
}
