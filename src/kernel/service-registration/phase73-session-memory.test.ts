/**
 * Phase 73 registration test — session scratchpad service + agent tools.
 */
import { describe, it, expect, vi } from 'vitest';
import { registerPhase73 } from './phase73-session-memory';

interface ToolDef {
    name: string;
    run: (args: Record<string, unknown>) => Promise<string>;
}

function boot() {
    const factories = new Map<string, (c: unknown) => unknown>();
    const tools = new Map<string, ToolDef>();
    const db = new Map<string, unknown>();
    const database = {
        getKv: async <T>(id: string): Promise<T | null> => (db.get(id) as T) ?? null,
        setKv: async <T>(id: string, value: T): Promise<void> => {
            db.set(id, value);
        },
    };
    const runner = {
        addTool: (def: ToolDef) => tools.set(def.name, def),
    };

    const c = {
        has: (name: string) =>
            name === 'database' || name === 'toolRunnerService' || factories.has(name),
        get: (name: string) => {
            if (name === 'database') return database;
            if (name === 'toolRunnerService') return runner;
            const f = factories.get(name);
            if (!f) throw new Error(`not registered: ${name}`);
            return f(c);
        },
        registerFactory: (name: string, f: (cc: never) => unknown) => {
            factories.set(name, f as (c: unknown) => unknown);
        },
    };

    registerPhase73(
        {
            register: (name: string, f: (cc: never) => unknown) => c.registerFactory(name, f),
            get: <T,>(name: string): T => c.get(name) as T,
            asDeps: <T,>(v: unknown) => v as T,
        },
        {
            container: c,
            eventBus: { emit: vi.fn() },
            registerWithLifecycle: () => {},
        } as never,
    );

    return { c, tools };
}

describe('phase73-session-memory', () => {
    it('registers the service and exposes session tools', () => {
        const { c, tools } = boot();
        expect(c.get('sessionMemoryService')).toBeTruthy();
        expect(tools.has('session.remember')).toBe(true);
        expect(tools.has('session.recall')).toBe(true);
    });

    it('routes session.remember into the scratchpad and session.recall back out', async () => {
        const { c, tools } = boot();
        await tools.get('session.remember')!.run({
            kind: 'decision',
            text: 'use streaming',
            sessionId: 's1',
        });
        const recalled = await tools.get('session.recall')!.run({ sessionId: 's1' });
        expect(recalled).toContain('use streaming');
        const svc = c.get('sessionMemoryService') as {
            snapshot: (id: string) => { items: unknown[] };
        };
        expect(svc.snapshot('s1').items).toHaveLength(1);
    });

    it('rejects unknown kinds', async () => {
        const { tools } = boot();
        await expect(
            tools.get('session.remember')!.run({ kind: 'bogus', text: 'x' }),
        ).rejects.toThrow('kind must be');
    });
});
