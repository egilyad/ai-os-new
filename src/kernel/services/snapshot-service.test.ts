import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SnapshotService } from './snapshot-service';
import type { SystemSnapshot, SnapshotServiceDeps } from './snapshot-service';

function createDeps(overrides?: Partial<SnapshotServiceDeps>): SnapshotServiceDeps {
    return {
        eventBus: {
            on: vi.fn(() => vi.fn()),
            onSafe: vi.fn(() => vi.fn()),
            emit: vi.fn(),
        },
        database: {
            getKv: vi.fn().mockResolvedValue(null),
            setKv: vi.fn().mockResolvedValue(undefined),
        },
        memoryStore: { count: vi.fn().mockResolvedValue(42) },
        kernel: {
            getState: vi.fn(() => ({ health: 'ok' }) as Record<string, unknown>),
            loadState: vi.fn(),
        },
        orchestrator: {
            getActiveTopology: vi.fn(() => ({
                nodes: [{ id: 'node-1' }, { id: 'node-2' }],
            })),
            mount: vi.fn(),
            isNodeDisabled: vi.fn(() => false),
            clearCache: vi.fn(),
            setNodeDisabled: vi.fn(),
        },
        ...overrides,
    } as SnapshotServiceDeps;
}

function makeSnapshot(overrides?: Partial<SystemSnapshot>): SystemSnapshot {
    return {
        id: 'snap-1',
        traceId: 'trace-1',
        stepId: 'step-1',
        timestamp: 1000,
        schemaVersion: 1,
        label: 'test-snapshot',
        tags: ['tag1'],
        runtime: {
            kernel: { health: 'ok' },
            topology: null,
            disabledNodes: [],
            memoryCount: 0,
        },
        ...overrides,
    } as SystemSnapshot;
}

