import { EVENTS } from '../events/event-names';
import type { SystemState } from '../types/metrics-types';
import type { ISTopology } from '../contracts/topology';
import { rootLogger } from './logger-service';
import { safeJsonParse } from '../../kernel/utils/safe-json';
import { SystemSnapshotSchema } from '../types/schema-types';
import { ssrSafeStorage } from '../utils/ssr-storage';

const LOGGER = rootLogger.child('SnapshotService');

export interface RuntimeState {
    kernel: SystemState;
    topology: unknown;
    disabledNodes: string[];
    memoryCount: number;
}

export interface SystemSnapshot {
    id: string;
    traceId: string;
    stepId: string;
    timestamp: number;
    schemaVersion: number;
    label?: string;
    tags?: string[];
    runtime: RuntimeState;
    metadata?: Record<string, unknown>;
}

const CURRENT_SCHEMA_VERSION = 1;

export interface SnapshotDiff {
    id: string;
    snapshotA: string;
    snapshotB: string;
    timestamp: number;
    differences: {
        path: string;
        before: unknown;
        after: unknown;
    }[];
}

export interface SnapshotServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    memoryStore?: { count(): Promise<number> };
    kernel: { getState: () => SystemState; loadState: (json: string) => void };
    orchestrator: {
        getActiveTopology: () => ISTopology | null;
        mount: (topology: ISTopology) => void;
        isNodeDisabled: (id: string) => boolean;
        clearCache?: () => void;
        setNodeDisabled?: (id: string, disabled: boolean) => void;
    };
}

const STORAGE_KEY = 'super_agents_snapshots';
const MAX_SNAPSHOTS = 100;

export class SnapshotService {
    private snapshots: SystemSnapshot[] = [];
    private diffs: SnapshotDiff[] = [];
    private replayIndex: number = -1;
    private unsubs: Array<() => void> = [];
    private autoCaptureInterval: ReturnType<typeof setInterval> | null = null;
    private deps: SnapshotServiceDeps;
    private _pendingSave: Promise<void> = Promise.resolve();
    /** @internal C-94: Debounce guard — only one save() every 2s */
    private _saveTimer: ReturnType<typeof setTimeout> | null = null;
    private _saveQueued = false;
    /** @internal C-94: Throttle guard — skip duplicate (traceId, nodeId) within 1s */
    private _lastStepTimestamps = new Map<string, number>();
    private _replaying = false;
    /** Max step captures per second — prevents burst from COGNITIVE_STEP_COMPLETED */
    private static readonly STEP_THROTTLE_MS = 1000;

    constructor(deps: SnapshotServiceDeps) {
        this.deps = deps;
    }

