import { describe, expect, it, vi } from 'vitest';
import { AgentRuntime } from './agent-runtime';
import { AgentSecurityGuard } from '../security/agent-security-guard';
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

    it('securityGuard блокирует утечку секретов в промпт', async () => {
        const callLlm = vi.fn(async () => ({ content: 'should not be called' }));
        const runtime = new AgentRuntime({
            callLlm,
            securityGuard: new AgentSecurityGuard(),
        });
        const res = await runtime.run({ text: 'my key is sk-abcdefghijklmnopqrstuvwxyz123456' }, { role: 'r' });
        expect(res.status).toBe('error');
        expect(callLlm).not.toHaveBeenCalled();
    });

    it('asCrew прогоняет агентов последовательно', async () => {
        const outputs = ['step1', 'step2'];
        const runtime = new AgentRuntime({
            callLlm: vi.fn(async () => ({ content: outputs.shift()! })),
        });
        const crew = runtime.asCrew();
        const result = await crew.run([{ role: 'a1' }, { role: 'a2' }], { text: 'start' });
        expect(result).toBe('step2');
    });
});
