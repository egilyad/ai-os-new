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
import type { ProjectService } from './project-service';
import type { ProjectWorkspaceService } from './project-workspace-service';
import type { IEventBus } from '../types/interfaces';
import { FILE_TOOLS } from './file-toolset';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AgentProjectRuntime');

interface ProjectRuntimeState {
    status: RuntimeStatus;
    events: AgentRuntimeEvent[];
    abortController: AbortController | null;
}

function genId(prefix: string): string {
    return `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Runs interrupted by a reload (same 5-minute zombie rule as debates). */
const STALE_RUN_MS = 5 * 60 * 1000;

/**
 * P2 join: runWithTools returns tool NAMES only; full args/results/errors
 * live in the P1 trail under the same runId. Names land on the run row.
 */
function toToolCallRecords(toolCalls: unknown): Array<{
    tool: string;
    args: Record<string, unknown>;
    timestamp: number;
}> {
    if (!Array.isArray(toolCalls)) return [];
    const now = Date.now();
    return toolCalls
        .filter((t): t is string => typeof t === 'string')
        .map((tool) => ({ tool, args: {}, timestamp: now }));
}

export class AgentProjectRuntime implements IAgentProjectRuntime {
    private projectService: ProjectService;
    private workspace: ProjectWorkspaceService;
    private toolRunner: { runWithTools: (prompt: string, opts?: { agentId?: string; system?: string; maxRounds?: number; link?: { runId?: string; taskId?: string } }) => Promise<{ output: string; toolCalls?: unknown[] }> };
    private eventBus?: IEventBus;
    private states = new Map<ProjectId, ProjectRuntimeState>();

    constructor(
        projectService: ProjectService,
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
        // Capture liveness BEFORE reset: a live run in this instance is slow,
        // not a zombie — the sweep below must not kill it.
        const hadLiveRun = state.status === 'running';
        state.status = 'idle';
        state.events = [];
        await this.workspace.init(projectId);
        // P2 recovery: runs left 'running' by a reload can never complete —
        // fail them loudly instead of leaving zombies behind. Cross-tab races
        // (two live tabs) are out of scope: the second tab to init wins;
        // same single-tab rule as debate sessions.
        if (!hadLiveRun) {
            try {
                const runs = await this.projectService.listRuns(projectId);
                const cutoff = Date.now() - STALE_RUN_MS;
                for (const run of runs) {
                    if (run.status === 'running' && run.startedAt < cutoff) {
                        await this.projectService
                            .completeRun(run.id, 'failed', 'interrupted by reload')
                            .catch((e: unknown) => {
                                LOGGER.warn('AgentProjectRuntime', 'zombie sweep failed', {
                                    runId: run.id,
                                    error: e instanceof Error ? e.message : String(e),
                                });
                            });
                    }
                }
            } catch (e) {
                // observability only — init must not fail because of the sweep
                LOGGER.warn('AgentProjectRuntime', 'zombie sweep failed', {
                    projectId,
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
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

        this.emitEvent({ type: 'task:start', agentId, projectId, taskId, message: task.title, timestamp: startTime });

        // P2: the run row comes FIRST — its id joins every P1 trail record below.
        const run = await this.projectService.startRun(taskId, agentId);

        try {
            // Update project task status
            await this.projectService.updateTaskStatus(taskId, 'running');

            // Build system prompt with project context (get validates existence)
            void (await this.projectService.get(projectId));
            const systemPrompt = this.buildSystemPrompt(projectId, agentId, context?.systemPrompt);

            // Build task prompt with workspace context
            const taskPrompt = this.buildTaskPrompt(task, projectId);

            // Run the agentic loop
            this.emitEvent({ type: 'llm:start', agentId, projectId, taskId, timestamp: Date.now() });

            const result = await this.toolRunner.runWithTools(taskPrompt, {
                agentId,
                system: systemPrompt,
                maxRounds: context?.maxRounds ?? 5,
                link: { runId: run.id, taskId },
            });

            this.emitEvent({ type: 'llm:complete', agentId, projectId, taskId, message: result.output.slice(0, 200), timestamp: Date.now() });

            // Complete task + run (names here, full args/results in the P1 trail under run.id)
            const toolCallRecords = toToolCallRecords(result.toolCalls);
            await this.projectService.updateTaskStatus(taskId, 'completed', result.output);
            await this.projectService.completeRun(run.id, 'completed', undefined, toolCallRecords);

            const duration = Date.now() - startTime;
            state.status = 'idle';

            const runResult: RuntimeRunResult = {
                runId: run.id,
                taskId,
                status: 'completed',
                output: result.output,
                toolCalls: toolCallRecords,
                duration,
            };

            this.emitEvent({ type: 'task:complete', agentId, projectId, taskId, message: `completed in ${duration}ms`, timestamp: Date.now() });

            return runResult;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            const duration = Date.now() - startTime;

            // Finalization failures are diagnosable (warn) but never replace
            // the original task error in the returned result.
            await this.projectService
                .completeRun(run.id, 'failed', msg)
                .catch((e: unknown) => {
                    LOGGER.warn('AgentProjectRuntime', 'completeRun failed', {
                        runId: run.id,
                        taskId,
                        error: e instanceof Error ? e.message : String(e),
                    });
                });
            await this.projectService
                .updateTaskStatus(taskId, 'failed', msg)
                .catch((e: unknown) => {
                    LOGGER.warn('AgentProjectRuntime', 'updateTaskStatus failed', {
                        taskId,
                        error: e instanceof Error ? e.message : String(e),
                    });
                });
            state.status = 'failed';
            this.emitEvent({ type: 'task:error', agentId, projectId, taskId, message: msg, timestamp: Date.now() });

            return {
                runId: run.id,
                taskId,
                status: 'failed',
                output: '',
                toolCalls: [],
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
            completedTasks: tasks.filter((t) => t.status === 'completed').length,
            failedTasks: tasks.filter((t) => t.status === 'failed').length,
            runningTaskId: tasks.find((t) => t.status === 'running')?.id ?? null,
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
