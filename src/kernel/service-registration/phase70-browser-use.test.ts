/**
 * Phase 70 registration test — browser.act tool appears in ToolRunner
 * via the standard addTool() pattern (no new contour).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerPhase70 } from './phase70-browser-use';

interface AddedTool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    run: (args: Record<string, unknown>) => Promise<string>;
}

function makeContainer(opts: { withRunner: boolean; withHarness: boolean }) {
    const added: AddedTool[] = [];
    const runner = {
        addTool: (def: AddedTool) => {
            added.push(def);
        },
    };
    const harness = {
        getPolicy: () => ({ blockedPatterns: [/password|passwd|card|cvv|otp|2fa|seed phrase/i] }),
    };
    const factories = new Map<string, (c: never) => unknown>();
    const c = {
        has: (name: string) => {
            if (name === 'toolRunnerService') return opts.withRunner;
            if (name === 'browserHarnessService') return opts.withHarness;
            if (name === 'eventBus') return true;
            return factories.has(name);
        },
        get: (name: string) => {
            if (name === 'eventBus') return { emit: vi.fn() };
            if (name === 'toolRunnerService') return runner;
            if (name === 'browserHarnessService') return harness;
            const f = factories.get(name);
            if (!f) throw new Error(`not registered: ${name}`);
            return (f as (cc: unknown) => unknown)(c);
        },
        registerFactory: (name: string, f: (cc: never) => unknown) => {
            factories.set(name, f);
        },
    };
    return { c, added, factories };
}

describe('phase70-browser-use', () => {
    const realFetch = globalThis.fetch;

    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        globalThis.fetch = realFetch;
        vi.unstubAllGlobals();
    });

    it('registers browserUseService + browser.act tool', () => {
        const { c, added, factories } = makeContainer({ withRunner: true, withHarness: true });
        registerPhase70(
            {
                register: (name: string, f: (cc: never) => unknown) => c.registerFactory(name, f),
                get: <T,>(name: string): T => c.get(name) as T,
                asDeps: <T>(v: unknown) => v as T,
            },
            { container: c, eventBus: c.get('eventBus'), registerWithLifecycle: () => {} } as never,
        );
        expect(factories.has('browserUseService')).toBe(true);
        // Trigger lazy factory → tool registration (boot does container.get).
        c.get('browserUseService');
        expect(added.map((t) => t.name)).toContain('browser.act');
        const tool = added.find((t) => t.name === 'browser.act');
        expect(tool?.description).toMatch(/HITL/);
        const props = (tool?.parameters['properties'] ?? {}) as Record<string, unknown>;
        expect(props).toHaveProperty('task');
    });

    it('browser.act validates task and calls sidecar (localStorage config)', async () => {
        const store = new Map<string, string>([['browserUse.sidecarUrl', 'http://localhost:3100/execute']]);
        vi.stubGlobal('localStorage', {
            getItem: (k: string) => store.get(k) ?? null,
            setItem: (k: string, v: string) => void store.set(k, v),
            removeItem: (k: string) => void store.delete(k),
        });
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: true, status: 200, text: async () => '{"screenshot":"iVBORw0KGgo="}' })) as unknown as typeof fetch,
        );
        const { c, added } = makeContainer({ withRunner: true, withHarness: false });
        registerPhase70(
            {
                register: (name: string, f: (cc: never) => unknown) =>
                    (c as { registerFactory: (n: string, ff: unknown) => void }).registerFactory(name, f as never),
                get: <T,>(name: string): T => c.get(name) as T,
                asDeps: <T>(v: unknown) => v as T,
            },
            { container: c, eventBus: c.get('eventBus'), registerWithLifecycle: () => {} } as never,
        );
        c.get('browserUseService');
        const tool = added.find((t) => t.name === 'browser.act');
        expect(tool).toBeDefined();
        const out = await tool?.run({ task: 'open https://example.com' });
        expect(out).toContain('sidecar');
        await expect(tool?.run({ task: '' })).rejects.toThrow(/task is required/);
    });

    it('degrades gracefully without toolRunnerService', () => {
        const { c, added, factories } = makeContainer({ withRunner: false, withHarness: false });
        registerPhase70(
            {
                register: (name: string, f: (cc: never) => unknown) => c.registerFactory(name, f),
                get: <T,>(name: string): T => c.get(name) as T,
                asDeps: <T>(v: unknown) => v as T,
            },
            { container: c, eventBus: c.get('eventBus'), registerWithLifecycle: () => {} } as never,
        );
        expect(factories.has('browserUseService')).toBe(true);
        expect(() => c.get('browserUseService')).not.toThrow();
        expect(added).toHaveLength(0);
    });
});
