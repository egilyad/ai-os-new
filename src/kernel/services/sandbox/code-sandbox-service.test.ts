/**
 * CodeSandboxService static test (G5) — fake DAL + fake CodeExec.
 * Verifies: policy, timeout, artifact capture, BLOCKED stub.
 */

import { describe, it, expect } from 'vitest';
import { CodeSandboxService } from './code-sandbox-service';

function fakeDal() {
    const store = new Map<string, unknown>();
    return {
        kv: {
            get: async (k: string) => store.get(k) ?? null,
            set: async (k: string, v: unknown) => { store.set(k, v); },
            _store: store,
        },
    } as unknown as import('../../dal/types').DataAccessLayer & { kv: { _store: Map<string, unknown> } };
}

function fakeCodeExec(dal: ReturnType<typeof fakeDal>) {
    let delegate: ((id: string, lang: string, code: string) => Promise<string>) | undefined;
    return {
        setExecutor: (d: (id: string, lang: string, code: string) => Promise<string>) => { delegate = d; },
        submit: async (lang: string, code: string) => {
            const id = `codeticket-${Math.random().toString(36).slice(2, 6)}`;
            await dal.kv.set(`codetickets/${id}`, { id, language: lang, code, status: 'queued', createdAt: Date.now() });
            if (delegate) {
                try {
                    const result = await delegate(id, lang, code);
                    await dal.kv.set(`codetickets/${id}`, { id, language: lang, code, status: 'done', result, createdAt: Date.now() });
                } catch (e) {
                    await dal.kv.set(`codetickets/${id}`, { id, language: lang, code, status: 'rejected', result: e instanceof Error ? e.message : String(e), createdAt: Date.now() });
                    throw e;
                }
            }
            return id;
        },
        result: async (id: string) => {
            const t = await dal.kv.get<{ status: string; result?: string }>(`codetickets/${id}`);
            if (!t) throw new Error('not found');
            if (t.status === 'queued') return 'queued — no external executor attached (handoff pending)';
            return `${t.status}: ${t.result ?? ''}`;
        },
    } as unknown as import('../../contracts/rivals5').ICodeExecService;
}

function fakeBus() {
    return { emit: () => {}, on: () => () => {}, off: () => {} } as unknown as import('../../types/interfaces').IEventBus;
}

describe('G5 CodeSandboxService (static)', () => {
    it('policy + timeout + artifact (done)', async () => {
        const dal = fakeDal();
        const codeExec = fakeCodeExec(dal);
        const svc = new CodeSandboxService({ dal: dal as unknown as import('../../dal/types').DataAccessLayer, codeExec, events: fakeBus() });
        await svc.init();
        svc.setExecutor(async () => 'hello artifact');
        const id = await svc.submit('python', 'print("hi")', { timeoutMs: 2000 });
        const art = await svc.artifact(id);
        expect(art.status).toBe('done');
        expect(art.result).toContain('hello artifact');
        expect(art.exitCode).toBe(0);
        expect(art.logs.some((l) => l.includes('done'))).toBe(true);
        await svc.destroy();
    });

    it('banned identifier blocked by sandbox policy', async () => {
        const dal = fakeDal();
        const svc = new CodeSandboxService({ dal: dal as unknown as import('../../dal/types').DataAccessLayer, codeExec: fakeCodeExec(dal), events: fakeBus() });
        await svc.init();
        await expect(svc.submit('python', 'eval("bad")')).rejects.toThrow(/banned/);
        await svc.destroy();
    });

    it('timeout → artifact timeout, exit 124', async () => {
        const dal = fakeDal();
        const svc = new CodeSandboxService({ dal: dal as unknown as import('../../dal/types').DataAccessLayer, codeExec: fakeCodeExec(dal), events: fakeBus() });
        await svc.init();
        svc.setExecutor(async () => new Promise<string>(() => {})); // never resolves
        const idP = svc.submit('javascript', 'while(true){}', { timeoutMs: 50 }).catch((e) => e.message as string);
        // submit will throw after delegate timeout via CodeExec, but artifact should be timeout
        let id: string | null = null;
        try {
            id = await svc.submit('javascript', 'while(true){}', { timeoutMs: 50 });
        } catch (e) {
            // CodeExec rethrows with timeout message — we still can find artifact by scanning
            // For this test we capture via list
        }
        // Wait a bit for timeout
        await new Promise((r) => setTimeout(r, 120));
        const list = await svc.list();
        const timed = list.find((a) => a.status === 'timeout');
        expect(timed?.exitCode).toBe(124);
        await svc.destroy();
        expect(idP).toBeDefined();
        expect(id).toBeDefined();
    });

    it('BLOCKED-RUNTIME stub when no executor set', async () => {
        const dal = fakeDal();
        const svc = new CodeSandboxService({ dal: dal as unknown as import('../../dal/types').DataAccessLayer, codeExec: fakeCodeExec(dal), events: fakeBus() });
        await svc.init();
        // no setExecutor → stub
        const id = await svc.submit('sql', 'SELECT 1');
        const art = await svc.artifact(id);
        expect(art.result).toContain('BLOCKED-RUNTIME');
        await svc.destroy();
    });

    it('setPolicy/getPolicy', async () => {
        const dal = fakeDal();
        const svc = new CodeSandboxService({ dal: dal as unknown as import('../../dal/types').DataAccessLayer, codeExec: fakeCodeExec(dal), events: fakeBus() });
        await svc.init();
        svc.setPolicy({ maxChars: 10 });
        expect(svc.getPolicy().maxChars).toBe(10);
        await expect(svc.submit('python', 'x'.repeat(20))).rejects.toThrow(/too large/);
        await svc.destroy();
    });
});
