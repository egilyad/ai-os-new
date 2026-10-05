import type { IMemoryEngine } from '../contracts/memory';
import type { MemoryEntry } from '../types/memory-types';
import { seedMemoryDemo, DEMO_MEMORY_PREFIX } from './memory-demo-seed';

function makeEngine(): IMemoryEngine & { all: MemoryEntry[] } {
    const all: MemoryEntry[] = [];
    let n = 0;
    return {
        all,
        getMemories: () => [...all],
        storeBatch: async (entries: Omit<MemoryEntry, 'id'>[]) => {
            for (const e of entries) all.push({ ...e, id: `m${++n}` });
        },
    } as unknown as IMemoryEngine & { all: MemoryEntry[] };
}

describe('memory-demo-seed', () => {
    it('seeds three tagged entries', async () => {
        const engine = makeEngine();
        const seeded = await seedMemoryDemo(engine);
        expect(seeded).toHaveLength(3);
        for (const e of seeded) {
            expect(e.content.startsWith(DEMO_MEMORY_PREFIX)).toBe(true);
        }
        const types = new Set(seeded.map((e) => e.metadata.type));
        expect(types).toEqual(new Set(['decision', 'lesson', 'note']));
    });

    it('is idempotent: repeated calls reuse entries', async () => {
        const engine = makeEngine();
        const first = await seedMemoryDemo(engine);
        const second = await seedMemoryDemo(engine);
        expect(second.map((e) => e.id).sort()).toEqual(first.map((e) => e.id).sort());
        expect(engine.all).toHaveLength(3);
    });
});
