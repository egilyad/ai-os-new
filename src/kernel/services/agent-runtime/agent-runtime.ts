import type {
    AgentHandle,
    AgentRuntimeConfig,
    AgentTurnInput,
    AgentTurnResult,
    IAgentRuntime,
} from '../../contracts/agent-runtime';
import { runToolLoop, type ToolLoopCallResult, type ToolLoopMessage, type ToolLoopTool } from '../tool-loop/tool-loop';

export interface AgentRuntimeDeps {
    /** Один LLM-раунд-трип (получает диалог и схемы инструментов). */
    callLlm(messages: ToolLoopMessage[], tools: ToolLoopTool[]): Promise<ToolLoopCallResult>;
    /** Резолв схемы инструмента по имени (опционально). */
    toolCatalog?(name: string): ToolLoopTool | undefined;
    /** Исполнение инструмента (опционально; default — заглушка). */
    runTool?(name: string, args: Record<string, unknown>): Promise<string>;
}

function buildSystemPrompt(cfg: AgentRuntimeConfig): string {
    const parts: string[] = [];
    parts.push(`You are an agent with the role: ${cfg.role}.`);
    if (cfg.persona) parts.push(`Persona: ${cfg.persona}`);
    if (cfg.memory?.types?.length) {
        parts.push(`Memory types available: ${cfg.memory.types.join(', ')}`);
    }
    return parts.join('\n');
}

/**
 * AgentRuntime — базовая реализация IAgentRuntime поверх общего tool-loop
 * (SPEC_05). Фасады asCrew/asCouncil/asGraph/asForum пока возвращают сам
 * объект (тонкие надстройки — следующий шаг).
 */
export class AgentRuntime implements IAgentRuntime {
    constructor(private deps: AgentRuntimeDeps) {}

    async run(
        input: AgentTurnInput,
        cfg: AgentRuntimeConfig,
        opts?: { signal?: AbortSignal },
    ): Promise<AgentTurnResult> {
        const messages: ToolLoopMessage[] = [
            { role: 'system', content: buildSystemPrompt(cfg) },
            { role: 'user', content: input.text },
        ];

        const toolDefs = (cfg.tools ?? [])
            .map((name) => this.deps.toolCatalog?.(name))
            .filter((t): t is ToolLoopTool => Boolean(t));

        const result = await runToolLoop(
            messages,
            (msgs, tools) => this.deps.callLlm(msgs, tools),
            {
                tools: toolDefs,
                runTool: async (name, args) => {
                    if (this.deps.runTool) return this.deps.runTool(name, args);
                    return `Tool ${name} is not available in this runtime.`;
                },
                maxRounds: cfg.maxTurns,
                signal: opts?.signal,
            },
        );

        return {
            output: result.content,
            toolCalls: [],
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            trace: result.toolCalls.map((name, i) => ({
                step: i + 1,
                kind: 'tool',
                tool: name,
            })),
            status: 'ok',
        };
    }

    async spawn(cfg: AgentRuntimeConfig): Promise<AgentHandle> {
        const runtime = this;
        return {
            send: async (input) => {
                const res = await runtime.run(input, cfg);
                return res.output;
            },
            getState: () => ({ role: cfg.role }),
            stop: async () => {},
        };
    }

    asCrew(): unknown {
        return this;
    }
    asCouncil(): unknown {
        return this;
    }
    asGraph(): unknown {
        return this;
    }
    asForum(): unknown {
        return this;
    }
}
