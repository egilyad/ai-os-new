import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockEventBus, emit } = vi.hoisted(() => {
    const handlers = new Map<string, Array<(data: unknown) => void>>();
    const subscribe = (event: string, cb: (data: unknown) => void) => {
        const list = handlers.get(event) ?? [];
        list.push(cb);
        handlers.set(event, list);
        return () => {
            const current = handlers.get(event);
            if (!current) return;
            const i = current.indexOf(cb);
            if (i >= 0) current.splice(i, 1);
        };
    };
    const emit = vi.fn((event: string, data: unknown) => {
        (handlers.get(event) ?? []).forEach((cb) => cb(data));
    });
    return {
        mockEventBus: { on: subscribe, onSafe: subscribe, emit },
        emit,
    };
});

const { keyService, groupManager, keyStateStore, mockDb } = vi.hoisted(() => {
    const keyService = {
        getAlerts: vi.fn(() => []),
        isKeyInBackoff: vi.fn(() => ({ backoff: false, remainingMs: 0 })),
        getKey: vi.fn(() => undefined),
        exportKeys: vi.fn(async () => '[]'),
        updateKey: vi.fn(async () => {}),
        resolveAlert: vi.fn(() => {}),
    };
    const groupManager = {
        ready: true,
        getAllKeys: vi.fn(() => []),
        createKey: vi.fn(async () => ({ ok: true })),
        deleteKey: vi.fn(async () => {}),
        updateKey: vi.fn(async () => {}),
        syncKeyStatus: vi.fn(async () => {}),
    };
    const keyStateStore = {
        get: vi.fn(() => undefined),
        update: vi.fn(() => {}),
    };
    const mockDb = {
        apiKeys: { toArray: vi.fn(async () => []) },
    };
    return { keyService, groupManager, keyStateStore, mockDb };
});

vi.mock('../kernel/events/event-bus', () => ({ eventBus: mockEventBus }));
vi.mock('../kernel/instances', () => ({
    getDexieDb: () => mockDb,
    keyService,
    groupManager,
    keyStateStore,
    rootLogger: {
        child: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() }),
    },
}));
vi.mock('dexie', async (importOriginal) => {
    const actual = (await importOriginal<typeof import('dexie')>()) as Record<string, unknown>;
    return {
        ...actual,
        liveQuery: vi.fn(() => ({ subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) })),
    };
});

import { useKeyStore } from './useKeyStore';
import { EVENTS } from '../kernel/events/event-names';
import type { ApiKey } from '../types/metrics';

const makeKey = (overrides: Partial<ApiKey> = {}): ApiKey => ({
    id: 'k1',
    provider: 'groq',
    key: 'sk-test-1',
    label: 'Test Key',
    status: 'active',
    stats: {
        successCount: 0,
        errorCount: 0,
        totalTokens: 0,
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
    },
    ...overrides,
});

