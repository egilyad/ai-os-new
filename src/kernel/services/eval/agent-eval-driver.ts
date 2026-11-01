import type { IAgentRuntime } from '../../contracts/agent-runtime';
import type { EvalPromptResult } from '../../contracts/eval-hub';

/**
 * AgentEvalDriver — мост «EvalHub ↔ AgentRuntime».
 *
 * Позволяет прогонять eval-кейсы через агента (а не голый LLM-вызов):
 * роль агента равна 'evaluator', а его вывод — ответ на промпт.
 */
export class AgentEvalDriver {
    constructor(private runtime: IAgentRuntime) {}

    async runPrompt(prompt: string): Promise<EvalPromptResult> {
        const res = await this.runtime.run({ text: prompt }, { role: 'evaluator' });
        if (res.status === 'error') {
            throw new Error(res.error ?? 'agent evaluation failed');
        }
        return { output: res.output };
    }
}
