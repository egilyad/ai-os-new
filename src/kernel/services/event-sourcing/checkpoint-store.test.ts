import { describe, it, expect, vi } from 'vitest';
import { CheckpointStore } from './checkpoint-store';
import type { CheckpointPersistenceStore, Checkpoint } from './checkpoint-store';

function makeStore(initial: Checkpoint[] | null = null): CheckpointPersistenceStore & {
    saved: Checkpoint[][];
} {
    const saved: Checkpoint[][] = [];
    let loaded = initial;
    return {
        saved,
        load: vi.fn(async () => loaded),
        save: vi.fn(async (checkpoints: Checkpoint[]) => {
            saved.push(checkpoints);
            loaded = checkpoints;
        }),
    };
}

function cp(id: string, sequence: number): Checkpoint {
    return { id, label: `cp-${sequence}`, sequence, timestamp: 1, stateSnapshot: { id } };
}

describe('CheckpointStore (P1-16 race hardening)', () => {
    it('create during async init is not lost by the restore', async () => {
        let releaseLoad!: () => void;
        const loadGate = new Promise<void>((resolve) => {
            releaseLoad = resolve;
        });
        const store = {
            saved: [] as Checkpoint[][],
            load: vi.fn(async () => {
                await loadGate;
                return [cp('persisted-1', 1)];
            }),
            save: vi.fn(async (checkpoints: Checkpoint[]) => {
                store.saved.push(checkpoints);
            }),
        };

        const svc = new CheckpointStore({ maxCheckpoints: 50 }, store);
        const initPromise = svc.init();
        // Create while load() is still pending.
        svc.create('live', 2, {});
        releaseLoad();
        await initPromise;

        const ids = svc.getAll().map((c) => c.id);
        expect(ids).toContain('live');
        expect(ids).toContain('persisted-1');
    });

    it('concurrent creates serialize and the final persisted set is complete', async () => {
        const store = makeStore();
        const svc = new CheckpointStore({ maxCheckpoints: 50 }, store);
        await svc.init();

        svc.create('a', 1, {});
        svc.create('b', 2, {});
        svc.create('c', 3, {});
        // Allow the persist chain to drain.
        await new Promise((resolve) => setTimeout(resolve, 0));
        await new Promise((resolve) => setTimeout(resolve, 0));

        const lastSaved = store.saved[store.saved.length - 1]!;
        expect(lastSaved.map((c) => c.label).sort()).toEqual(['a', 'b', 'c']);
    });
});