describe('useKeyStore', () => {
    beforeEach(() => {
        emit.mockClear();
        keyService.getAlerts.mockClear();
        keyService.isKeyInBackoff.mockClear();
        keyService.getKey.mockClear();
        keyService.exportKeys.mockClear();
        keyService.updateKey.mockClear();
        keyService.resolveAlert.mockClear();
        groupManager.getAllKeys.mockClear();
        groupManager.createKey.mockClear();
        groupManager.deleteKey.mockClear();
        groupManager.updateKey.mockClear();
        groupManager.syncKeyStatus.mockClear();
        keyStateStore.get.mockClear();
        keyStateStore.update.mockClear();
        mockDb.apiKeys.toArray.mockClear();
        keyService.getAlerts.mockImplementation(() => []);
        groupManager.createKey.mockImplementation(async () => ({ ok: true }));
        mockDb.apiKeys.toArray.mockImplementation(async () => []);
        useKeyStore.setState({
            keys: [],
            activeKeys: [],
            alerts: [],
            checkingIds: new Set(),
            totalKeys: 0,
            activeCount: 0,
            errorCount: 0,
            keyMeta: new Map(),
            isLoaded: false,
        });
    });

    it('initializes with empty state', () => {
        const s = useKeyStore.getState();
        expect(s.keys).toEqual([]);
        expect(s.isLoaded).toBe(false);
        expect(s.totalKeys).toBe(0);
        expect(s.activeCount).toBe(0);
        expect(s.errorCount).toBe(0);
        expect(s.alerts).toEqual([]);
    });

    it('addKey delegates to groupManager.createKey', async () => {
        await useKeyStore.getState().addKey({
            provider: 'groq',
            label: 'New',
            key: 'sk-new',
            status: 'active',
        });
        expect(groupManager.createKey).toHaveBeenCalledWith(
            { provider: 'groq', label: 'New', key: 'sk-new', status: 'active' },
            { source: 'ui' },
        );
    });

    it('removeKey delegates to groupManager.deleteKey', async () => {
        await useKeyStore.getState().removeKey('k1');
        expect(groupManager.deleteKey).toHaveBeenCalledWith('k1');
    });

    it('updateKey delegates to groupManager.updateKey', async () => {
        await useKeyStore.getState().updateKey('k1', { label: 'Renamed' });
        expect(groupManager.updateKey).toHaveBeenCalledWith('k1', { label: 'Renamed' });
    });

    it('checkHealth emits CHECK_HEALTH', () => {
        useKeyStore.getState().checkHealth('k1');
        expect(emit).toHaveBeenCalledWith(EVENTS.CHECK_HEALTH, 'k1');
    });

    it('checkAllHealth emits CHECK_ALL_HEALTH', () => {
        useKeyStore.getState().checkAllHealth();
        expect(emit).toHaveBeenCalledWith(EVENTS.CHECK_ALL_HEALTH, undefined);
    });

    it('toggleKeyStatus flips active to inactive', async () => {
        useKeyStore.setState({
            keys: [makeKey({ id: 'k1', status: 'active' })],
            activeKeys: [makeKey({ id: 'k1', status: 'active' })],
        });
        await useKeyStore.getState().toggleKeyStatus('k1');
        expect(groupManager.syncKeyStatus).toHaveBeenCalledWith('k1', 'inactive');
    });

    it('toggleKeyStatus flips inactive to active', async () => {
        useKeyStore.setState({
            keys: [makeKey({ id: 'k1', status: 'inactive' })],
            activeKeys: [],
        });
        await useKeyStore.getState().toggleKeyStatus('k1');
        expect(groupManager.syncKeyStatus).toHaveBeenCalledWith('k1', 'active');
    });

    it('toggleKeyStatus no-ops for unknown key', async () => {
        await useKeyStore.getState().toggleKeyStatus('missing');
        expect(groupManager.syncKeyStatus).not.toHaveBeenCalled();
    });

    it('enableAllKeys resets all keys to active', async () => {
        useKeyStore.setState({
            keys: [
                makeKey({ id: 'k1', status: 'inactive' }),
                makeKey({ id: 'k2', status: 'error' }),
            ],
            activeKeys: [],
        });
        keyStateStore.get.mockReturnValue({
            flags: { circuitOpen: true, rateLimited: true, authFailed: true },
            status: 'error',
            healthScore: 10,
            health: { errorRate: 0.5, consecutiveErrors: 3, successRate: 0.5 },
        } as never);
        await useKeyStore.getState().enableAllKeys();
        expect(groupManager.syncKeyStatus).toHaveBeenNthCalledWith(1, 'k1', 'active');
        expect(groupManager.syncKeyStatus).toHaveBeenNthCalledWith(2, 'k2', 'active');
        expect(keyStateStore.update).toHaveBeenCalledTimes(2);
        expect(keyService.updateKey).toHaveBeenCalledTimes(2);
    });

    it('disableAllKeys sets all keys inactive', async () => {
        useKeyStore.setState({
            keys: [makeKey({ id: 'k1', status: 'active' })],
            activeKeys: [makeKey({ id: 'k1', status: 'active' })],
        });
        await useKeyStore.getState().disableAllKeys();
        expect(groupManager.syncKeyStatus).toHaveBeenCalledWith('k1', 'inactive');
    });

    it('exportKeys returns keyService export', async () => {
        keyService.exportKeys.mockResolvedValue('["exported"]' as never);
        await expect(useKeyStore.getState().exportKeys()).resolves.toBe('["exported"]');
    });

    it('importKeys imports valid unique keys and skips duplicates/invalid', async () => {
        groupManager.createKey.mockImplementation(async () => ({ ok: true }) as never);
        const count = await useKeyStore
            .getState()
            .importKeys(
                JSON.stringify([
                    { provider: 'groq', label: 'A', key: 'sk-a' },
                    { provider: 'groq', label: 'A', key: 'sk-a' },
                    { provider: 'openrouter', label: 'B', key: 'sk-b' },
                    { provider: 'groq' },
                    'not-an-object',
                    null,
                ]),
            );
        expect(count).toBe(2);
        expect(groupManager.createKey).toHaveBeenCalledTimes(2);
    });

    it('importKeys throws on non-array payload', async () => {
        await expect(useKeyStore.getState().importKeys('{}')).rejects.toThrow(
            'Invalid data format',
        );
    });

    it('getKeyById finds key or returns undefined', () => {
        useKeyStore.setState({ keys: [makeKey({ id: 'k1', key: 'sk-a' })] });
        expect(useKeyStore.getState().getKeyById('k1')?.id).toBe('k1');
        expect(useKeyStore.getState().getKeyById('nope')).toBeUndefined();
    });

    it('getKeysByProvider filters case-insensitively', () => {
        useKeyStore.setState({
            keys: [
                makeKey({ id: 'k1', provider: 'Groq', key: 'sk-a' }),
                makeKey({ id: 'k2', provider: 'openrouter', key: 'sk-b' }),
            ],
        });
        const found = useKeyStore.getState().getKeysByProvider('GROQ');
        expect(found.map((k) => k.id)).toEqual(['k1']);
    });

    it('getAlerts returns keyService alerts', () => {
        keyService.getAlerts.mockReturnValue([{ id: 'a1' }] as never);
        expect(useKeyStore.getState().getAlerts()).toEqual([{ id: 'a1' }]);
    });

    it('resolveAlert resolves and refreshes alerts', () => {
        keyService.getAlerts.mockReturnValue([{ id: 'a2' }] as never);
        useKeyStore.getState().resolveAlert('a1');
        expect(keyService.resolveAlert).toHaveBeenCalledWith('a1');
        expect(useKeyStore.getState().alerts).toEqual([{ id: 'a2' }]);
    });

    it('refresh loads keys from db', async () => {
        mockDb.apiKeys.toArray.mockResolvedValue([
            makeKey({ id: 'k1', status: 'active' }),
            makeKey({ id: 'k2', status: 'error' }),
        ] as never);
        await useKeyStore.getState().refresh();
        const s = useKeyStore.getState();
        expect(s.keys).toHaveLength(2);
        expect(s.isLoaded).toBe(true);
        expect(s.totalKeys).toBe(2);
        expect(s.activeCount).toBe(1);
        expect(s.errorCount).toBe(1);
        expect(s.activeKeys.map((k) => k.id)).toEqual(['k1']);
    });

    it('KEY_STATE_CHANGED updates keyMeta on backoff', () => {
        keyService.isKeyInBackoff.mockReturnValue({
            backoff: true,
            remainingMs: 15000,
        });
        keyService.getKey.mockReturnValue(makeKey({ id: 'k1' }) as never);
        emit(EVENTS.KEY_STATE_CHANGED, { id: 'k1' });
        const meta = useKeyStore.getState().keyMeta.get('k1');
        expect(meta).toEqual({ backoff: true, backoffRemainingMs: 15000, consecutiveErrors: 0 });
    });

    it('KEY_STATE_CHANGED clears keyMeta when backoff ended', () => {
        useKeyStore.setState({
            keyMeta: new Map([
                ['k1', { backoff: true, backoffRemainingMs: 5, consecutiveErrors: 2 }],
            ]),
        });
        keyService.isKeyInBackoff.mockReturnValue({ backoff: false, remainingMs: 0 });
        emit(EVENTS.KEY_STATE_CHANGED, { id: 'k1' });
        expect(useKeyStore.getState().keyMeta.has('k1')).toBe(false);
    });

    it('KEY_HEALTH_CHECK_STARTED adds checking id', () => {
        emit(EVENTS.KEY_HEALTH_CHECK_STARTED, 'k1');
        expect(useKeyStore.getState().checkingIds.has('k1')).toBe(true);
    });

    it('KEY_HEALTH_CHECK_COMPLETED removes checking id', () => {
        emit(EVENTS.KEY_HEALTH_CHECK_STARTED, 'k1');
        emit(EVENTS.KEY_HEALTH_CHECK_COMPLETED, { id: 'k1' });
        expect(useKeyStore.getState().checkingIds.has('k1')).toBe(false);
    });

    it('alert events refresh alerts list', () => {
        keyService.getAlerts.mockReturnValue([{ id: 'alert-1' }] as never);
        emit(EVENTS.KEY_LATENCY_BURST, {});
        expect(useKeyStore.getState().alerts).toEqual([{ id: 'alert-1' }]);
        expect(keyService.getAlerts).toHaveBeenCalledTimes(1);

        emit(EVENTS.KEY_HEALTH_CHECK_FAILED, { id: 'k1' });
        expect(keyService.getAlerts).toHaveBeenCalledTimes(2);
        emit(EVENTS.KEY_QUOTA_EXCEEDED, { id: 'k1' });
        expect(keyService.getAlerts).toHaveBeenCalledTimes(3);
        emit(EVENTS.NOTIFICATION, { type: 'info', title: 'x' });
        expect(keyService.getAlerts).toHaveBeenCalledTimes(4);
    });
});
