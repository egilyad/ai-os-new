import type { MemoryEntry } from '../../types/memory-types';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('MemoryEngine');

export interface MemoryPruneSchedulerDeps {
    ttlMs: () => number;
    intervalMs: () => number;
    getMemories: () => MemoryEntry[];
    setMemories: (memories: MemoryEntry[]) => void;
    pruneRepo: (cutoff: number) => Promise<void>;
    removeFromWorker: (id: string) => Promise<void>;
    withLock: <T>(fn: () => Promise<T>) => Promise<T>;
    emitUpdated: () => void;
}

/**
 * MemoryPruneScheduler — TTL-based background pruning.
 *
 * Runs a periodic prune cycle that removes entries older than the TTL both from
 * the repository and from the in-memory cache + worker. Cleanup on destroy().
 */
export class MemoryPruneScheduler {
    private interval: ReturnType<typeof setInterval> | null = null;
    private deps: MemoryPruneSchedulerDeps;

    constructor(deps: MemoryPruneSchedulerDeps) {
        this.deps = deps;
    }

    start(): void {
        this.stop();
        this.interval = setInterval(() => this.pruneOldEntries(), this.deps.intervalMs());
    }

    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /** ILifecycle-compatible cleanup: stops the background timer. */
    destroy(): void {
        this.stop();
    }

    async pruneOldEntries(): Promise<void> {
        try {
            const cutoff = Date.now() - this.deps.ttlMs();
            const removed = this.deps
                .getMemories()
                .filter((m) => (m.metadata.timestamp ?? 0) < cutoff);
            await this.deps.pruneRepo(cutoff);
            await this.deps.withLock(async () => {
                this.deps.setMemories(
                    this.deps.getMemories().filter((m) => (m.metadata.timestamp ?? 0) >= cutoff),
                );
                await Promise.allSettled(
                    removed.map((m) =>
                        this.deps.removeFromWorker(m.id).catch((e: unknown) => {
                            LOGGER.warn('MemoryEngine', 'Worker remove during prune failed', {
                                error: e,
                            });
                        }),
                    ),
                );
                this.deps.emitUpdated();
            });
        } catch (e) {
            LOGGER.error('MemoryEngine', 'Prune cycle failed', { error: e });
        }
    }
}
