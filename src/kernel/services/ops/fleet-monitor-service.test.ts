import { describe, it, expect, vi } from 'vitest';
import { FleetMonitorService } from './fleet-monitor-service';
import type { MissionWatch } from '../../types/ops-types';

function makeRepo() {
    const watches: MissionWatch[] = [];
    return {
        watches,
        listWatches: vi.fn(async () => [...watches]),
        putWatch: vi.fn(async (w: MissionWatch) => {
            const i = watches.findIndex((x) => x.id === w.id);
            if (i === -1) watches.push(w);
            else watches[i] = w;
        }),
        deleteWatch: vi.fn(async (id: string) => {
            const i = watches.findIndex((x) => x.id === id);
            if (i !== -1) watches.splice(i, 1);
        }),
    };
}

function makeDeps() {
    const repo = makeRepo();
    const events = {
        emit: vi.fn(),
        on: vi.fn(() => () => {}),
        onSafe: vi.fn(() => () => {}),
    };
    return { repo, events };
}

describe('FleetMonitorService', () => {
    it('watch creates a watching mission and returns it', async () => {
        const { repo, events } = makeDeps();
        const svc = new FleetMonitorService(repo as never, events as never);
        const w = await svc.watch('crew', 'crew-1', 'Crew 1');
        expect(w.kind).toBe('crew');
        expect(w.status).toBe('watching');
        expect(await svc.list()).toHaveLength(1);
        // second watch for same pair returns existing
        const again = await svc.watch('crew', 'crew-1');
        expect(again.id).toBe(w.id);
    });

    it('unwatch removes the mission', async () => {
        const { repo, events } = makeDeps();
        const svc = new FleetMonitorService(repo as never, events as never);
        const w = await svc.watch('graph', 'graph-1');
        await svc.unwatch(w.id);
        expect(await svc.list()).toHaveLength(0);
    });

    it('snapshot groups missions by status', async () => {
        const { repo, events } = makeDeps();
        const svc = new FleetMonitorService(repo as never, events as never);
        await svc.watch('crew', 'c1');
        await svc.watch('council', 'c2');
        const snap = await svc.snapshot();
        expect(snap.missions).toHaveLength(2);
        expect(snap.counts['watching']).toBe(2);
    });
});
