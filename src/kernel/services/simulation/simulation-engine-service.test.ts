/**
 * SimulationEngineService static test (phase63) — fake WorldState.
 */

import { describe, it, expect } from 'vitest';
import { SimulationEngineService } from './simulation-engine-service';

function fakeWorldState(initial: import('../../contracts/simulation-world').SimulationWorld) {
    const w = { ...initial, rooms: initial.rooms.map((r) => ({ ...r, agents: [...r.agents] })), relations: [...initial.relations], agentIds: [...initial.agentIds] };
    return {
        get: async (id: string) => (id === w.id ? { ...w, rooms: w.rooms.map((r) => ({ ...r, agents: [...r.agents] })) } : null),
        tick: async (id: string) => { if (id !== w.id) throw new Error('not found'); w.globalClock += 1; w.updatedAt = Date.now(); return { ...w }; },
        moveAgent: async (wid: string, aid: string, rid: string) => {
            if (wid !== w.id) throw new Error('not found');
            for (const r of w.rooms) r.agents = r.agents.filter((a) => a !== aid);
            w.rooms.find((r) => r.id === rid)!.agents.push(aid);
            return { ...w };
        },
        _w: () => w,
    } as unknown as import('../../contracts/simulation-world').IWorldStateService & { _w: () => import('../../contracts/simulation-world').SimulationWorld };
}
function fakeBus() { return { emit: () => {}, on: () => () => {}, off: () => {} } as unknown as import('../../types/interfaces').IEventBus; }

describe('SimulationEngineService (phase63)', () => {
    it('step parallel + run N ticks, sim:completed emitted', async () => {
        const world: import('../../contracts/simulation-world').SimulationWorld = {
            id: 'w1', name: 'Test', rooms: [{ id: 'r1', name: 'Hall', x: 0, y: 0, w: 500, h: 500, agents: ['a1'] }, { id: 'r2', name: 'Lab', x: 600, y: 0, w: 300, h: 300, agents: ['a2'] }],
            relations: [], globalClock: 0, agentIds: ['a1','a2'], createdAt: Date.now(), updatedAt: Date.now(),
        };
        let completed: unknown = null;
        const bus = { emit: (n: string, p: unknown) => { if (String(n).includes('sim:completed')) completed = p; }, on: () => () => {}, off: () => {} } as unknown as import('../../types/interfaces').IEventBus;
        const svc = new SimulationEngineService({ worldState: fakeWorldState(world), events: bus });
        await svc.init();
        const { acts } = await svc.step('w1');
        expect(acts.length).toBe(2);
        expect(acts[0]!.agentId).toBeDefined();

        const after = await svc.run('w1', 3);
        expect(after.globalClock).toBe(4); // 1 from step + 3 from run
        expect(completed).toEqual(expect.objectContaining({ worldId: 'w1', ticks: 3 }));
        const st = await svc.status('w1');
        expect(st!.tick).toBe(4);
        await svc.destroy();
    });

    it('custom actPort injected', async () => {
        const world: import('../../contracts/simulation-world').SimulationWorld = {
            id: 'w1', name: 'Test', rooms: [{ id: 'r1', name: 'Hall', x: 0, y: 0, w: 800, h: 600, agents: ['a1'] }],
            relations: [], globalClock: 0, agentIds: ['a1'], createdAt: Date.now(), updatedAt: Date.now(),
        };
        const svc = new SimulationEngineService({
            worldState: fakeWorldState(world),
            events: fakeBus(),
            actPort: { act: async (aid) => ({ agentId: aid, action: 'talk', message: 'hi' }) },
        });
        await svc.init();
        const { acts } = await svc.step('w1');
        expect(acts[0]!.action).toBe('talk');
        await svc.destroy();
    });
});
