import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimeMachineService } from './time-machine-service';
import type { TimeMachineServiceDeps } from './time-machine-service';

function makeDeps(overrides: Partial<TimeMachineServiceDeps> = {}): TimeMachineServiceDeps {
    return {
        eventBus: { emit: vi.fn() },
        ...overrides,
    };
}

describe('TimeMachineService', () => {
    let svc: TimeMachineService;
    let deps: TimeMachineServiceDeps;

    beforeEach(async () => {
        deps = makeDeps();
        svc = new TimeMachineService(deps);
        await svc.init();
    });

    describe('createSnapshot', () => {
        it('should create snapshot with full scope', () => {
            const snap = svc.createSnapshot('test', 'full');
            expect(snap.id).toBeTruthy();
            expect(snap.label).toBe('test');
            expect(snap.scope).toBe('full');
            expect(snap.timestamp).toBeGreaterThan(0);
        });

        it('should create snapshot with config scope', () => {
            const snap = svc.createSnapshot('config backup', 'config');
            expect(snap.scope).toBe('config');
            expect(snap.changes).toContain('Configuration state captured');
        });

        it('should create snapshot with memory scope', () => {
            const snap = svc.createSnapshot('mem', 'memory');
            expect(snap.changes).toContain('Memory state captured');
        });

        it('should create snapshot with keys scope', () => {
            const snap = svc.createSnapshot('keys', 'keys');
            expect(snap.changes).toContain('Key management state captured');
        });

        it('should create snapshot with debates scope', () => {
            const snap = svc.createSnapshot('debates', 'debates');
            expect(snap.changes).toContain('Debate sessions state captured');
        });

        it('should emit event', () => {
            svc.createSnapshot('test', 'full');
            expect(deps.eventBus!.emit).toHaveBeenCalled();
        });

        it('should enforce MAX_SNAPSHOTS limit', () => {
            for (let i = 0; i < 60; i++) {
                svc.createSnapshot(`s${i}`, 'full');
            }
            expect(svc.getSnapshots()).toHaveLength(50);
        });

        it('should call snapshotService for full scope', () => {
            const capture = vi.fn().mockReturnValue({ id: 'snap-1' });
            deps = makeDeps({ snapshotService: { capture, restoreById: vi.fn() } });
            svc = new TimeMachineService(deps);
            const snap = svc.createSnapshot('full test', 'full');
            expect(capture).toHaveBeenCalled();
            expect(snap.snapshotRefId).toBe('snap-1');
        });
    });

    describe('getSnapshots', () => {
        it('should return all snapshots', () => {
            svc.createSnapshot('first', 'full');
            svc.createSnapshot('second', 'full');
            const snaps = svc.getSnapshots();
            expect(snaps).toHaveLength(2);
            expect(snaps.map((s) => s.label).sort()).toEqual(['first', 'second']);
        });

        it('should return a copy', () => {
            svc.createSnapshot('test', 'full');
            const snaps = svc.getSnapshots();
            snaps.pop();
            expect(svc.getSnapshots()).toHaveLength(1);
        });
    });

    describe('restoreSnapshot', () => {
        it('should throw for unknown snapshot', async () => {
            await expect(svc.restoreSnapshot('bad-id')).rejects.toThrow(
                'Snapshot bad-id not found',
            );
        });

        it('should restore snapshot and record last restored id', async () => {
            const snap = svc.createSnapshot('test', 'config');
            await svc.restoreSnapshot(snap.id);
            expect(svc.getLastRestoredId()).toBe(snap.id);
        });

        it('should emit event on restore', async () => {
            const snap = svc.createSnapshot('test', 'full');
            await svc.restoreSnapshot(snap.id);
            expect(deps.eventBus!.emit).toHaveBeenCalledWith(
                expect.stringContaining('restored'),
                expect.objectContaining({ snapshotId: snap.id }),
            );
        });
    });

    describe('deleteSnapshot', () => {
        it('should delete snapshot by id', () => {
            const snap = svc.createSnapshot('test', 'full');
            svc.deleteSnapshot(snap.id);
            expect(svc.getSnapshots()).toHaveLength(0);
        });

        it('should clear last restored id if deleting that snapshot', () => {
            const snap = svc.createSnapshot('test', 'full');
            svc.restoreSnapshot(snap.id);
            svc.deleteSnapshot(snap.id);
            expect(svc.getLastRestoredId()).toBeNull();
        });
    });

    describe('compareSnapshots', () => {
        it('should compare two snapshots', () => {
            const a = svc.createSnapshot('A', 'full');
            const b = svc.createSnapshot('B', 'config');
            const diff = svc.compareSnapshots(a.id, b.id);
            expect(diff.length).toBeGreaterThan(0);
            expect(diff[0].key).toBe('Scope');
            expect(diff[0].before).toBe('full');
            expect(diff[0].after).toBe('config');
        });

        it('should return empty for unknown snapshots', () => {
            expect(svc.compareSnapshots('bad1', 'bad2')).toEqual([]);
        });
    });

    describe('getLastRestoredId', () => {
        it('should return null initially', () => {
            expect(svc.getLastRestoredId()).toBeNull();
        });
    });
});
