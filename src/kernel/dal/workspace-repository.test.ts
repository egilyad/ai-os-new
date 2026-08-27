import { describe, expect, it } from 'vitest';
import { WorkspaceRepository } from './workspace-repository';
import type { KvRepository } from './types';

const HANDLE = { name: 'dir' } as FileSystemDirectoryHandle;

function makeKv(): { kv: KvRepository; store: Map<string, unknown> } {
    const store = new Map<string, unknown>();
    const kv: KvRepository = {
        get: async <T>(id: string) => (store.has(id) ? (store.get(id) as T) : null),
        set: async <T>(id: string, value: T) => {
            store.set(id, value);
        },
        delete: async (id: string) => {
            store.delete(id);
        },
        list: async (prefix?: string) =>
            Array.from(store.entries())
                .filter(([id]) => !prefix || id.startsWith(prefix))
                .map(([id, value]) => ({ id, value })),
        clear: async () => {
            store.clear();
        },
    };
    return { kv, store };
}

describe('WorkspaceRepository', () => {
    it('saves, reads, and deletes the handle via kv', async () => {
        const { kv, store } = makeKv();
        const repo = new WorkspaceRepository(kv);

        expect(await repo.getHandle()).toBeNull();

        await repo.saveHandle(HANDLE);
        expect(store.has('workspace_handle')).toBe(true);
        expect(await repo.getHandle()).toBe(HANDLE);

        await repo.deleteHandle();
        expect(await repo.getHandle()).toBeNull();
        expect(store.has('workspace_handle')).toBe(false);
    });
});
