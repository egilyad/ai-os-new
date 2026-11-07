import { describe, it, expect, vi } from 'vitest';
import { LlmCrewExecutor } from './llm-task-executor';

function makeInput() {
    return {
        crew: { id: 'c1', name: 'Crew 1' },
        task: { id: 't1', description: 'Do the thing', expectedOutput: 'A report' },
        role: { id: 'r1', name: 'Analyst', role: 'analysis', goal: 'analyze', backstory: 'expert' },
        context: 'Previous context',
    };
}

function makeClient(overrides: { content?: string; error?: string } = {}) {
    return {
        chat: vi.fn(async () =>
            overrides.error
                ? { content: '', error: overrides.error }
                : { content: overrides.content ?? 'generated output' },
        ),
    };
}

describe('LlmCrewExecutor', () => {
    it('executes a task through the LLM client', async () => {
        const client = makeClient();
        const executor = new LlmCrewExecutor({ client: client as never });
        const out = await executor.execute(makeInput());
        expect(out).toBe('generated output');
        expect(client.chat).toHaveBeenCalledTimes(1);
        const [messages, options] = client.chat.mock.calls[0] as [unknown[], { cacheScope: unknown }];
        expect((messages as { role: string }[])[0]!.role).toBe('system');
        expect(options.cacheScope).toEqual({ agentId: undefined, sessionId: undefined, role: 'analysis' });
    });

    it('throws when the client reports an error', async () => {
        const client = makeClient({ error: 'upstream down' });
        const executor = new LlmCrewExecutor({ client: client as never });
        await expect(executor.execute(makeInput())).rejects.toThrow(/upstream down/);
    });

    it('echo fallback returns the prompt when enabled', async () => {
        const client = makeClient({ error: 'upstream down' });
        const executor = new LlmCrewExecutor({ client: client as never, echoFallback: true });
        const out = await executor.execute(makeInput());
        expect(out).toContain('[echo fallback]');
    });

    it('appends role guidance when guideFor is provided', async () => {
        const client = makeClient();
        const guideFor = vi.fn(async () => 'Follow the rubric.');
        const executor = new LlmCrewExecutor({ client: client as never, guideFor });
        await executor.execute(makeInput());
        expect(guideFor).toHaveBeenCalledWith('analysis');
        const messages = client.chat.mock.calls[0]![0] as { content: string }[];
        expect(messages[0]!.content).toContain('Follow the rubric.');
    });
});
