/**
 * WorldStateService static test (phase62) — fake DB.
 */

import { describe, it, expect } from 'vitest';
import { WorldStateService } from './world-state-service';

function fakeDb() {
    const kv = new Map<string, unknown>();
    return {
        getKv: async (k: string) => kv.get(k) ?? null,
        setKv: async (k: string, v: unknown) => { kv.set(k, v); },
        keyValue: { delete: async (k: string) => { kv.delete(k); } },
        _kv: kv,
    } as unknown as import('../database-service').DatabaseService & { _kv: Map<string, unknown> };
}
function fakeBus() {
    return { emit: () => {}, on: () => () => {}, off: () => {} } as unknown as import('../../types/interfaces').IEventBus;
}

describe('WorldStateService (phase62)', () => {
    it('create → get → tick → moveAgent → list → remove', async () => {
        const db = fakeDb();
        const svc = new WorldStateService({ database: db, events: fakeBus() });
        await svc.init();
        const w = await svc.create({ name: 'Test World', rooms: [{ id: 'r1', name: 'Hall', x: 0, y: 0, w: 500, h: 500 }, { id: 'r2', name: 'Lab', x: 600, y: 100, w: 300, h: 300 }], agentIds: ['a1','a2'] });
        expect(w.rooms.length).toBe(2);
        expect(w.globalClock).toBe(0);
        expect(w.rooms[0]!.agents).toContain('a1');

        const t1 = await svc.tick(w.id);
        expect(t1.globalClock).toBe(1);

        const moved = await svc.moveAgent(w.id, 'a1', 'r2');
        expect(moved.rooms.find((r) => r.id === 'r2')!.agents).toContain('a1');
        expect(moved.rooms.find((r) => r.id === 'r1')!.agents).not.toContain('a1');

        const list = await svc.list();
        expect(list.length).toBe(1);

        await svc.remove(w.id);
        expect(await svc.get(w.id)).toBeNull();
        await svc.destroy();
    });

    it('validate coords 0..1000', async () => {
        const svc = new WorldStateService({ database: fakeDb(), events: fakeBus() });
        await svc.init();
        await expect(svc.create({ name: 'Bad', rooms: [{ id: 'r1', name: 'Bad', x: 2000, y: 0, w: 100, h: 100 }] })).rejects.toThrow(/0\.\.1000/);
        await svc.destroy();
    });
});