describe('SnapshotService', () => {
    let deps: ReturnType<typeof createDeps>;
    let service: SnapshotService;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(1000);
        deps = createDeps();
        service = new SnapshotService(deps);
        await service.init();
    });

    afterEach(async () => {
        vi.useRealTimers();
        await service.destroy();
    });

    describe('init', () => {
        it('loads snapshots from database', async () => {
            const saved = { snapshots: [makeSnapshot()], diffs: [] };
            deps = createDeps({
                database: { getKv: vi.fn().mockResolvedValue(saved), setKv: vi.fn() },
            });
            service = new SnapshotService(deps);
            await service.init();
            expect(service.getAll()).toHaveLength(1);
        });

        it('is idempotent', async () => {
            const spy = deps.database.getKv;
            await service.init();
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('subscribes to COGNITIVE_STEP_COMPLETED', () => {
            expect(deps.eventBus.onSafe).toHaveBeenCalledWith(
                'cognitive:step:completed',
                expect.any(Function),
            );
        });
    });

    describe('capture', () => {
        it('creates a snapshot with correct shape', async () => {
            const snap = await service.capture('trace-1', 'step-1', 'test');
            expect(snap.traceId).toBe('trace-1');
            expect(snap.stepId).toBe('step-1');
            expect(snap.label).toBe('test');
            expect(snap.schemaVersion).toBe(1);
            expect(snap.timestamp).toBe(1000);
            expect(snap.id).toBeDefined();
            expect(snap.runtime.kernel).toBeDefined();
        });

        it('adds snapshot to internal list', async () => {
            await service.capture('t1', 's1');
            expect(service.getAll()).toHaveLength(1);
        });

        it('throttles duplicate (traceId, stepId) within 1 second', async () => {
            await service.capture('t1', 's1');
            await service.capture('t1', 's1');
            expect(service.getAll()).toHaveLength(1);
        });

        it('does not throttle different traceId', async () => {
            await service.capture('t1', 's1');
            await service.capture('t2', 's1');
            expect(service.getAll()).toHaveLength(2);
        });

        it('does not throttle after 1 second', async () => {
            await service.capture('t1', 's1');
            vi.advanceTimersByTime(1500);
            await service.capture('t1', 's1');
            expect(service.getAll()).toHaveLength(2);
        });

        it('limits snapshots to MAX_SNAPSHOTS (100)', async () => {
            for (let i = 0; i < 110; i++) {
                vi.advanceTimersByTime(1100);
                await service.capture(`t${i}`, `s${i}`);
            }
            expect(service.getAll()).toHaveLength(100);
        });

        it('emits SNAPSHOT_CAPTURED event', async () => {
            const snap = await service.capture('t1', 's1');
            expect(deps.eventBus.emit).toHaveBeenCalledWith('snapshot:captured', snap);
        });

        it('includes disabled nodes in runtime', async () => {
            deps.orchestrator.isNodeDisabled = vi.fn((id: string) => id === 'node-2');
            const snap = await service.capture('t1', 's1');
            expect(snap.runtime.disabledNodes).toContain('node-2');
        });

        it('captures memory count from memoryStore', async () => {
            const snap = await service.capture('t1', 's1');
            expect(snap.runtime.memoryCount).toBe(42);
        });
    });

    describe('queries', () => {
        beforeEach(async () => {
            vi.advanceTimersByTime(1100);
            await service.capture('t1', 's1');
            vi.advanceTimersByTime(1100);
            await service.capture('t1', 's2');
            vi.advanceTimersByTime(1100);
            await service.capture('t2', 's1', 'labeled');
        });

        it('getAll returns all snapshots', () => {
            expect(service.getAll()).toHaveLength(3);
        });

        it('getLatest returns most recent', () => {
            const latest = service.getLatest();
            expect(latest?.label).toBe('labeled');
        });

        it('getRecent returns last N in reverse order', () => {
            const recent = service.getRecent(2);
            expect(recent).toHaveLength(2);
            expect(recent[0].label).toBe('labeled');
            expect(recent[1].stepId).toBe('s2');
        });

        it('getSnapshotsForTrace filters by traceId', () => {
            const snaps = service.getSnapshotsForTrace('t1');
            expect(snaps).toHaveLength(2);
        });
    });

    describe('search', () => {
        beforeEach(async () => {
            await service.capture('t1', 's1', 'alpha');
            vi.advanceTimersByTime(1100);
            await service.capture('t2', 's2', 'beta-test');
        });

        it('finds by label', () => {
            expect(service.search('alpha')).toHaveLength(1);
        });

        it('finds by traceId', () => {
            expect(service.search('t1')).toHaveLength(1);
        });

        it('finds by tags', () => {
            const snap = service.getAll()[0];
            service.tagSnapshot(snap.id, ['urgent']);
            expect(service.search('urgent')).toHaveLength(1);
        });

        it('case-insensitive', () => {
            expect(service.search('ALPHA')).toHaveLength(1);
        });

        it('returns empty for no match', () => {
            expect(service.search('nonexistent')).toHaveLength(0);
        });
    });

    describe('removeSnapshot', () => {
        it('removes snapshot by id', async () => {
            const snap = await service.capture('t1', 's1');
            expect(service.getAll()).toHaveLength(1);
            service.removeSnapshot(snap.id);
            expect(service.getAll()).toHaveLength(0);
        });

        it('does nothing for unknown id', () => {
            service.removeSnapshot('unknown');
            expect(service.getAll()).toHaveLength(0);
        });
    });

    describe('tagSnapshot', () => {
        it('merges tags with existing', async () => {
            const snap = await service.capture('t1', 's1');
            service.tagSnapshot(snap.id, ['tag1']);
            service.tagSnapshot(snap.id, ['tag2']);
            const updated = service.getAll()[0];
            expect(updated.tags).toContain('tag1');
            expect(updated.tags).toContain('tag2');
        });

        it('emits NOTIFICATION and SNAPSHOT_CAPTURED', async () => {
            const snap = await service.capture('t1', 's1');
            service.tagSnapshot(snap.id, ['new-tag']);
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                'system:notification',
                expect.objectContaining({ type: 'info' }),
            );
            expect(deps.eventBus.emit).toHaveBeenLastCalledWith(
                'snapshot:captured',
                expect.objectContaining({ id: snap.id }),
            );
        });

        it('emits NOTIFICATION and SNAPSHOT_CAPTURED', async () => {
            const snap = await service.capture('t1', 's1');
            service.tagSnapshot(snap.id, ['new-tag']);
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                'system:notification',
                expect.objectContaining({ type: 'info' }),
            );
            expect(deps.eventBus.emit).toHaveBeenLastCalledWith(
                'snapshot:captured',
                expect.objectContaining({ id: snap.id }),
            );
        });
    });

    describe('restore', () => {
        it('restores kernel state and topology', () => {
            const snap = makeSnapshot({
                runtime: {
                    kernel: { memory: 'test' } as never,
                    topology: { nodes: [] },
                    disabledNodes: [],
                    memoryCount: 0,
                },
            });
            const result = service.restore(snap);
            expect(result).toBe(true);
            expect(deps.kernel.loadState).toHaveBeenCalled();
            expect(deps.orchestrator.mount).toHaveBeenCalled();
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                'cache:invalidated',
                expect.any(Object),
            );
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                'snapshot:restored',
                expect.objectContaining({ snapshotId: snap.id }),
            );
        });

        it('returns false for invalid snapshot shape', () => {
            const invalid = { id: 123 } as unknown as SystemSnapshot;
            expect(service.restore(invalid)).toBe(false);
        });

        it('returns false for future schema version', () => {
            const snap = makeSnapshot({ schemaVersion: 99 });
            expect(service.restore(snap)).toBe(false);
        });

        it('restores disabled nodes', () => {
            const snap = makeSnapshot({
                runtime: {
                    kernel: {} as never,
                    topology: { nodes: [{ id: 'node-1' }, { id: 'node-2' }] },
                    disabledNodes: ['node-2'],
                    memoryCount: 0,
                },
            });
            service.restore(snap);
            expect(deps.orchestrator.setNodeDisabled).toHaveBeenCalledWith('node-2', true);
        });
    });

    describe('restoreById', () => {
        it('restores snapshot by id', async () => {
            const snap = await service.capture('t1', 's1');
            const result = service.restoreById(snap.id);
            expect(result).toBe(true);
        });

        it('returns false for unknown id', () => {
            expect(service.restoreById('unknown')).toBe(false);
        });
    });

    describe('compare', () => {
        it('returns null if either snapshot not found', () => {
            expect(service.compare('nonexistent', 'nonexistent')).toBeNull();
        });

        it('creates SnapshotDiff between two snapshots', async () => {
            const a = await service.capture('t1', 's1');
            vi.advanceTimersByTime(1100);
            const b = await service.capture('t2', 's2');
            const diff = service.compare(a.id, b.id);
            expect(diff).not.toBeNull();
            expect(diff!.snapshotA).toBe(a.id);
            expect(diff!.snapshotB).toBe(b.id);
            expect(diff!.id).toContain('diff-');
            expect(diff!.differences).toBeDefined();
        });
    });

    describe('clear', () => {
        it('removes all snapshots and diffs', async () => {
            await service.capture('t1', 's1');
            expect(service.getAll()).toHaveLength(1);
            service.clear();
            expect(service.getAll()).toHaveLength(0);
        });
    });

    describe('replay', () => {
        beforeEach(async () => {
            await service.capture('t1', 's1');
            vi.advanceTimersByTime(1100);
            await service.capture('t2', 's2');
        });

        it('startReplay restores first snapshot', () => {
            const result = service.startReplay();
            expect(result).toBe(true);
            expect(deps.kernel.loadState).toHaveBeenCalled();
        });

        it('startReplay returns false if already replaying', () => {
            service.startReplay();
            expect(service.startReplay()).toBe(false);
        });

        it('replayNext advances and restores next snapshot', () => {
            service.startReplay();
            const result = service.replayNext();
            expect(result).toBe(true);
            expect(service.getReplayIndex()).toBe(1);
        });

        it('replayPrev goes back', () => {
            service.startReplay();
            service.replayNext();
            const result = service.replayPrev();
            expect(result).toBe(true);
            expect(service.getReplayIndex()).toBe(0);
        });

        it('replayNext returns false at end', () => {
            service.startReplay();
            service.replayNext();
            expect(service.replayNext()).toBe(false);
        });

        it('replayPrev returns false at start', () => {
            service.startReplay();
            expect(service.replayPrev()).toBe(false);
        });

        it('stopReplay resets state', () => {
            service.startReplay();
            service.stopReplay();
            expect(service.getReplayIndex()).toBe(-1);
        });

        it('getReplaySnapshot returns current snapshot', () => {
            service.startReplay();
            const snap = service.getReplaySnapshot();
            expect(snap?.stepId).toBe('s1');
        });

        it('getReplaySnapshot returns null outside replay', () => {
            expect(service.getReplaySnapshot()).toBeNull();
        });
    });

    describe('import/export', () => {
        it('exportSnapshots returns JSON string', async () => {
            await service.capture('t1', 's1');
            const json = service.exportSnapshots();
            expect(() => JSON.parse(json)).not.toThrow();
        });

        it('importSnapshots adds valid snapshots', () => {
            const json = JSON.stringify({ snapshots: [makeSnapshot({ id: 'imported-1' })] });
            const count = service.importSnapshots(json);
            expect(count).toBe(1);
            expect(service.getAll()).toHaveLength(1);
        });

        it('importSnapshots skips duplicates', () => {
            const json = JSON.stringify({ snapshots: [makeSnapshot({ id: 'dup-1' })] });
            service.importSnapshots(json);
            expect(service.importSnapshots(json)).toBe(0);
        });

        it('importSnapshots returns 0 for invalid JSON', () => {
            expect(service.importSnapshots('not json')).toBe(0);
        });
    });

    describe('autoCapture', () => {
        it('startAutoCapture calls capture on interval', () => {
            vi.spyOn(service, 'capture' as keyof SnapshotService).mockResolvedValue(makeSnapshot());
            service.startAutoCapture(5000);
            expect(vi.getTimerCount()).toBeGreaterThan(0);
        });

        it('stopAutoCapture clears interval', () => {
            service.startAutoCapture(5000);
            service.stopAutoCapture();
            expect(vi.getTimerCount()).toBe(0);
        });
    });

    describe('destroy', () => {
        it('unsubscribes event listeners', async () => {
            const unsub = vi.fn();
            deps = createDeps({
                eventBus: { on: vi.fn(() => vi.fn()), onSafe: vi.fn(() => unsub), emit: vi.fn() },
            });
            service = new SnapshotService(deps);
            await service.init();
            await service.destroy();
            expect(unsub).toHaveBeenCalled();
        });
    });
});
