/**
 * MemoryAccessTracker — debounced write-back of `metadata.lastAccessed`.
 *
 * Retrieval must record that an entry was used, otherwise the Ebbinghaus
 * ranking and sleep consolidation (which read `lastAccessed ?? timestamp`)
 * never see repeated access — no spacing effect. Touching every hit on every
 * search would hammer Dexie, so marks are coalesced and flushed once per window.
 */
import type { MemoryEntry } from '../../types/memory-types';

export const ACCESS_DEBOUNCE_MS = 2000;

export interface MemoryAccessTrackerDeps {
    get: (id: string) => MemoryEntry | undefined;
    save: (entry: MemoryEntry) => Promise<void>;
    /** Called with the touched entries after a flush (e.g. to sync the worker). */
    onFlush?: (entries: MemoryEntry[]) => void;
    now?: () => number;
    debounceMs?: number;
    setTimer?: (fn: () => void, ms: number) => unknown;
    clearTimer?: (handle: unknown) => void;
}

export class MemoryAccessTracker {
    private readonly pending = new Map<string, number>();
    private timer: unknown;
    private readonly now: () => number;
    private readonly debounceMs: number;
    private readonly setTimer: (fn: () => void, ms: number) => unknown;
    private readonly clearTimer: (handle: unknown) => void;

    constructor(private readonly deps: MemoryAccessTrackerDeps) {
        this.now = deps.now ?? Date.now;
        this.debounceMs = deps.debounceMs ?? ACCESS_DEBOUNCE_MS;
        this.setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
        this.clearTimer =
            deps.clearTimer ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));
    }

    /** Mark entries as accessed now; schedules a single flush. */
    touch(ids: ReadonlyArray<string>): void {
        if (ids.length === 0) return;
        const at = this.now();
        for (const id of ids) {
            // Record the access timestamp in `pending`; the entry itself is not
            // relied on across flush, so an upsert between touch and flush cannot
            // drop the access mark.
            this.pending.set(id, at);
        }
        if (this.pending.size === 0) return;
        if (this.timer === undefined) {
            this.timer = this.setTimer(() => {
                this.timer = undefined;
                void this.flush();
            }, this.debounceMs);
        }
    }

    /** Persist all pending marks immediately (also called by the timer). */
    async flush(): Promise<void> {
        if (this.pending.size === 0) return;
        const pending = [...this.pending.entries()];
        this.pending.clear();
        const entries: MemoryEntry[] = [];
        for (const [id, at] of pending) {
            const entry = this.deps.get(id);
            if (!entry) continue;
            entry.metadata.lastAccessed = at;
            entries.push(entry);
        }
        for (const entry of entries) {
            try {
                await this.deps.save(entry);
            } catch {
                // Best-effort: a failed touch must never break retrieval.
            }
        }
        if (entries.length > 0) this.deps.onFlush?.(entries);
    }

    destroy(): void {
        if (this.timer !== undefined) {
            this.clearTimer(this.timer);
            this.timer = undefined;
        }
        this.pending.clear();
    }
}
