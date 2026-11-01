import type {
    AgentHandle,
    AgentRuntimeConfig,
    AgentTurnInput,
    AgentTurnResult,
    IAgentRuntime,
} from '../../contracts/agent-runtime';
import type { IAgentSecurityGuard } from '../../contracts/agent-security';
import type { IMetricsService } from '../../contracts/metrics';
import { runToolLoop, type ToolLoopCallResult, type ToolLoopMessage, type ToolLoopTool } from '../tool-loop/tool-loop';

/**
 * CrewRuntime — тонкий sequential-фасад поверх AgentRuntime (SPEC_05).
 * Прогоняет агентов по цепочке: вывод одного — вход следующего.
 */
export class CrewRuntime {
    constructor(private runtime: AgentRuntime) {}

    async run(agents: AgentRuntimeConfig[], input: AgentTurnInput): Promise<string> {
        let text = input.text;
        for (const cfg of agents) {
            const res = await this.runtime.run({ text }, cfg);
            text = res.output;
        }
        return text;
    }
}

/**
 * CouncilRuntime — лёгкий фасад «совета» (SPEC_05): собирает мнения всех
 * агентов по одному входу и объединяет их (консенсус-строка).
 */
export class CouncilRuntime {
    constructor(private runtime: AgentRuntime) {}

    async run(agents: AgentRuntimeConfig[], input: AgentTurnInput): Promise<string> {
        const opinions: string[] = [];
        for (const cfg of agents) {
            const res = await this.runtime.run(input, cfg);
            opinions.push(res.output);
        }
        return opinions.join('\n---\n');
    }
}

/**
 * ForumRuntime — лёгкий фасад асинхронного форума (SPEC_05): участники
 * обмениваются репликами вокруг темы, транскрипт передаётся следующему.
 */
export class ForumRuntime {
    constructor(private runtime: AgentRuntime) {}

    async run(topic: string, participants: AgentRuntimeConfig[], rounds = 2): Promise<string> {
        let transcript = `Topic: ${topic}\n`;
        for (let r = 0; r < rounds; r++) {
            for (const p of participants) {
                const res = await this.runtime.run({ text: transcript }, p);
                transcript += `${p.role}: ${res.output}\n`;
            }
        }
        return transcript;
    }
}

export interface AgentRuntimeDeps {
    /** Один LLM-раунд-трип (получает диалог и схемы инструментов). */
    callLlm(messages: ToolLoopMessage[], tools: ToolLoopTool[]): Promise<ToolLoopCallResult>;
    /** Резолв схемы инструмента по имени (опционально). */
    toolCatalog?(name: string): ToolLoopTool | undefined;
    /** Исполнение инструмента (опционально; default — заглушка). */
    runTool?(name: string, args: Record<string, unknown>): Promise<string>;
    /** SPEC_12: защита от утечки секретов в промпт (LLM07). */
    securityGuard?: IAgentSecurityGuard;
    /** SPEC_03: опциональный единый MetricsService. */
    metrics?: IMetricsService;
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
        const started = Date.now();
        this.deps.metrics?.inc('agent.turns');
        try {
            const systemPrompt = buildSystemPrompt(cfg);

            // SPEC_12 (LLM07): отказываемся звать LLM, если в контексте есть секреты.
            if (this.deps.securityGuard) {
                const joined = `${systemPrompt}\n${input.text}`;
                const scan = this.deps.securityGuard.detectSecretsInPrompt(joined);
                if (scan.found) {
                    this.deps.metrics?.inc('agent.errors');
                    return {
                        output: '',
                        toolCalls: [],
                        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
                        trace: [],
                        status: 'error',
                        error: 'refusing to send secrets to LLM (LLM07)',
                    };
                }
                // SPEC_12 (LLM01): предупреждаем indirect prompt injection.
                if (this.deps.securityGuard.isSuspiciousInstruction(input.text)) {
                    this.deps.metrics?.inc('agent.errors');
                    return {
                        output: '',
                        toolCalls: [],
                        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
                        trace: [],
                        status: 'error',
                        error: 'suspicious instruction detected (LLM01)',
                    };
                }
            }

            // SPEC_12 (LLM02): санитизация текста от секретов перед LLM.
            const safeText = this.deps.securityGuard
                ? this.deps.securityGuard.sanitizePromptForLLM(input.text)
                : input.text;

            const messages: ToolLoopMessage[] = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: safeText },
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
        } finally {
            this.deps.metrics?.record('agent.turn_latency', Date.now() - started);
        }
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

    asCrew(): CrewRuntime {
        return new CrewRuntime(this);
    }
    asCouncil(): CouncilRuntime {
        return new CouncilRuntime(this);
    }
    asGraph(): unknown {
        return this;
    }
    asForum(): ForumRuntime {
        return new ForumRuntime(this);
    }
}
