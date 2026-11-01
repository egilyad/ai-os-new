import { describe, expect, it, vi } from 'vitest';
import { AgentEvalDriver } from './agent-eval-driver';

describe('AgentEvalDriver', () => {
    it('прогоняет промпт через агента', async () => {
        const runtime = {
            run: vi.fn(async () => ({ output: 'agent answer', status: 'ok' })),
        };
        const driver = new AgentEvalDriver(runtime as never);
        const res = await driver.runPrompt('question');
        expect(res.output).toBe('agent answer');
        expect(runtime.run).toHaveBeenCalledWith({ text: 'question' }, { role: 'evaluator' });
    });

    it('бросает при ошибке агента', async () => {
        const runtime = {
            run: vi.fn(async () => ({ output: '', status: 'error', error: 'boom' })),
        };
        const driver = new AgentEvalDriver(runtime as never);
        await expect(driver.runPrompt('q')).rejects.toThrow(/boom/);
    });
});
