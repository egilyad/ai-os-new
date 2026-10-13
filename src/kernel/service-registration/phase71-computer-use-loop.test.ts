/**
 * Phase 71 registration test — computerUseLoopService + computer.use tool.
 * Tool безопасен для LLM-видимости: без свежего approvedRequestId падает
 * до первого LLM-запроса (проверяется привязкой в loop).
 */
import { describe, it, expect, vi } from 'vitest';
import { registerPhase71 } from './phase71-computer-use-loop';
import { ComputerUseLoopService } from '../services/computer/computer-use-loop-service';

interface AddedTool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    run: (args: Record<string, unknown>) => Promise<string>;
}

function makeContainer() {
    const added: AddedTool[] = [];
    const factories = new Map<string, (c: never) => unknown>();
    const c = {
        has: (name: string) =>
            name === 'eventBus' ||
            name === 'llmClientService' ||
            name === 'toolRunnerService' ||
            factories.has(name),
        get: (name: string) => {
            if (name === 'eventBus') return { emit: vi.fn() };
            if (name === 'llmClientService') return { chat: vi.fn() };
            if (name === 'toolRunnerService')
                return { addTool: (d: AddedTool) => void added.push(d) };
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

function boot() {
    const { c, added } = makeContainer();
    registerPhase71(
        {
                register: (name: string, f: (cc: never) => unknown) => c.registerFactory(name, f),
                get: <T,>(name: string): T => c.get(name) as T,
                asDeps: <T>(v: unknown) => v as T,
        },
        { container: c, eventBus: c.get('eventBus'), registerWithLifecycle: () => {} } as never,
    );
    // Триггерим lazy-фабрику (boot резолвит все сервисы).
    const svc = c.get('computerUseLoopService');
    return { svc, added };
}

describe('phase71-computer-use-loop', () => {
    it('registers the loop service + computer.use tool', () => {
        const { svc, added } = boot();
        expect(svc).toBeInstanceOf(ComputerUseLoopService);
        const tool = added.find((t) => t.name === 'computer.use');
        expect(tool).toBeDefined();
        expect(tool?.description).toMatch(/HIGH RISK/);
        expect(tool?.description).toMatch(/approvedRequestId/);
    });

    it('computer.use rejects calls without approval before any LLM traffic', async () => {
        const { added } = boot();
        const tool = added.find((t) => t.name === 'computer.use');
        expect(tool).toBeDefined();
        await expect(tool?.run({ task: 'do evil' })).rejects.toThrow(/HITL approval required/);
        await expect(tool?.run({ task: '' })).rejects.toThrow(/task is required/);
    });
});
