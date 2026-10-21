/**
 * SessionMemoryService — durable per-session scratchpad for coding agents.
 */
import { describe, it, expect, vi, type Mock } from 'vitest';
import { SessionMemoryService, SESSION_MEMORY_KEY } from './session-memory-service';

/**
 * `Mock<T>` erases generic signatures — its call signature resolves the type
 * parameter to `unknown` — so the concrete generic signature is intersected
 * back in to keep the fake assignable to the service dependency type.
 */
type KvGetMock = Mock<(id: string) => Promise<unknown>> & (<T>(id: string) => Promise<T | null>);
type KvSetMock = Mock<(id: string, value: unknown) => Promise<void>> &
    (<T>(id: string, value: T) => Promise<void>);

function fakeDb(initial: unknown = null) {
    const store = new Map<string, unknown>();
    if (initial !== null) store.set(SESSION_MEMORY_KEY, initial);
    const getKv = vi.fn(
        async (id: string) => (store.get(id) ?? null) as unknown,
    ) as unknown as KvGetMock;
    const setKv = vi.fn(async (id: string, value: unknown) => {
        store.set(id, value);
    }) as unknown as KvSetMock;
    return {
        getKv,
        setKv,
        _store: store,
    };
}

describe('SessionMemoryService', () => {
    it('records, dedupes and reads items', async () => {
        const db = fakeDb();
        const svc = new SessionMemoryService({ database: db });
        await svc.remember('s1', 'file', 'src/a.ts');
        await svc.remember('s1', 'file', 'src/a.ts');
        await svc.remember('s1', 'issue', 'flaky test');

        const rec = svc.snapshot('s1');
        expect(rec.items.filter((i) => i.kind === 'file')).toHaveLength(1);
        expect(rec.items.filter((i) => i.kind === 'issue')).toHaveLength(1);
        expect(db.setKv).toHaveBeenCalled();
    });

    it('sets the objective only once (first-write-wins)', async () => {
        const svc = new SessionMemoryService({ database: fakeDb() });
        expect(await svc.setObjectiveIfEmpty('s1', 'fix the parser')).toBe(true);
        expect(await svc.setObjectiveIfEmpty('s1', 'other goal')).toBe(false);
        expect(svc.snapshot('s1').objective).toBe('fix the parser');
    });

    it('caps items per kind', async () => {
        const svc = new SessionMemoryService({ database: fakeDb() });
        for (let i = 0; i < 60; i++) await svc.remember('s1', 'command', `cmd ${i}`);
        const cmds = svc.snapshot('s1').items.filter((i) => i.kind === 'command');
        expect(cmds.length).toBe(30);
    });

    it('builds a compact context block, in kind order', async () => {
        const svc = new SessionMemoryService({ database: fakeDb() });
        await svc.remember('s1', 'note', 'watch out');
        await svc.remember('s1', 'file', 'src/a.ts');
        await svc.setObjectiveIfEmpty('s1', 'ship v1');
        const ctx = svc.buildContext('s1');
        expect(ctx).toContain('## Session memory');
        expect(ctx.indexOf('Objective')).toBeLessThan(ctx.indexOf('Files'));
        expect(ctx.indexOf('Files')).toBeLessThan(ctx.indexOf('Notes'));
    });

    it('returns empty context for unknown sessions', () => {
        const svc = new SessionMemoryService({ database: fakeDb() });
        expect(svc.buildContext('missing')).toBe('');
    });

    it('loads persisted records lazily', async () => {
        const persisted = [
            { sessionId: 's1', objective: 'old goal', items: [], createdAt: 1, updatedAt: 2 },
        ];
        const svc = new SessionMemoryService({ database: fakeDb(persisted) });
        await svc.init();
        expect(svc.get('s1')?.objective).toBe('old goal');
        expect(await svc.setObjectiveIfEmpty('s1', 'new')).toBe(false);
    });

    it('clears a session and persists', async () => {
        const db = fakeDb();
        const svc = new SessionMemoryService({ database: db });
        await svc.remember('s1', 'note', 'x');
        await svc.clear('s1');
        expect(svc.get('s1')).toBeUndefined();
        expect(db.setKv).toHaveBeenLastCalledWith(SESSION_MEMORY_KEY, []);
    });

    it('rejects empty text', async () => {
        const svc = new SessionMemoryService({ database: fakeDb() });
        await expect(svc.remember('s1', 'note', '   ')).rejects.toThrow('text is required');
    });
});
