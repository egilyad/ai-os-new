/**
 * AgentProjectRuntime — project-scoped agentic loop (roadmapp.md §P3).
 *
 * Wraps existing ToolRunnerService.runWithTools with:
 * - Project context (workspace tools injected automatically)
 * - Task lifecycle tracking
 * - Event emission
 * - Pause/resume support
 */
import type { IAgentProjectRuntime } from '../contracts/agent-runtime';
import type {
    RuntimeStatus,
    RuntimeRunResult,
    RuntimeProgress,
    ProjectExecutionContext,
    AgentRuntimeEvent,
} from '../types/runtime-types';
import type { ProjectId, ProjectTask } from '../types/project-types';
import type { ProjectManagerService } from './project-service';
import type { ProjectWorkspaceService } from './project-workspace-service';
import type { IEventBus } from '../types/interfaces';
import { FILE_TOOLS } from './file-toolset';

interface ProjectRuntimeState {
    status: RuntimeStatus;
    events: AgentRuntimeEvent[];
    abortController: AbortController | null;
}

function genId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class AgentProjectRuntime implements IAgentProjectRuntime {
    private projectService: ProjectManagerService;
    private workspace: ProjectWorkspaceService;
    private toolRunner: { runWithTools: (prompt: string, opts?: { agentId?: string; system?: string; maxRounds?: number }) => Promise<{ output: string; toolCalls?: unknown[] }> };
    private eventBus?: IEventBus;
    private states = new Map<ProjectId, ProjectRuntimeState>();

    constructor(
        projectService: ProjectManagerService,
        workspace: ProjectWorkspaceService,
        toolRunner: { runWithTools: (...args: unknown[]) => Promise<{ output: string; toolCalls?: unknown[] }> },
        eventBus?: IEventBus,
    ) {
        this.projectService = projectService;
        this.workspace = workspace;
        this.toolRunner = toolRunner;
        this.eventBus = eventBus;
    }

    private getState(projectId: ProjectId): ProjectRuntimeState {
        let state = this.states.get(projectId);
        if (!state) {
            state = { status: 'idle', events: [], abortController: null };
            this.states.set(projectId, state);
        }
        return state;
    }

    async init(projectId: ProjectId): Promise<void> {
        const state = this.getState(projectId);
        state.status = 'idle';
        state.events = [];
        await this.workspace.init(projectId);
        this.emitEvent({ type: 'runtime:status', agentId: 'system', projectId, message: 'initialized', timestamp: Date.now() });
    }

    // ── Run task ──

    async runTask(
        projectId: ProjectId,
        taskId: string,
        agentId: string,
        task: ProjectTask,
        context?: Partial<ProjectExecutionContext>,
    ): Promise<RuntimeRunResult> {
        const state = this.getState(projectId);
        if (state.status === 'running') throw new Error('Runtime is busy — pause or wait for current run');

        state.status = 'running';
        state.abortController = new AbortController();
        const startTime = Date.now();
        const toolCalls: RuntimeRunResult['toolCalls'] = [];

        this.emitEvent({ type: 'task:start', agentId, projectId, taskId, message: task.title, timestamp: startTime });

        try {
            // Update project task status
            await this.projectService.updateTaskStatus(taskId, 'running');

            // Build system prompt with project context
            await this.projectService.get(projectId);
            const systemPrompt = this.buildSystemPrompt(projectId, agentId, context?.systemPrompt);

            // Build task prompt with workspace context
            const taskPrompt = this.buildTaskPrompt(task, projectId);

            // Run the agentic loop
            this.emitEvent({ type: 'llm:start', agentId, projectId, taskId, timestamp: Date.now() });

            const result = await this.toolRunner.runWithTools(taskPrompt, {
                agentId,
                system: systemPrompt,
                maxRounds: context?.maxRounds ?? 5,
            });

            this.emitEvent({ type: 'llm:complete', agentId, projectId, taskId, message: result.output.slice(0, 200), timestamp: Date.now() });

            // Complete task
            await this.projectService.updateTaskStatus(taskId, 'completed', result.output);

            const duration = Date.now() - startTime;
            state.status = 'idle';

            const runResult: RuntimeRunResult = {
                runId: genId('run'),
                taskId,
                status: 'completed',
                output: result.output,
                toolCalls,
                duration,
            };

            this.emitEvent({ type: 'task:complete', agentId, projectId, taskId, message: `completed in ${duration}ms`, timestamp: Date.now() });

            return runResult;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            const duration = Date.now() - startTime;

            await this.projectService.updateTaskStatus(taskId, 'failed', msg).catch(() => {});
            state.status = 'failed';
            this.emitEvent({ type: 'task:error', agentId, projectId, taskId, message: msg, timestamp: Date.now() });

            return {
                runId: genId('run'),
                taskId,
                status: 'failed',
                output: '',
                toolCalls,
                error: msg,
                duration,
            };
        }
    }

    // ── Run prompt (no task) ──

    async runPrompt(
        projectId: ProjectId,
        agentId: string,
        prompt: string,
        context?: Partial<ProjectExecutionContext>,
    ): Promise<RuntimeRunResult> {
        const state = this.getState(projectId);
        if (state.status === 'running') throw new Error('Runtime is busy');

        state.status = 'running';
        const startTime = Date.now();

        try {
            const systemPrompt = this.buildSystemPrompt(projectId, agentId, context?.systemPrompt);

            this.emitEvent({ type: 'llm:start', agentId, projectId, timestamp: Date.now() });

            const result = await this.toolRunner.runWithTools(prompt, {
                agentId,
                system: systemPrompt,
                maxRounds: context?.maxRounds ?? 5,
            });

            this.emitEvent({ type: 'llm:complete', agentId, projectId, message: result.output.slice(0, 200), timestamp: Date.now() });

            state.status = 'idle';
            const duration = Date.now() - startTime;

            return {
                runId: genId('run'),
                taskId: 'freeform',
                status: 'completed',
                output: result.output,
                toolCalls: [],
                duration,
            };
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            state.status = 'failed';
            return {
                runId: genId('run'),
                taskId: 'freeform',
                status: 'failed',
                output: '',
                toolCalls: [],
                error: msg,
                duration: Date.now() - startTime,
            };
        }
    }

    // ── Pause / Resume ──

    async pause(projectId: ProjectId): Promise<void> {
        const state = this.getState(projectId);
        if (state.status !== 'running') return;
        state.abortController?.abort();
        state.status = 'paused';
        this.emitEvent({ type: 'runtime:status', agentId: 'system', projectId, message: 'paused', timestamp: Date.now() });
    }

    async resume(projectId: ProjectId): Promise<void> {
        const state = this.getState(projectId);
        if (state.status !== 'paused') return;
        state.status = 'idle';
        this.emitEvent({ type: 'runtime:status', agentId: 'system', projectId, message: 'resumed', timestamp: Date.now() });
    }

    getStatus(projectId: ProjectId): RuntimeStatus {
        return this.getState(projectId).status;
    }

    async getProgress(projectId: ProjectId): Promise<RuntimeProgress> {
        const tasks = await this.projectService.listTasks(projectId);
        const state = this.getState(projectId);
        return {
            projectId,
            totalTasks: tasks.length,
            completedTasks: tasks.filter((t: ProjectTask) => t.status === 'completed').length,
            failedTasks: tasks.filter((t: ProjectTask) => t.status === 'failed').length,
            runningTaskId: tasks.find((t: ProjectTask) => t.status === 'running')?.id ?? null,
            events: state.events.slice(-50),
        };
    }

    getEvents(projectId: ProjectId, limit = 50): AgentRuntimeEvent[] {
        return this.getState(projectId).events.slice(-limit);
    }

    // ── Helpers ──

    private buildSystemPrompt(projectId: ProjectId, _agentId: string, base?: string): string {
        const toolList = FILE_TOOLS.map((t) => `- ${t.name}: ${t.description}`).join('\n');
        return [
            base ?? 'You are a capable coding assistant.',
            '',
            `## Project Context`,
            `You are working in project ${projectId}.`,
            `Use workspace tools to read/write/edit files.`,
            '',
            `## Available Workspace Tools`,
            toolList,
            '',
            `## Rules`,
            `- Always read files before editing them.`,
            `- Write complete, working code.`,
            `- Use project-relative paths (e.g. /src/index.html).`,
        ].join('\n');
    }

    private buildTaskPrompt(task: ProjectTask, projectId: ProjectId): string {
        return [
            `## Task: ${task.title}`,
            task.description,
            '',
            `Priority: ${task.priority}`,
            `Project: ${projectId}`,
            '',
            'Complete this task using the available workspace tools.',
        ].join('\n');
    }

    private emitEvent(event: AgentRuntimeEvent): void {
        const state = this.getState(event.projectId);
        state.events.push(event);
        if (state.events.length > 200) state.events = state.events.slice(-200);
        try {
            this.eventBus?.emit('runtime:agent:event', event);
        } catch { /* fire-and-forget */ }
    }
}
