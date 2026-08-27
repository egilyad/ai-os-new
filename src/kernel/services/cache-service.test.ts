import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { CacheService, type CacheServiceDeps } from './cache-service';
import type { CacheEntry } from './cache-service';

function makeDeps(store?: Map<string, unknown>): CacheServiceDeps {
    const s = store ?? new Map<string, unknown>();
    return {
        database: {
            getKv: vi.fn(async (id: string) => (s.has(id) ? s.get(id) : null)),
            setKv: vi.fn(async (id: string, value: unknown) => {
                s.set(id, value);
            }),
        },
        eventBus: {
            emit: vi.fn(),
            on: vi.fn(() => vi.fn()),
        },
    } as unknown as CacheServiceDeps;
}

function makeEntry(overrides?: Partial<CacheEntry>): CacheEntry {
    return {
        key: 'k',
        response: 'hello',
        model: 'gpt-4',
        provider: 'openai',
        promptTokens: 10,
        completionTokens: 20,
        timestamp: Date.now(),
        ttl: 300_000,
        hitCount: 0,
        ...overrides,
    };
}

const mockDigest = vi.fn();

beforeAll(() => {
    Object.defineProperty(globalThis.crypto, 'subtle', {
        value: { digest: mockDigest },
        writable: true,
        configurable: true,
    });
});

