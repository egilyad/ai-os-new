/**
 * ReactService — G.1 (LangChain-style ReAct, additive).
 *
 * Explicit Thought → Action → Observation loop with a visible scratchpad.
 * Actions dispatch to ToolRunner tools; the final answer synthesizes the
 * scratchpad. Offline: single thought + echo answer.
 */
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IReactService } from '../../contracts/rivals2';
import type { ReactRun, ReactStep } from '../../types/rival2-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('ReAct');

function now(): number {
    return Date.now();
}

export class ReactService implements IReactService {
    constructor(
        private events: IEventBus,
        private llm?: ILLMClientService,
        private tools?: IToolRunnerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('ReAct', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async run(task: string, maxSteps = 6): Promise<ReactRun> {
        const run: ReactRun = {
            id: genId('react'),
            task,
            steps: [],
            answer: '',
            status: 'completed',
            createdAt: now(),
        };
        const toolList = this.tools
            ? this.tools.listTools().map((t) => `${t.name}: ${t.description}`).join('\n')
            : '(no tools)';
        const steps = Math.max(1, Math.min(12, maxSteps));

        for (let i = 0; i < steps; i++) {
            const scratch = run.steps
                .map((s) => `Thought: ${s.thought}\nAction: ${s.action ?? 'none'}\nObservation: ${s.observation ?? 'none'}`)
                .join('\n');
            const turn = await this.think(task, scratch, toolList, i === steps - 1);
            run.steps.push(turn);
            this.events.emit(EVENTS.REACT_STEP, { runId: run.id, step: i + 1 });
            if (!turn.action) {
                run.answer = turn.thought;
                break;
            }
            if (this.tools) {
                try {
                    let args: Record<string, unknown> = {};
                    try {
                        args = JSON.parse(turn.args ? JSON.stringify(turn.args) : '{}') as Record<string, unknown>;
                    } catch {
                        args = {};
                    }
                    turn.observation = await this.tools.callTool('react-agent', turn.action, args);
                } catch (e) {
                    turn.observation = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
                }
            } else {
                turn.observation = '(no tools configured)';
            }
            if (i === steps - 1) {
                run.status = 'stuck';
                run.answer = `Incomplete after ${steps} steps. Last observation: ${(run.steps[run.steps.length - 1]?.observation ?? '').slice(0, 500)}`;
            }
        }
        if (!run.answer && run.steps.length > 0) {
            run.answer = run.steps[run.steps.length - 1]?.observation ?? '';
        }
        return run;
    }

    private async think(task: string, scratch: string, toolList: string, last: boolean): Promise<ReactStep> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        {
                            role: 'system',
                            content:
                                `You are a ReAct agent. Reply as JSON: {"thought":"...","action":"<tool or null>","args":{...}} or {"thought":"<final answer>","action":null}. ` +
                                `Tools:\n${toolList}\n${last ? 'This is your LAST step — answer now with action null.' : ''}`,
                        },
                        {
                            role: 'user',
                            content: `Task: ${task}\nScratchpad:\n${scratch.slice(-4000) || '(empty)'}`,
                        },
                    ],
                    { temperature: 0.3, maxTokens: 700 },
                );
                if (!res.error) {
                    const start = res.content.indexOf('{');
                    if (start >= 0) {
                        const parsed = JSON.parse(res.content.slice(start, res.content.lastIndexOf('}') + 1)) as {
                            thought?: string;
                            action?: string | null;
                            args?: Record<string, unknown>;
                        };
                        return {
                            thought: String(parsed.thought ?? res.content).slice(0, 2000),
                            action: parsed.action ?? undefined,
                            args: parsed.args,
                        };
                    }
                    return { thought: res.content.slice(0, 2000) };
                }
            } catch (e) {
                LOGGER.warn('ReAct', 'react think failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return { thought: `[echo] ${task}` };
    }
}
