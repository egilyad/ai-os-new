import { describe, it, expect, vi, afterEach } from 'vitest';
import { VirtualKeyService, type VirtualKeyServiceDeps } from './virtual-key-service';

function makeDeps(): VirtualKeyServiceDeps {
    const store = new Map<string, unknown>();
    return {
        database: {
            getKv: vi.fn((id: string) =>
                Promise.resolve(store.get(id) ?? null),
            ) as unknown as VirtualKeyServiceDeps['database']['getKv'],
            setKv: vi.fn((id: string, value: unknown) => {
                store.set(id, value);
                return Promise.resolve();
            }) as unknown as VirtualKeyServiceDeps['database']['setKv'],
        },
        eventBus: {
            emit: vi.fn(),
            on: vi.fn(() => vi.fn()),
            onSafe: vi.fn(() => vi.fn()),
        },
        keyService: {
            getKeys: vi.fn(() => [{ id: 'key-1', provider: 'openai' }]),
            getKey: vi.fn((id: string) =>
                [{ id: 'key-1', provider: 'openai' }].find((k) => k.id === id),
            ),
        },
    };
}

describe('VirtualKeyService', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('should create and return a virtual key', async () => {
        const deps = makeDeps();
        const svc = new VirtualKeyService(deps);
        const vk = await svc.create('key-1', 'My Key');
        expect(vk.id).toMatch(/^vk_/);
        expect(vk.realKeyId).toBe('key-1');
        expect(vk.label).toBe('My Key');
        expect(vk.active).toBe(true);
        expect(vk.provider).toBe('openai');
    });

    it('should resolve an active virtual key', async () => {
        const deps = makeDeps();
        const svc = new VirtualKeyService(deps);
        const vk = await svc.create('key-1', 'Test');
        const resolved = svc.resolve(vk.id);
        expect(resolved).toBeDefined();
        expect(resolved!.id).toBe(vk.id);
    });

    it('should return undefined for unknown key', () => {
        const svc = new VirtualKeyService(makeDeps());
        expect(svc.resolve('nonexistent')).toBeUndefined();
    });

    it('should list all keys', async () => {
        const svc = new VirtualKeyService(makeDeps());
        await svc.create('key-1', 'A');
        await svc.create('key-1', 'B');
        const list = svc.list();
        expect(list).toHaveLength(2);
        expect(list.map((k) => k.label).sort()).toEqual(['A', 'B']);
    });

    it('should revoke a key', async () => {
        const deps = makeDeps();
        const svc = new VirtualKeyService(deps);
        const vk = await svc.create('key-1', 'Test');
        await svc.revoke(vk.id);
        expect(svc.resolve(vk.id)).toBeUndefined();
        expect(svc.listActive()).toHaveLength(0);
    });

    it('should persist to database on write', async () => {
        const deps = makeDeps();
        const svc = new VirtualKeyService(deps);
        await svc.create('key-1', 'Test');
        expect(deps.database.setKv).toHaveBeenCalled();
        const saved = await deps.database.getKv('virtual_keys');
        expect(saved).toBeDefined();
    });

    it('should load from database on init', async () => {
        const deps = makeDeps();
        const svc1 = new VirtualKeyService(deps);
        const vk = await svc1.create('key-1', 'Persisted');
        const svc2 = new VirtualKeyService(deps);
        await svc2.init();
        expect(svc2.resolve(vk.id)).toBeDefined();
    });

    it('should emit events on lifecycle actions', async () => {
        const deps = makeDeps();
        const svc = new VirtualKeyService(deps);
        const vk = await svc.create('key-1', 'Test');
        expect(deps.eventBus.emit).toHaveBeenCalledWith(
            'virtual:key:created',
            expect.objectContaining({ virtualKey: vk }),
        );
        svc.resolve(vk.id);
        expect(deps.eventBus.emit).toHaveBeenCalledWith('virtual:key:resolved', {
            virtualKeyId: vk.id,
        });
        await svc.revoke(vk.id);
        expect(deps.eventBus.emit).toHaveBeenCalledWith('virtual:key:revoked', {
            virtualKeyId: vk.id,
        });
    });
});
