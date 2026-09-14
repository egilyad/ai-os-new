/**
 * Agent runtime types (roadmapp.md §P3).
 */
import type { ProjectId, ProjectTask, ProjectRun } from './project-types';

export type RuntimeStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface AgentRuntimeEvent {
    type: 'tool:start' | 'tool:complete' | 'tool:error' | 'llm:start' | 'llm:complete' | 'task:start' | 'task:complete' | 'task:error' | 'runtime:status';
    agentId: string;
    projectId: ProjectId;
    taskId?: string;
    tool?: string;
    message?: string;
    timestamp: number;
}

export interface ProjectExecutionContext {
    projectId: ProjectId;
    agentId: string;
    systemPrompt: string;
    maxRounds: number;
    availableTools: string[];
}

export interface RuntimeRunResult {
    runId: string;
    taskId: string;
    status: 'completed' | 'failed';
    output: string;
    toolCalls: Array<{ tool: string; args: Record<string, unknown>; result?: string; error?: string }>;
    error?: string;
    duration: number;
}

export interface RuntimeProgress {
    projectId: ProjectId;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    runningTaskId: string | null;
    events: AgentRuntimeEvent[];
}
