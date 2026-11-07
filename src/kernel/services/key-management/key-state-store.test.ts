import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeyStateStore } from '../key-state-store';
import type { ApiKey } from '../../contracts/storage/storage-layer';
import type { KeyState } from '../../contracts/key-state';
import { EVENTS } from '../../events/event-names';

const KV_KEY = 'keystore_store_states';

function fakeDb(initial: Record<string, unknown> = {}) {
    const store = new Map<string, unknown>(Object.entries(initial));
    return {
        getKv: vi.fn(async <T>(id: string): Promise<T | null> =>
            store.has(id) ? (store.get(id) as T) : null,
        ),
        setKv: vi.fn(async <T>(id: string, value: T): Promise<void> => {
            store.set(id, value);
        }),
        store,
    };
}

function fakeBus() {
    return {
        on: vi.fn(() => () => {}),
        off: vi.fn(),
        onSafe: vi.fn(() => () => {}),
        emit: vi.fn(),
        emitOnce: vi.fn(),
        subscribeAll: vi.fn(() => () => {}),
        getSubscriptionStats: vi.fn(() => ({ totalCallbacks: 0, perEvent: {} })),
    };
}

function key(partial: Partial<ApiKey> = {}): ApiKey {
    return {
        id: 'k1',
        provider: 'openrouter',
        label: 'k1',
        status: 'active',
        ...partial,
    } as ApiKey;
}

function state(id: string, partial: Partial<KeyState> = {}): KeyState {
    return {
        id,
        provider: 'openrouter',
        label: id,
        status: 'ready',
        healthScore: 100,
        lastProbe: { status: 'ready', latency: 0, timestamp: 0 },
        health: { errorRate: 0, successRate: 1, consecutiveErrors: 0 },
        quota: { usedTokens: 0, limitTokens: 0, usedRequests: 0, limitRequests: 0 },
        routing: { weight: 1, blocked: false },
        flags: { circuitOpen: false, rateLimited: false, authFailed: false },
        lifecycleState: 'active',
        updatedAt: 0,
        ...partial,
    };
}

describe('KeyStateStore', () => {
    let db: ReturnType<typeof fakeDb>;
    let bus: ReturnType<typeof fakeBus>;

    beforeEach(() => {
        db = fakeDb();
        bus = fakeBus();
    });

    it('seeds keys with defaults and exposes them for routing', async () => {
        const store = new KeyStateStore(bus, db);
        store.seedFromKeys([key(), key({ id: 'k2', status: 'error' })]);
        const all = store.getAll();
        expect(all).toHaveLength(2);
        expect(all.find((s) => s.id === 'k1')?.status).toBe('ready');
        expect(all.find((s) => s.id === 'k2')?.status).toBe('broken');
        await store.destroy();
    });

    it('restores persisted states on start (legacy key included)', async () => {
        const persisted = [
            { id: 'k1', state: state('k1') },
            { id: 'k2', state: state('k2', { status: 'broken', healthScore: 0 }) },
        ];
        const dbWith = fakeDb({ [KV_KEY]: persisted });
        const store = new KeyStateStore(fakeBus(), dbWith);
        await store.start();
        expect(store.get('k1')?.status).toBe('ready');
        expect(store.get('k2')?.status).toBe('broken');
        await store.destroy();
    });

    it('update mutates state, persists and emits', async () => {
        const store = new KeyStateStore(bus, db);
        store.seedFromKeys([key()]);
        await store.update('k1', { status: 'broken', healthScore: 10 });
        expect(store.get('k1')?.status).toBe('broken');
        expect(db.setKv).toHaveBeenCalledWith(KV_KEY, expect.any(Array));
        expect(bus.emit).toHaveBeenCalledWith(EVENTS.KEYSTATE_UPDATED, expect.anything());
        await store.destroy();
    });

    it('purgeOrphans removes only non-live ids', async () => {
        const store = new KeyStateStore(bus, db);
        store.seedFromKeys([key(), key({ id: 'k2' })]);
        store.purgeOrphans(new Set(['k1']));
        expect(store.get('k1')).toBeDefined();
        expect(store.get('k2')).toBeUndefined();
        await store.destroy();
    });

    it('getForRouting filters blocked keys', async () => {
        const store = new KeyStateStore(bus, db);
        store.seedFromKeys([key(), key({ id: 'k2', status: 'error' })]);
        const routing = store.getForRouting();
        expect(routing.every((s) => !s.routing.blocked)).toBe(true);
        await store.destroy();
    });
});
