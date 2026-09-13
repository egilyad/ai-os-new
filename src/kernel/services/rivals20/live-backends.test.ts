import { describe, it, expect } from 'vitest';
import type { DataAccessLayer } from '../../dal/types';
import type { ICodeExecService } from '../../contracts/rivals5';
import type { ICodexService } from '../../contracts/rivals20';
import { InterpreterService, MiniSweService } from './interpreter-services';
import { PortkeyService, LangfuseService } from './infra-services';

function fakeDal() {
    const store = new Map<string, unknown>();
    return {
        store,
        dal: {
            kv: {
                get: async (key: string) => (store.has(key) ? store.get(key) : null),
                set: async (key: string, value: unknown) => {
                    store.set(key, value);
                },
                list: async (prefix: string) =>
                    [...store.entries()]
                        .filter(([k]) => k.startsWith(prefix))
                        .map(([id, value]) => ({ id, value })),
            },
        } as unknown as DataAccessLayer,
    };
}

function fakeCodeExec(impl: Partial<ICodeExecService>): ICodeExecService {
    return {
        submit: async () => 't1',
        result: async () => 'done: ok',
        setExecutor: () => {},
        ...impl,
    } as ICodeExecService;
}

describe('InterpreterService live handoff', () => {
    it('falls back to explicit stub without codeExecService', async () => {
        const svc = new InterpreterService();
        const out = await svc.exec('print(1)', 'python');
        expect(out).toContain('stub');
        expect(out).toContain('no codeExecService');
    });

    it('hands off to CodeExec tickets and reports the ticket', async () => {
        const calls: Array<[string, string]> = [];
        const svc = new InterpreterService(
            fakeCodeExec({
                submit: async (lang: string, code: string) => {
                    calls.push([lang, code]);
                    return 'ticket-7';
                },
                result: async (id: string) => `done: ${id}`,
            }),
        );
        const out = await svc.exec('print(1)', 'python');
        expect(calls).toEqual([['python', 'print(1)']]);
        expect(out).toContain('ticket-7');
    });

    it('surfaces CodeExec validation as a rejected string (allowlist)', async () => {
        const svc = new InterpreterService(
            fakeCodeExec({
                submit: async () => {
                    throw new Error('Banned identifier in code ticket: eval');
                },
            }),
        );
        const out = await svc.exec('eval(x)', 'python');
        expect(out).toContain('rejected: Banned identifier');
    });
});

describe('MiniSweService orchestration', () => {
    it('keeps the legacy stub without CodexService', async () => {
        const svc = new MiniSweService();
        const res = await svc.solve('crash on start');
        expect(res.patch).toContain('crash on start');
        expect(res.passed).toBe(true);
    });

    it('uses the real Codex diff and derives passed from additions', async () => {
        const codex = { prompt: async () => ({ diff: '--- a/f\n+++ b/f\n+ fixed', applied: true }) } as unknown as ICodexService;
        const svc = new MiniSweService(codex);
        const res = await svc.solve('crash on start');
        expect(res.patch).toContain('+ fixed');
        expect(res.passed).toBe(true);
    });

    it('marks passed=false when the Codex diff has no additions', async () => {
        const codex = { prompt: async () => ({ diff: 'no changes', applied: false }) } as unknown as ICodexService;
        const svc = new MiniSweService(codex);
        const res = await svc.solve('nothing to do');
        expect(res.passed).toBe(false);
    });
});

describe('LangfuseService eval', () => {
    it('returns the 0.85 prior with no scored traces', async () => {
        const { dal } = fakeDal();
        expect(await new LangfuseService(dal).eval('ds')).toBe(0.85);
    });

    it('averages real observation scores per dataset', async () => {
        const { dal } = fakeDal();
        const svc = new LangfuseService(dal);
        await svc.trace('ds', JSON.stringify({ text: 'a', score: 0.5 }));
        await svc.trace('ds', JSON.stringify({ text: 'b', score: 1.0 }));
        await svc.trace('ds', 'plain text, no score');
        await svc.trace('other', JSON.stringify({ text: 'c', score: 0.0 }));
        expect(await svc.eval('ds')).toBeCloseTo(0.75, 5);
    });
});

describe('PortkeyService routes', () => {
    it('keeps legacy string configs and openai fallback', async () => {
        const { dal } = fakeDal();
        const svc = new PortkeyService(dal);
        await dal.kv.set('portkey/gpt', 'azure');
        expect(await svc.route('gpt')).toBe('azure');
        expect(await svc.route('unknown')).toBe('openai');
        expect(await svc.fallbacks('unknown')).toEqual([]);
    });

    it('supports setRoute object configs with fallbacks', async () => {
        const { dal } = fakeDal();
        const svc = new PortkeyService(dal);
        await svc.setRoute('claude', 'anthropic', ['aws', 'gcp']);
        expect(await svc.route('claude')).toBe('anthropic');
        expect(await svc.fallbacks('claude')).toEqual(['aws', 'gcp']);
    });
});
