/**
 * CodePlanService — H.2 (TaskWeaver-style code-first plans, additive).
 *
 * The planner emits a plugin-call list (JSON: [{plugin, args}]) over the
 * ToolRunner pool; each call result is verified, failures trigger one
 * replan (up to maxRounds). Pure orchestration — plugins are ToolRunner tools.
 */
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolRunnerService } from '../../contracts/parity';
import type { ICodePlanService } from '../../contracts/rivals3';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('CodePlan');

interface PluginCall {
    plugin: string;
    args: Record<string, unknown>;
}

export class CodePlanService implements ICodePlanService {
    constructor(
        private events: IEventBus,
        private llm?: ILLMClientService,
        private tools?: IToolRunnerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async planAndRun(task: string, maxRounds = 3): Promise<{
        calls: Array<{ plugin: string; args: Record<string, unknown>; result: string }>;
        answer: string;
    }> {
        const available = this.tools
            ? this.tools.listTools().map((t) => t.name).join(', ')
            : '(no tools)';
        const rounds = Math.max(1, Math.min(5, maxRounds));
        const calls: Array<{ plugin: string; args: Record<string, unknown>; result: string }> = [];
        let context = '';
        for (let r = 0; r < rounds; r++) {
            const plan = await this.draftPlan(task, available, context);
            if (plan.length === 0) break;
            let failed = false;
            for (const call of plan.slice(0, 6)) {
                const result = await this.executeCall(call);
                calls.push({ ...call, result: result.slice(0, 2000) });
                context += `\n${call.plugin} → ${result.slice(0, 500)}\n`;
                if (result.startsWith('ERROR:')) {
                    failed = true;
                    break;
                }
            }
            this.events.emit(EVENTS.CODEPLAN_ROUND, { round: r + 1, calls: calls.length });
            if (!failed) break;
            context += '\n[REPLAN: previous calls failed — adjust the plan.]\n';
        }
        const answer = calls.length > 0
            ? `Executed ${calls.length} plugin call(s). Last: ${(calls[calls.length - 1]?.result ?? '').slice(0, 1000)}`
            : 'No plugin calls produced.';
        return { calls, answer };
    }

    private async draftPlan(task: string, available: string, context: string): Promise<PluginCall[]> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        {
                            role: 'system',
                            content:
                                `You plan plugin calls. Reply as JSON array ONLY: [{"plugin":"<name>","args":{...}}]. ` +
                                `Available plugins: ${available.slice(0, 1500)}`,
                        },
                        { role: 'user', content: `Task: ${task.slice(0, 2000)}\nContext:\n${context.slice(-2000)}` },
                    ],
                    { temperature: 0.2, maxTokens: 700 },
                );
                if (!res.error) {
                    const start = res.content.indexOf('[');
                    if (start >= 0) {
                        const parsed = JSON.parse(
                            res.content.slice(start, res.content.lastIndexOf(']') + 1),
                        ) as Array<{ plugin?: string; args?: Record<string, unknown> }>;
                        return parsed
                            .filter((p) => typeof p.plugin === 'string')
                            .map((p) => ({ plugin: p.plugin as string, args: p.args ?? {} }));
                    }
                }
            } catch (e) {
                LOGGER.warn('draft plan failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return [];
    }

    private async executeCall(call: PluginCall): Promise<string> {
        if (!this.tools) return `ERROR: no tool runner (plugin ${call.plugin} unavailable)`;
        try {
            return await this.tools.callTool('codeplan', call.plugin, call.args);
        } catch (e) {
            return `ERROR: ${e instanceof Error ? e.message : String(e)}`;
        }
    }
}
