/**
 * Phase 74 registration test — workflow distillation service + agent tool.
 */
import { describe, it, expect, vi } from 'vitest';
import { registerPhase74 } from './phase74-workflow-distill';
import type { SessionMemoryRecord } from '../contracts/session-memory';

interface ToolDef {
    name: string;
    run: (args: Record<string, unknown>) => Promise<string>;
}

function boot(rec: SessionMemoryRecord | null) {
    const factories = new Map<string, (c: unknown) => unknown>();
    const tools = new Map<string, ToolDef>();
    const session = { get: () => rec ?? undefined };
    const lt = { remember: vi.fn(async () => ({ id: 'mem1' })) };
    const sop = { defineSop: vi.fn(async (n: string) => ({ id: 'sop1', name: n, phases: [] })) };
    const runner = { addTool: (def: ToolDef) => tools.set(def.name, def) };

    const c = {
        has: (name: string) =>
            ['sessionMemoryService', 'ltMemoryService', 'sopService', 'toolRunnerService'].includes(
                name,
            ) || factories.has(name),
        get: (name: string) => {
            if (name === 'sessionMemoryService') return session;
            if (name === 'ltMemoryService') return lt;
            if (name === 'sopService') return sop;
            if (name === 'toolRunnerService') return runner;
            const f = factories.get(name);
            if (!f) throw new Error(`not registered: ${name}`);
            return f(c);
        },
        registerFactory: (name: string, f: (cc: never) => unknown) => {
            factories.set(name, f as (c: unknown) => unknown);
        },
    };

    registerPhase74(
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

    return { c, tools, lt, sop };
}

const rec: SessionMemoryRecord = {
    sessionId: 's1',
    objective: 'fix parser',
    items: [
        { kind: 'command', text: 'npm test', at: 2 },
        { kind: 'command', text: 'npm run build', at: 1 },
    ],
    createdAt: 1,
    updatedAt: 2,
};

describe('phase74-workflow-distill', () => {
    it('registers the service and tool', () => {
        const { c, tools } = boot(rec);
        expect(c.get('workflowDistiller')).toBeTruthy();
        expect(tools.has('workflow.distill')).toBe(true);
    });

    it('distills and persists through the tool', async () => {
        const { tools, lt } = boot(rec);
        const out = await tools.get('workflow.distill')!.run({ sessionId: 's1' });
        expect(out).toContain('# Workflow: fix parser');
        expect(out).toContain('npm run build');
        expect(out).toContain('memory: mem1');
        expect(lt.remember).toHaveBeenCalled();
    });

    it('reports when there is nothing to distill', async () => {
        const { tools } = boot(null);
        const out = await tools.get('workflow.distill')!.run({ sessionId: 'nope' });
        expect(out).toContain('not enough session activity');
    });
});
