import { describe, it, expect, vi } from 'vitest';
import { GroupManagerService } from './group-manager';

const KV_GROUPS = 'key_groups';

function makeDeps(initial?: { groups: unknown[]; passports: [string, unknown][] }) {
    const store = new Map<string, unknown>();
    if (initial) store.set(KV_GROUPS, initial);
    return {
        keyService: {} as never,
        eventBus: {
            on: vi.fn(() => () => {}),
            onSafe: vi.fn(() => () => {}),
            emit: vi.fn(),
        },
        storage: {
            getKv: vi.fn(async <T>(id: string): Promise<T | null> =>
                store.has(id) ? (store.get(id) as T) : null,
            ),
            setKv: vi.fn(async <T>(id: string, value: T): Promise<void> => {
                store.set(id, value);
            }),
        },
    };
}

describe('GroupManagerService', () => {
    it('init creates the default group when nothing is stored', async () => {
        const deps = makeDeps();
        const gm = new GroupManagerService(deps as never);
        await gm.init();
        expect(gm.ready).toBe(true);
        expect(gm.getDefaultGroup().id).toBe('__default__');
        await gm.destroy();
    });

    it('init loads persisted groups and passports', async () => {
        const deps = makeDeps({
            groups: [{ id: 'grp_a', name: 'A', createdAt: 1, keyIds: [] }],
            passports: [],
        });
        const gm = new GroupManagerService(deps as never);
        await gm.init();
        expect(gm.getGroups().some((g) => g.id === 'grp_a')).toBe(true);
        await gm.destroy();
    });

    it('createGroup persists and returns the existing id for duplicate names', async () => {
        const deps = makeDeps();
        const gm = new GroupManagerService(deps as never);
        await gm.init();
        const id1 = await gm.createGroup('Work');
        const id2 = await gm.createGroup('Work');
        expect(id1).toBe(id2);
        expect(gm.getGroups().some((g) => g.name === 'Work')).toBe(true);
        expect(deps.storage.setKv).toHaveBeenCalledWith(KV_GROUPS, expect.anything());
        await gm.destroy();
    });

    it('deleteGroup forbids deleting the default group', async () => {
        const deps = makeDeps();
        const gm = new GroupManagerService(deps as never);
        await gm.init();
        await expect(gm.deleteGroup('__default__')).rejects.toThrow(/default/);
        await gm.destroy();
    });
});
