/**
 * Единый агентный runtime-фасад (SPEC_05 / ROADMAP_03).
 *
 * Объединяет Council/Crew/Forum/Graph/Director поверх общего цикла
 * «LLM → tool calls → execute → LLM» (уже есть `tool-loop`). Цель — один
 * движок и тонкие фасады вместо параллельных циклов управления.
 */

export interface RuntimeToolCall {
    id?: string;
    name: string;
    args: Record<string, unknown>;
}

export interface RuntimeUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

export interface RuntimeTraceStep {
    step: number;
    kind: 'llm' | 'tool' | 'memory' | 'handoff';
    tool?: string;
    summary?: string;
    durationMs?: number;
}

export interface AgentTurnInput {
    text: string;
    context?: Record<string, unknown>;
    tools?: string[];
}

export interface AgentTurnResult {
    output: string;
    toolCalls: RuntimeToolCall[];
    usage: RuntimeUsage;
    trace: RuntimeTraceStep[];
    /** 'ok' | 'error' | 'cancelled' */
    status: 'ok' | 'error' | 'cancelled';
    error?: string;
}

export interface AgentRuntimeConfig {
    role: string;
    persona?: string;
    providers?: { primary?: string; fallback?: string };
    tools?: string[];
    memory?: { types?: string[]; rag?: boolean };
    maxTurns?: number;
}

export interface AgentHandle {
    send(input: AgentTurnInput): Promise<string>;
    getState(): Record<string, unknown>;
    stop(): Promise<void>;
}

export interface IAgentRuntime {
    run(input: AgentTurnInput, cfg: AgentRuntimeConfig, opts?: { signal?: AbortSignal }): Promise<AgentTurnResult>;
    spawn(cfg: AgentRuntimeConfig): Promise<AgentHandle>;
    asCrew(crewCfg: unknown): unknown;
    asCouncil(councilCfg: unknown): unknown;
    asGraph(graphCfg: unknown): unknown;
    asForum(forumCfg: unknown): unknown;
}
