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

// ── Существовавший контракт (легаси) — восстановлен после перезаписи ──
import type {
    RuntimeStatus,
    RuntimeRunResult,
    RuntimeProgress,
    ProjectExecutionContext,
    AgentRuntimeEvent,
} from '../types/runtime-types';
import type { ProjectId, ProjectTask } from '../types/project-types';

/**
 * IAgentProjectRuntime — проектный агентный рантайм (roadmapp.md §P3).
 * Используется AgentProjectRuntime / AutonomyRunner.
 */
export interface IAgentProjectRuntime {
    init(projectId: ProjectId): Promise<void>;
    runTask(
        projectId: ProjectId,
        taskId: string,
        agentId: string,
        task: ProjectTask,
        context?: Partial<ProjectExecutionContext>,
    ): Promise<RuntimeRunResult>;
    runPrompt(
        projectId: ProjectId,
        agentId: string,
        prompt: string,
        context?: Partial<ProjectExecutionContext>,
    ): Promise<RuntimeRunResult>;
    pause(projectId: ProjectId): Promise<void>;
    resume(projectId: ProjectId): Promise<void>;
    getStatus(projectId: ProjectId): RuntimeStatus;
    getProgress(projectId: ProjectId): Promise<RuntimeProgress>;
    getEvents(projectId: ProjectId, limit?: number): AgentRuntimeEvent[];
}