beforeEach(() => {
    vi.useRealTimers();
    mockDigest.mockReset();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('CacheService', () => {
    it('should create empty cache', () => {
        const svc = new CacheService(makeDeps());
        const stats = svc.getStats();
        expect(stats.size).toBe(0);
        expect(stats.hits).toBe(0);
        expect(stats.misses).toBe(0);
        expect(stats.hitRate).toBe(0);
        expect(stats.emaHitRate).toBe(0);
    });

    it('should return null for missing key', () => {
        const svc = new CacheService(makeDeps());
        expect(svc.get('nonexistent')).toBeNull();
    });

    it('should return stored entry after set', () => {
        const svc = new CacheService(makeDeps());
        svc.set('key1', 'response-1', 'gpt-4', 'openai', 10, 20);
        const entry = svc.get('key1');
        expect(entry).not.toBeNull();
        expect(entry!.key).toBe('key1');
        expect(entry!.response).toBe('response-1');
        expect(entry!.model).toBe('gpt-4');
        expect(entry!.provider).toBe('openai');
        expect(entry!.promptTokens).toBe(10);
        expect(entry!.completionTokens).toBe(20);
        expect(entry!.hitCount).toBe(1);
        expect(entry!.ttl).toBeGreaterThan(0);
        expect(entry!.timestamp).toBeGreaterThan(0);
    });

    it('should return null for expired entry', () => {
        vi.useFakeTimers();
        const svc = new CacheService(makeDeps());
        svc.set('key1', 'resp', 'gpt-4', 'openai', 5, 10, 100);
        expect(svc.get('key1')).not.toBeNull();
        vi.advanceTimersByTime(101);
        expect(svc.get('key1')).toBeNull();
    });

    it('should clear all entries and reset stats', () => {
        const svc = new CacheService(makeDeps());
        svc.set('a', 'r1', 'm1', 'p1', 1, 1);
        svc.set('b', 'r2', 'm2', 'p2', 2, 2);
        svc.get('nonexistent');
        svc.get('nonexistent');
        svc.get('a');
        expect(svc.getStats().size).toBe(2);
        expect(svc.getStats().hits).toBe(1);
        expect(svc.getStats().misses).toBe(2);
        svc.clear();
        const stats = svc.getStats();
        expect(stats.size).toBe(0);
        expect(stats.hits).toBe(0);
        expect(stats.misses).toBe(0);
        expect(stats.hitRate).toBe(0);
        expect(stats.emaHitRate).toBe(0);
        expect(svc.get('a')).toBeNull();
    });

    it('should invalidate entries by model', () => {
        const svc = new CacheService(makeDeps());
        svc.set('k1', 'r1', 'gpt-4', 'openai', 1, 1);
        svc.set('k2', 'r2', 'claude-3', 'anthropic', 1, 1);
        svc.set('k3', 'r3', 'gpt-4', 'openai', 1, 1);
        svc.invalidate('gpt-4');
        expect(svc.get('k1')).toBeNull();
        expect(svc.get('k3')).toBeNull();
        expect(svc.get('k2')).not.toBeNull();
        expect(svc.getStats().size).toBe(1);
    });

    it('should invalidate all entries when model is omitted', () => {
        const svc = new CacheService(makeDeps());
        svc.set('k1', 'r1', 'gpt-4', 'openai', 1, 1);
        svc.set('k2', 'r2', 'claude-3', 'anthropic', 1, 1);
        svc.invalidate();
        expect(svc.getStats().size).toBe(0);
        expect(svc.get('k1')).toBeNull();
        expect(svc.get('k2')).toBeNull();
    });

    it('should track hit rate correctly', () => {
        const svc = new CacheService(makeDeps());
        svc.set('k', 'r', 'm', 'p', 1, 1);
        svc.get('x');
        svc.get('x');
        svc.get('x');
        expect(svc.getStats().misses).toBe(3);
        expect(svc.getStats().hits).toBe(0);
        expect(svc.getStats().hitRate).toBe(0);
        svc.get('k');
        svc.get('k');
        const stats = svc.getStats();
        expect(stats.hits).toBe(2);
        expect(stats.misses).toBe(3);
        expect(stats.hitRate).toBeCloseTo(0.4);
        expect(stats.emaHitRate).toBeGreaterThan(0);
    });

    it('should call fetchFn on miss in getOrFetch', async () => {
        const svc = new CacheService(makeDeps());
        const entry = makeEntry({ key: 'k', response: 'fetched' });
        const fetchFn = vi.fn().mockResolvedValue(entry);
        const result = await svc.getOrFetch('k', fetchFn);
        expect(fetchFn).toHaveBeenCalledTimes(1);
        expect(result).not.toBeNull();
        expect(result!.response).toBe('fetched');
    });

    it('should return cached value on subsequent getOrFetch', async () => {
        const svc = new CacheService(makeDeps());
        const entry = makeEntry({ key: 'k', response: 'cached' });
        const fetchFn = vi.fn().mockResolvedValue(entry);
        await svc.getOrFetch('k', fetchFn);
        const fetchFn2 = vi.fn();
        const result = await svc.getOrFetch('k', fetchFn2);
        expect(fetchFn2).not.toHaveBeenCalled();
        expect(result!.response).toBe('cached');
    });

    it('should dedup concurrent getOrFetch calls', async () => {
        const svc = new CacheService(makeDeps());
        const entry = makeEntry({ key: 'k', response: 'deduped' });
        let callCount = 0;
        const fetchFn = vi.fn(async () => {
            callCount++;
            return entry;
        });
        const [r1, r2, r3] = await Promise.all([
            svc.getOrFetch('k', fetchFn),
            svc.getOrFetch('k', fetchFn),
            svc.getOrFetch('k', fetchFn),
        ]);
        expect(callCount).toBe(1);
        expect(r1).toEqual(r2);
        expect(r2).toEqual(r3);
    });

    it('should propagate errors from getOrFetch fetchFn', async () => {
        const svc = new CacheService(makeDeps());
        const err = new Error('upstream failed');
        await expect(svc.getOrFetch('k', () => Promise.reject(err))).rejects.toThrow(
            'upstream failed',
        );
    });

    it('should release in-flight entry on getOrFetch failure', async () => {
        const svc = new CacheService(makeDeps());
        const err = new Error('fail');
        await expect(svc.getOrFetch('k', () => Promise.reject(err))).rejects.toThrow('fail');
        const successEntry = makeEntry({ key: 'k', response: 'ok' });
        const fetchFn = vi.fn().mockResolvedValue(successEntry);
        const result = await svc.getOrFetch('k', fetchFn);
        expect(fetchFn).toHaveBeenCalledTimes(1);
        expect(result!.response).toBe('ok');
    });

    it('should evict oldest entry when at capacity', () => {
        const svc = new CacheService(makeDeps());
        svc.set('first', 'r', 'm', 'p', 1, 1);
        for (let i = 0; i < 500; i++) {
            svc.set(`k-${i}`, 'r', 'm', 'p', 1, 1);
        }
        expect(svc.get('first')).toBeNull();
        expect(svc.getStats().size).toBe(500);
    });

    it('should produce deterministic keys from generateKey', async () => {
        const shaBytes = new Uint8Array(32).fill(0xab);
        mockDigest.mockResolvedValue(shaBytes.buffer);
        const svc = new CacheService(makeDeps());
        const messages = [{ role: 'user', content: 'hello' }];
        const a = await svc.generateKey(messages, 'gpt-4');
        const b = await svc.generateKey(messages, 'gpt-4');
        expect(a).toBe(b);
        expect(a).toMatch(/^cache_[a-f0-9]{32}$/);
    });

    it('should generate different keys for different inputs', async () => {
        mockDigest
            .mockResolvedValueOnce(new Uint8Array(32).fill(0x01).buffer)
            .mockResolvedValueOnce(new Uint8Array(32).fill(0x02).buffer);
        const svc = new CacheService(makeDeps());
        const a = await svc.generateKey([{ role: 'user', content: 'a' }], 'gpt-4');
        const b = await svc.generateKey([{ role: 'user', content: 'b' }], 'gpt-4');
        expect(a).not.toBe(b);
    });

    it('generateKey should call crypto.subtle.digest with SHA-256', async () => {
        mockDigest.mockResolvedValue(new Uint8Array(32).fill(0).buffer);
        const svc = new CacheService(makeDeps());
        const messages = [{ role: 'user', content: 'test' }];
        await svc.generateKey(messages, 'claude-3');
        expect(mockDigest).toHaveBeenCalledWith('SHA-256', expect.anything());
    });

    it('should return config with expected shape', () => {
        const svc = new CacheService(makeDeps());
        const config = svc.getConfig();
        expect(config).toHaveProperty('level');
        expect(config).toHaveProperty('ttl');
        expect(config).toHaveProperty('maxEntries');
        expect(config).toHaveProperty('persistence');
        expect(config.level).toBe('Kernel CacheService');
        expect(config.maxEntries).toBeGreaterThan(0);
    });

    it('should load persisted cache on init', async () => {
        const stored: CacheEntry[] = [
            makeEntry({ key: 'loaded', response: 'from-db', timestamp: Date.now() }),
        ];
        const store = new Map<string, unknown>([['super_agents_llm_cache', stored]]);
        const deps = makeDeps(store);
        const svc = new CacheService(deps);
        await svc.init();
        const entry = svc.get('loaded');
        expect(entry).not.toBeNull();
        expect(entry!.response).toBe('from-db');
    });

    it('should skip expired entries on init', async () => {
        const stored: CacheEntry[] = [
            makeEntry({
                key: 'stale',
                response: 'old',
                timestamp: Date.now() - 600_000,
                ttl: 300_000,
            }),
        ];
        const store = new Map<string, unknown>([['super_agents_llm_cache', stored]]);
        const deps = makeDeps(store);
        const svc = new CacheService(deps);
        await svc.init();
        expect(svc.get('stale')).toBeNull();
    });

    it('should subscribe to CACHE_INVALIDATED event on init', async () => {
        const deps = makeDeps();
        const svc = new CacheService(deps);
        await svc.init();
        expect(deps.eventBus!.on).toHaveBeenCalled();
        svc.set('k', 'r', 'm', 'p', 1, 1);
        expect(svc.getStats().size).toBe(1);
    });

    it('should persist entries after set', async () => {
        vi.useFakeTimers();
        const deps = makeDeps();
        const svc = new CacheService(deps);
        svc.set('k', 'r', 'm', 'p', 1, 1);
        vi.advanceTimersByTime(2500);
        expect(vi.mocked(deps.database.setKv)).toHaveBeenCalledWith(
            'super_agents_llm_cache',
            expect.arrayContaining([expect.objectContaining({ key: 'k' })]),
        );
    });

    it('should call database.setKv after clear', async () => {
        vi.useFakeTimers();
        const deps = makeDeps();
        const svc = new CacheService(deps);
        svc.set('k', 'r', 'm', 'p', 1, 1);
        vi.advanceTimersByTime(2500);
        vi.mocked(deps.database.setKv).mockClear();
        svc.clear();
        vi.advanceTimersByTime(2500);
        expect(vi.mocked(deps.database.setKv)).toHaveBeenCalledWith('super_agents_llm_cache', []);
    });

    it('should clean up resources on destroy', async () => {
        const deps = makeDeps();
        const svc = new CacheService(deps);
        svc.set('k', 'r', 'm', 'p', 1, 1);
        await svc.destroy();
        const stats = svc.getStats();
        expect(stats.size).toBe(0);
    });

    it('should flush to database on destroy', async () => {
        const deps = makeDeps();
        const svc = new CacheService(deps);
        svc.set('k', 'r', 'm', 'p', 1, 1);
        await svc.destroy();
        expect(vi.mocked(deps.database.setKv)).toHaveBeenCalledWith(
            'super_agents_llm_cache',
            expect.arrayContaining([expect.objectContaining({ key: 'k' })]),
        );
    });

    it('should return a shallow copy from get', () => {
        const svc = new CacheService(makeDeps());
        svc.set('k', 'original', 'm', 'p', 1, 1);
        const entry = svc.get('k')!;
        expect(entry.response).toBe('original');
    });

    it('should increment hitCount on repeated gets', () => {
        const svc = new CacheService(makeDeps());
        svc.set('k', 'r', 'm', 'p', 1, 1);
        svc.get('k');
        svc.get('k');
        svc.get('k');
        const entry = svc.get('k');
        expect(entry!.hitCount).toBe(4);
    });

    it('should persist after invalidate', () => {
        vi.useFakeTimers();
        const deps = makeDeps();
        const svc = new CacheService(deps);
        svc.set('k', 'r', 'm', 'p', 1, 1);
        vi.advanceTimersByTime(2500);
        vi.mocked(deps.database.setKv).mockClear();
        svc.invalidate('m');
        vi.advanceTimersByTime(2500);
        expect(vi.mocked(deps.database.setKv)).toHaveBeenCalled();
    });

    it('should handle destroy without init', async () => {
        const svc = new CacheService(makeDeps());
        await expect(svc.destroy()).resolves.toBeUndefined();
    });

    it('should return zero hit rate on empty cache', () => {
        const svc = new CacheService(makeDeps());
        expect(svc.getStats().hitRate).toBe(0);
    });

    it('should update emaHitRate on hits and misses', () => {
        const svc = new CacheService(makeDeps());
        svc.set('k', 'r', 'm', 'p', 1, 1);
        svc.get('x');
        expect(svc.getStats().emaHitRate).toBe(0);
        svc.get('k');
        expect(svc.getStats().emaHitRate).toBeGreaterThan(0);
        svc.get('k');
        svc.get('k');
        svc.get('k');
        expect(svc.getStats().emaHitRate).toBeGreaterThan(0.3);
        expect(svc.getStats().emaHitRate).toBeLessThan(0.5);
    });

    it('should store entry with provided ttl', () => {
        const svc = new CacheService(makeDeps());
        svc.set('k', 'r', 'm', 'p', 5, 10, 999);
        const entry = svc.get('k')!;
        expect(entry.ttl).toBe(999);
    });

    it('should set default ttl when ttl is not provided', () => {
        const svc = new CacheService(makeDeps());
        svc.set('k', 'r', 'm', 'p', 5, 10);
        const entry = svc.get('k')!;
        expect(entry.ttl).toBeGreaterThan(0);
    });
});
