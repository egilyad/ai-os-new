/**
 * Agent project runtime contract (roadmapp.md §P3).
 */
import type {
    RuntimeStatus,
    RuntimeRunResult,
    RuntimeProgress,
    ProjectExecutionContext,
} from '../types/runtime-types';
import type { ProjectId, ProjectTask } from '../types/project-types';

export interface IAgentProjectRuntime {
    /** Initialize runtime for a project */
    init(projectId: ProjectId): Promise<void>;

    /** Run a single task with an agent in project context */
    runTask(
        projectId: ProjectId,
        taskId: string,
        agentId: string,
        task: ProjectTask,
        context?: Partial<ProjectExecutionContext>,
    ): Promise<RuntimeRunResult>;

    /** Run a freeform prompt (no task) */
    runPrompt(
        projectId: ProjectId,
        agentId: string,
        prompt: string,
        context?: Partial<ProjectExecutionContext>,
    ): Promise<RuntimeRunResult>;

    /** Pause the runtime */
    pause(projectId: ProjectId): Promise<void>;

    /** Resume the runtime */
    resume(projectId: ProjectId): Promise<void>;

    /** Get current status */
    getStatus(projectId: ProjectId): RuntimeStatus;

    /** Get progress (tasks completed/total) */
    getProgress(projectId: ProjectId): Promise<RuntimeProgress>;

    /** Get recent events */
    getEvents(projectId: ProjectId, limit?: number): import('../types/runtime-types').AgentRuntimeEvent[];
}
