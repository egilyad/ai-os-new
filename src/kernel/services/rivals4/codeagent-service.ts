/**
 * CodeAgentService — I.3 (SmolAgents-style code-as-action, browser-adapted).
 *
 * The LLM writes mini-DSL lines `tool.name({...json...})` (or fenced
 * ```code blocks); each line parses to a ToolRunner call whose output becomes
 * the observation. Final line without a tool call is the answer. No raw
 * code execution — the browser-safe adaptation of the pattern.
 */
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolRunnerService } from '../../contracts/parity';
import type { ICodeAgentService } from '../../contracts/rivals4';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('CodeAgent');

const CODE_LINE = /^([a-zA-Z0-9_.-]+)\s*\((.*)\)\s*;?\s*$/;

export class CodeAgentService implements ICodeAgentService {
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

    async run(task: string, maxSteps = 8): Promise<{ answer: string; steps: string[] }> {
        const steps: string[] = [];
        const available = this.tools
            ? this.tools.listTools().map((t) => t.name).join(', ')
            : '(no tools)';
        const cap = Math.max(1, Math.min(15, maxSteps));
        for (let i = 0; i < cap; i++) {
            const code = await this.writeCode(task, steps, available, i === cap - 1);
            let acted = false;
            for (const line of code.split('\n')) {
                const trimmed = line.trim().replace(/^```[a-z]*|```$/g, '').trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const m = trimmed.match(CODE_LINE);
                if (!m) continue;
                const [, tool, rawArgs] = m as [string, string, string];
                let args: Record<string, unknown> = {};
                try {
                    args = rawArgs.trim() ? (JSON.parse(rawArgs) as Record<string, unknown>) : {};
                } catch {
                    steps.push(`parse-error: ${trimmed.slice(0, 160)}`);
                    continue;
                }
                const observation = await this.execute(tool as string, args);
                steps.push(`${tool as string} → ${observation.slice(0, 300)}`);
                acted = true;
                this.events.emit(EVENTS.SMOL_STEP, { tool: tool as string });
            }
            if (!acted) {
                return { answer: code.trim().slice(0, 4000) || '(empty answer)', steps };
            }
        }
        return { answer: `Stopped after ${cap} steps without a final answer.`, steps };
    }

    private async writeCode(task: string, steps: string[], available: string, last: boolean): Promise<string> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        {
                            role: 'system',
                            content:
                                `You act by writing code lines. Each line is either TOOL(args-json) using one of: ${available.slice(0, 1200)} ` +
                                    `or a plain-text final answer (no tool call). ` +
                                    `${last ? 'LAST STEP: give the final answer, no tool calls.' : 'Prefer tool calls that move the task forward.'}`,
                        },
                        {
                            role: 'user',
                            content: `Task: ${task.slice(0, 2000)}\nHistory:\n${steps.slice(-8).join('\n').slice(0, 3000) || '(none)'}`,
                        },
                    ],
                    { temperature: 0.3, maxTokens: 700 },
                );
                if (!res.error) return res.content;
            } catch (e) {
                LOGGER.warn('code write failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return `Final answer (offline): ${task.slice(0, 300)}`;
    }

    private async execute(tool: string, args: Record<string, unknown>): Promise<string> {
        if (!this.tools) return '(no tool runner)';
        try {
            return await this.tools.callTool('code-agent', tool, args);
        } catch (e) {
            return `ERROR: ${e instanceof Error ? e.message : String(e)}`;
        }
    }
}