    private _initialized = false;

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        this.setupListeners();
        await this.load();
    }

    async destroy() {
        this._initialized = false;
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }
        await this.flush();
        this.unsubs.forEach((u) => u());
        if (this.autoCaptureInterval) {
            clearInterval(this.autoCaptureInterval);
        }
    }

    private setupListeners() {
        this.unsubs.push(
            this.deps.eventBus.onSafe<{ traceId: string; nodeId: string }>(
                EVENTS.COGNITIVE_STEP_COMPLETED,
                async (d) => {
                    if (d.traceId && d.nodeId) {
                        try {
                            await this.capture(d.traceId, d.nodeId);
                        } catch (e) {
                            LOGGER.warn('SnapshotService', 'Auto-capture failed', { error: e });
                        }
                    }
                },
            ),
        );
    }

    startAutoCapture(intervalMs = 60000) {
        this.stopAutoCapture();
        this.autoCaptureInterval = setInterval(async () => {
            try {
                await this.capture(
                    'auto',
                    'auto',
                    `Auto-snapshot ${new Date().toLocaleTimeString()}`,
                );
            } catch (e) {
                LOGGER.warn('SnapshotService', 'Auto-capture failed', { error: e });
            }
        }, intervalMs);
    }

    stopAutoCapture() {
        if (this.autoCaptureInterval) {
            clearInterval(this.autoCaptureInterval);
            this.autoCaptureInterval = null;
        }
    }

    private async load() {
        try {
            const saved = await this.deps.database.getKv<{
                snapshots: SystemSnapshot[];
                diffs: SnapshotDiff[];
            }>(STORAGE_KEY);
            if (saved) {
                this.snapshots = saved.snapshots || [];
                this.diffs = saved.diffs || [];
            }
        } catch (e) {
            LOGGER.warn('SnapshotService', 'Failed to load', { error: e });
        }
    }

    private async save(retries = 2): Promise<void> {
        try {
            await this.deps.database.setKv(STORAGE_KEY, {
                snapshots: this.snapshots,
                diffs: this.diffs,
            });
        } catch (e) {
            LOGGER.warn('SnapshotService', 'Failed to save', { error: e, retries });
            if (retries > 0) {
                await new Promise((r) => setTimeout(r, 500));
                return this.save(retries - 1);
            }
        }
    }

    /** @internal C-94: Debounced persistence — coalesces multiple captures into one write */
    private scheduleSave(): void {
        // C-19: Write-ahead log — update on every call (even if already queued) so WAL is never stale
        try {
            ssrSafeStorage.setItem(
                'snapshots:wal',
                JSON.stringify({
                    snapshots: this.snapshots,
                    diffs: this.diffs,
                }),
            );
        } catch {
            /* localStorage full — non-critical */
        }
        if (this._saveQueued) return;
        this._saveQueued = true;
        this._saveTimer = setTimeout(() => {
            this._saveQueued = false;
            this._saveTimer = null;
            this._pendingSave = this.save();
        }, 2000);
    }

    /** @internal C-94: Throttle check — skip if same (traceId, stepId) within 1s */
    private shouldThrottleStep(traceId: string, stepId: string): boolean {
        const key = `${traceId}::${stepId}`;
        const last = this._lastStepTimestamps.get(key);
        const now = Date.now();
        if (last && now - last < SnapshotService.STEP_THROTTLE_MS) return true;
        this._lastStepTimestamps.set(key, now);
        // Prune stale entries once every 50 inserts
        if (this._lastStepTimestamps.size > 50) {
            const cutoff = now - 5000;
            for (const [k, ts] of this._lastStepTimestamps) {
                if (ts < cutoff) this._lastStepTimestamps.delete(k);
            }
        }
        return false;
    }

    async capture(traceId: string, stepId: string, label?: string): Promise<SystemSnapshot> {
        // C-94: Throttle — skip duplicate events within 1s
        if (this.shouldThrottleStep(traceId, stepId)) {
            return this.snapshots[this.snapshots.length - 1]!;
        }

        const top = this.deps.orchestrator.getActiveTopology();
        const disabledNodes =
            top?.nodes
                .filter((n) => this.deps.orchestrator.isNodeDisabled(n.id))
                .map((n) => n.id) ?? [];
        const runtime: RuntimeState = {
            kernel: this.deps.kernel.getState(),
            topology: top,
            disabledNodes,
            memoryCount: this.deps.memoryStore ? await this.deps.memoryStore.count() : 0,
        };

        const snapshot: SystemSnapshot = {
            id: crypto.randomUUID(),
            traceId,
            stepId,
            timestamp: Date.now(),
            schemaVersion: CURRENT_SCHEMA_VERSION,
            label,
            runtime,
        };

        this.snapshots.push(snapshot);
        if (this.snapshots.length > MAX_SNAPSHOTS) {
            this.snapshots = this.snapshots.slice(-MAX_SNAPSHOTS);
        }

        // C-94: Debounce persistence instead of writing every capture
        this.scheduleSave();
        this.deps.eventBus.emit(EVENTS.SNAPSHOT_CAPTURED, snapshot);
        return snapshot;
    }

    async flush(): Promise<void> {
        // C-94: Flush the debounced save if queued
        if (this._saveQueued) {
            this._saveQueued = false;
            await this.save();
        } else {
            await this._pendingSave;
        }
    }

    restore(snapshot: SystemSnapshot): boolean {
        try {
            // H-21: Validate snapshot shape via Zod before accessing fields
            const parsed = SystemSnapshotSchema.safeParse(snapshot);
            if (!parsed.success) {
                LOGGER.error('SnapshotService', 'Restore failed — snapshot shape invalid', {
                    errors: parsed.error.flatten(),
                });
                return false;
            }
            if (snapshot.schemaVersion > CURRENT_SCHEMA_VERSION) {
                LOGGER.error(
                    'SnapshotService',
                    `Cannot restore snapshot from future schema v${snapshot.schemaVersion} (current: v${CURRENT_SCHEMA_VERSION})`,
                );
                return false;
            }
            if (snapshot.schemaVersion !== CURRENT_SCHEMA_VERSION) {
                LOGGER.warn(
                    'SnapshotService',
                    `Restoring snapshot with schema v${snapshot.schemaVersion} (current: v${CURRENT_SCHEMA_VERSION})`,
                );
            }
            this.deps.kernel.loadState(JSON.stringify({ state: snapshot.runtime.kernel }));
            if (snapshot.runtime.topology) {
                this.deps.orchestrator.mount(snapshot.runtime.topology as ISTopology);
            }
            this.deps.orchestrator.clearCache?.();
            // C-82: restore disabled nodes — first re-enable nodes that should be active, then disable
            const newTop = this.deps.orchestrator.getActiveTopology();
            if (newTop && snapshot.runtime.disabledNodes?.length) {
                const disabledSet = new Set(snapshot.runtime.disabledNodes);
                for (const node of newTop.nodes) {
                    if (!disabledSet.has(node.id)) {
                        this.deps.orchestrator.setNodeDisabled?.(node.id, false);
                    }
                }
                for (const nodeId of snapshot.runtime.disabledNodes) {
                    this.deps.orchestrator.setNodeDisabled?.(nodeId, true);
                }
            }
            this.deps.eventBus.emit(EVENTS.CACHE_INVALIDATED, { reason: 'snapshot:restore' });
            this.deps.eventBus.emit(EVENTS.SNAPSHOT_RESTORED, {
                snapshotId: snapshot.id,
                timestamp: Date.now(),
            });
            return true;
        } catch (e) {
            LOGGER.error('SnapshotService', 'Restore failed', { error: e });
            return false;
        }
    }

    restoreById(snapshotId: string): boolean {
        const snapshot = this.snapshots.find((s) => s.id === snapshotId);
        if (!snapshot) return false;
        return this.restore(snapshot);
    }

    private deepDiff(
        path: string,
        a: unknown,
        b: unknown,
        differences: SnapshotDiff['differences'],
        visited?: Set<object>,
    ): void {
        if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
            if (!visited) visited = new Set<object>();
            if (visited.has(a as object) || visited.has(b as object)) return;
            visited.add(a as object);
            visited.add(b as object);
            const aObj = a as Record<string, unknown>;
            const bObj = b as Record<string, unknown>;
            const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
            for (const key of allKeys) {
                this.deepDiff(`${path}.${key}`, aObj[key], bObj[key], differences, visited);
            }
            return;
        }
        if (a !== b) {
            differences.push({ path, before: a, after: b });
        }
    }

    compare(snapshotAId: string, snapshotBId: string): SnapshotDiff | null {
        const a = this.snapshots.find((s) => s.id === snapshotAId);
        const b = this.snapshots.find((s) => s.id === snapshotBId);
        if (!a || !b) return null;

        const differences: SnapshotDiff['differences'] = [];
        this.deepDiff('kernel', a.runtime.kernel, b.runtime.kernel, differences);
        if (a.runtime.topology || b.runtime.topology) {
            this.deepDiff('topology', a.runtime.topology, b.runtime.topology, differences);
        }

        const diff: SnapshotDiff = {
            id: `diff-${crypto.randomUUID()}`,
            snapshotA: snapshotAId,
            snapshotB: snapshotBId,
            timestamp: Date.now(),
            differences,
        };
        this.diffs.push(diff);
        if (this.diffs.length > 100) this.diffs = this.diffs.slice(-100);
        void this.scheduleSave();
        return diff;
    }

    search(query: string): SystemSnapshot[] {
        const q = query.toLowerCase();
        return this.snapshots.filter(
            (s) =>
                (s.label && s.label.toLowerCase().includes(q)) ||
                s.traceId.toLowerCase().includes(q) ||
                s.id.toLowerCase().includes(q) ||
                (s.tags && s.tags.some((t) => t.toLowerCase().includes(q))),
        );
    }

    tagSnapshot(id: string, tags: string[]) {
        const snapshot = this.snapshots.find((s) => s.id === id);
        if (snapshot) {
            const updated = {
                ...snapshot,
                tags: [...new Set([...(snapshot.tags || []), ...tags])],
            };
            const idx = this.snapshots.indexOf(snapshot);
            this.snapshots[idx] = updated;
            void this.scheduleSave();
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Snapshot ${snapshot.label || snapshot.id} tagged`,
                type: 'info',
            });
            this.deps.eventBus.emit(EVENTS.SNAPSHOT_CAPTURED, updated);
        }
    }

    getSnapshotsForTrace(traceId: string): SystemSnapshot[] {
        return this.snapshots.filter((s) => s.traceId === traceId);
    }

    getAll(): SystemSnapshot[] {
        return [...this.snapshots];
    }

    getLatest(): SystemSnapshot | null {
        return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1]! : null;
    }

    getRecent(count = 10): SystemSnapshot[] {
        return this.snapshots.slice(-count).reverse();
    }

    clear() {
        this.snapshots = [];
        this.diffs = [];
        this.replayIndex = -1;
        void this.scheduleSave();
    }

    startReplay(): boolean {
        if (this._replaying || this.snapshots.length === 0) return false;
        this._replaying = true;
        this.replayIndex = 0;
        const ok = this.restore(this.snapshots[0]!);
        if (!ok) this._replaying = false;
        return ok;
    }

    replayNext(): boolean {
        // B10-39: Use >= comparison, not = assignment
        if (
            !this._replaying ||
            this.replayIndex < 0 ||
            this.replayIndex >= this.snapshots.length - 1
        )
            return false;
        this.replayIndex++;
        return this.restore(this.snapshots[this.replayIndex]!);
    }

    replayPrev(): boolean {
        // B10-40: Use <= comparison, not = assignment; decrement index; call restore()
        if (!this._replaying || this.replayIndex <= 0) return false;
        this.replayIndex--;
        return this.restore(this.snapshots[this.replayIndex]!);
    }

    stopReplay(): void {
        this._replaying = false;
        this.replayIndex = -1;
    }

    getReplayIndex(): number {
        return this.replayIndex;
    }

    getReplaySnapshot(): SystemSnapshot | null {
        if (this.replayIndex < 0 || this.replayIndex >= this.snapshots.length) return null;
        return this.snapshots[this.replayIndex]!;
    }

    removeSnapshot(id: string) {
        this.snapshots = this.snapshots.filter((s) => s.id !== id);
        void this.scheduleSave();
    }

    exportSnapshots(): string {
        return JSON.stringify({ snapshots: this.snapshots }, null, 2);
    }

    importSnapshots(jsonData: string): number {
        try {
            const data = safeJsonParse(jsonData) as Record<string, unknown> | undefined;
            const imported = ((data as Record<string, unknown>)?.snapshots as unknown[]) || [];
            let count = 0;
            for (const snap of imported) {
                const parsed = SystemSnapshotSchema.safeParse(snap);
                if (!parsed.success) {
                    LOGGER.warn('SnapshotService', 'Skipping invalid snapshot during import', {
                        error: parsed.error,
                    });
                    continue;
                }
                if (!this.snapshots.some((s) => s.id === parsed.data.id)) {
                    this.snapshots.push(parsed.data as unknown as SystemSnapshot);
                    if (this.snapshots.length > MAX_SNAPSHOTS) {
                        this.snapshots = this.snapshots.slice(-MAX_SNAPSHOTS);
                    }
                    count++;
                }
            }
            void this.scheduleSave();
            return count;
        } catch (e) {
            LOGGER.warn('SnapshotService', 'Failed to import snapshots', { error: e });
            return 0;
        }
    }

    async createSnapshot(label: string): Promise<SystemSnapshot> {
        return this.capture('admin', 'backup', label);
    }
}
