import { describe, expect, it, vi } from 'vitest';
import { AgentRuntime } from './agent-runtime';
import type { ToolLoopTool } from '../tool-loop/tool-loop';

function tool(name: string): ToolLoopTool {
    return { name, description: `tool ${name}`, parameters: {} };
}

describe('AgentRuntime (SPEC_05)', () => {
    it('run вызывает LLM и возвращает output', async () => {
        const callLlm = vi.fn(async () => ({ content: 'hello from model' }));
        const runtime = new AgentRuntime({ callLlm });
        const res = await runtime.run({ text: 'hi' }, { role: 'analyst' });
        expect(res.output).toBe('hello from model');
        expect(res.status).toBe('ok');
        expect(callLlm).toHaveBeenCalled();
    });

    it('передаёт схемы инструментов в callLlm', async () => {
        const callLlm = vi.fn(async (_m: unknown, tools: ToolLoopTool[]) => ({
            content: `tools: ${tools.map((t) => t.name).join(',')}`,
        }));
        const runtime = new AgentRuntime({
            callLlm,
            toolCatalog: (name) => tool(name),
            runTool: async (name) => `ran ${name}`,
        });
        const res = await runtime.run({ text: 'use tools' }, { role: 'r', tools: ['a', 'b'] });
        expect(res.output).toContain('tools: a,b');
    });

    it('spawn создаёт хэндл, который отправляет сообщения', async () => {
        const callLlm = vi.fn(async () => ({ content: 'ok' }));
        const runtime = new AgentRuntime({ callLlm });
        const handle = await runtime.spawn({ role: 'helper' });
        expect(await handle.send({ text: 'do' })).toBe('ok');
    });

    it('отменяемый сигнал не ломает выполнение (runToolLoop сам проверяет abort)', async () => {
        const controller = new AbortController();
        const callLlm = vi.fn(async () => ({ content: 'x' }));
        const runtime = new AgentRuntime({ callLlm });
        const res = await runtime.run({ text: 'x' }, { role: 'r' }, { signal: controller.signal });
        expect(res.status).toBe('ok');
    });
});
