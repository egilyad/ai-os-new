/**
 * AutonomyRunner — wires AutonomyOrchestrator to real AgentProjectRuntime (roadmapp.md §P14).
 *
 * When a goal is created and advanced, tasks are executed through the real agent runtime.
 * The runner manages the lifecycle: decompose → assign → execute → test → revise → complete.
 */
import type { IAutonomyOrchestrator } from '../contracts/autonomy';
import type { IAgentProjectRuntime } from '../contracts/agent-runtime';
import type { IProjectWorkspaceService } from '../contracts/project-workspace';
import type { AutonomyGoal, DecomposedTask } from '../types/autonomy-types';
import type { IEventBus } from '../types/interfaces';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AutonomyRunner');

export interface IAutonomyRunner {
    runGoal(goalId: string): Promise<{ completed: number; failed: number; durationMs: number }>;
    autoDecompose(goalId: string, instructions: string): Promise<DecomposedTask[]>;
}

export class AutonomyRunner implements IAutonomyRunner {
    private orchestrator: IAutonomyOrchestrator;
    private runtime: IAgentProjectRuntime;
    private workspace: IProjectWorkspaceService;
    private eventBus: IEventBus;
    // In-flight goal runs, aborted by destroy() so shutdown never hangs on
    // a stuck provider call (ILifecycle).
    private readonly activeRunControllers = new Set<AbortController>();

    constructor(
        orchestrator: IAutonomyOrchestrator,
        runtime: IAgentProjectRuntime,
        workspace: IProjectWorkspaceService,
        eventBus: IEventBus,
    ) {
        this.orchestrator = orchestrator;
        this.runtime = runtime;
        this.workspace = workspace;
        this.eventBus = eventBus;
    }

    async autoDecompose(goalId: string, instructions: string): Promise<DecomposedTask[]> {
        const goal = this.orchestrator.getGoal(goalId);
        if (!goal) throw new Error(`Goal not found: ${goalId}`);

        // Create a plan
        const plan = this.orchestrator.createPlan(goalId, instructions, 3);

        // Auto-generate tasks from instructions
        const taskDefs = this.parseInstructions(instructions);
        const tasks = this.orchestrator.decomposeTasks(goalId, plan.id, taskDefs);

        LOGGER.info('autoDecompose', `Decomposed ${tasks.length} tasks for goal ${goalId}`);
        return tasks;
    }

    /**
     * Race an LLM-bound promise against caller abort + remaining timeout.
     * Fast path (no signal/timeout) avoids any extra allocation.
     */
    private runPromptCancellable<T>(
        fn: () => Promise<T>,
        signal?: AbortSignal,
        timeoutMs?: number,
    ): Promise<T> {
        if (!signal && timeoutMs === undefined) return fn();
        return new Promise<T>((resolve, reject) => {
            let timer: ReturnType<typeof setTimeout> | null = null;
            const cleanup = () => {
                if (timer) clearTimeout(timer);
                signal?.removeEventListener('abort', onAbort);
            };
            const onAbort = () => {
                cleanup();
                reject(
                    signal?.reason instanceof Error
                        ? signal.reason
                        : new DOMException('Goal run aborted', 'AbortError'),
                );
            };
            if (timeoutMs !== undefined) {
                timer = setTimeout(() => {
                    cleanup();
                    reject(new DOMException('Goal run timed out', 'TimeoutError'));
                }, timeoutMs);
            }
            if (signal?.aborted) {
                onAbort();
                return;
            }
            signal?.addEventListener('abort', onAbort, { once: true });
            fn().then(
                (v) => {
                    cleanup();
                    resolve(v);
                },
                (e) => {
                    cleanup();
                    reject(e);
                },
            );
        });
    }

    async runGoal(
        goalId: string,
        opts?: { signal?: AbortSignal; timeoutMs?: number },
    ): Promise<{ completed: number; failed: number; durationMs: number }> {
        const goal = this.orchestrator.getGoal(goalId);
        if (!goal) throw new Error(`Goal not found: ${goalId}`);

        const startedAt = Date.now();
        let completed = 0;
        let failed = 0;

        // Cancellation/timeout: previously the task loop below had neither,
        // so a stuck runPrompt hung the goal forever with no way to stop it.
        // The effective signal also fires on destroy(), aborting in-flight runs.
        const runController = new AbortController();
        this.activeRunControllers.add(runController);
        const forwardAbort = () => {
            if (!runController.signal.aborted) {
                runController.abort(
                    opts?.signal?.reason ?? new DOMException('Goal run aborted', 'AbortError'),
                );
            }
        };
        opts?.signal?.addEventListener('abort', forwardAbort, { once: true });
        const signal = runController.signal;
        try {
            const throwIfAborted = () => {
                if (signal.aborted) {
                    throw new DOMException('Goal run aborted', 'AbortError');
                }
                if (opts?.timeoutMs !== undefined && Date.now() - startedAt > opts.timeoutMs) {
                    throw new DOMException('Goal run timed out', 'TimeoutError');
                }
            };

        // Get all tasks for this goal
        const tasks = this.orchestrator.getGoalTasks(goalId);
        if (tasks.length === 0) {
            LOGGER.warn('runGoal', `No tasks found for goal ${goalId}`);
            return { completed: 0, failed: 0, durationMs: 0 };
        }

        // Execute each task through the real runtime
        for (const task of tasks) {
            throwIfAborted();
            try {
                // Assign to a generic agent
                this.orchestrator.assignTask(task.id, 'autonomy-agent');
                this.orchestrator.startTask(task.id);

                // Build the prompt from the task
                const prompt = this.buildPrompt(task, goal);

                // Run through the real agent runtime, raced against
                // caller abort/timeout so a stuck provider call cannot hang
                // the whole goal.
                const result = await this.runPromptCancellable(
                    () =>
                        this.runtime.runPrompt(goal.projectId, 'autonomy-agent', prompt, {
                            maxRounds: 3,
                        }),
                    signal,
                    opts?.timeoutMs === undefined
                        ? undefined
                        : Math.max(0, opts.timeoutMs - (Date.now() - startedAt)),
                );

                // Parse output for file operations and write to workspace
                const filesWritten = await this.parseAndWriteFiles(goal.projectId, result.output);

                // Complete the task with the result
                this.orchestrator.completeTask(task.id, result.output);

                // Test: verify files were created if the task expected them
                const testPassed = filesWritten > 0 || result.output.length > 0;
                this.orchestrator.runTests(task.id, testPassed);

                completed++;
                LOGGER.info('runGoal', `Task ${task.title} completed successfully`);
            } catch (e) {
                this.orchestrator.failTask(task.id, String(e));
                failed++;
                LOGGER.error('runGoal', `Task ${task.title} failed: ${e}`);
            }
        }

        // Advance goal to completion
        if (failed === 0) {
            this.orchestrator.advanceGoal(goalId);
            this.eventBus.emit('autonomy:goal:completed', {
                goalId,
                projectId: goal.projectId,
                durationMs: Date.now() - startedAt,
            });
        } else {
            this.eventBus.emit('autonomy:goal:failed', {
                goalId,
                projectId: goal.projectId,
                reason: `${failed} tasks failed`,
            });
        }

        return { completed, failed, durationMs: Date.now() - startedAt };
        } finally {
            opts?.signal?.removeEventListener('abort', forwardAbort);
            this.activeRunControllers.delete(runController);
        }
    }

    destroy(): void {
        for (const controller of this.activeRunControllers) {
            try {
                controller.abort(new DOMException('AutonomyRunner destroyed', 'AbortError'));
            } catch {
                /* ignore */
            }
        }
        this.activeRunControllers.clear();
    }

    private buildPrompt(task: DecomposedTask, goal: AutonomyGoal): string {
        const parts = [
            `Goal: ${goal.description}`,
            `Task: ${task.title}`,
            `Description: ${task.description}`,
        ];

        if (goal.successCriteria.length > 0) {
            parts.push(`Success criteria: ${goal.successCriteria.join(', ')}`);
        }

        if (task.requiredCapabilities.length > 0) {
            parts.push(`Required skills: ${task.requiredCapabilities.join(', ')}`);
        }

        parts.push('Execute this task and produce the required output.');

        return parts.join('\n');
    }

    /**
     * Parse agent output for file patterns and write them to the workspace.
     * Looks for patterns like:
     *   FILE: /path/to/file
     *   ```content```
     * or: [file: /path] content
     */
    private async parseAndWriteFiles(projectId: string, output: string): Promise<number> {
        let filesWritten = 0;

        // Pattern 1: FILE: /path\n```content```
        const fileBlockRegex = /(?:FILE|file|File):\s*([^\n`]+)\n```[\s\S]*?```/g;
        let match;
        while ((match = fileBlockRegex.exec(output)) !== null) {
            const rawPath = match[1];
            if (!rawPath) continue;
            const path = rawPath.trim();
            const contentMatch = match[0].match(/```\w*\n([\s\S]*?)```/);
            const content = contentMatch?.[1];
            if (content !== undefined && path.startsWith('/')) {
                await this.workspace.writeFile(projectId, path, content);
                filesWritten++;
            }
        }

        // Pattern 2: [file: /path] content (until next [file: or end)
        const inlineFileRegex = /\[file:\s*([^\]]+)\]\s*([\s\S]*?)(?=\[file:|$)/g;
        while ((match = inlineFileRegex.exec(output)) !== null) {
            const rawPath = match[1];
            const rawContent = match[2];
            if (!rawPath || rawContent === undefined) continue;
            const path = rawPath.trim();
            const content = rawContent.trim();
            if (path.startsWith('/') && content.length > 0) {
                await this.workspace.writeFile(projectId, path, content);
                filesWritten++;
            }
        }

        // Pattern 3: Create file /path: content (single line or multi-line)
        const createFileRegex = /(?:Create|create|WRITE|write)\s+(?:file\s+)?(\/[^\s:]+):\s*\n?([\s\S]*?)(?=\n(?:Create|create|WRITE|write)\s|$)/g;
        while ((match = createFileRegex.exec(output)) !== null) {
            const rawPath = match[1];
            const rawContent = match[2];
            if (!rawPath || rawContent === undefined) continue;
            const path = rawPath.trim();
            const content = rawContent.trim();
            if (content.length > 0) {
                await this.workspace.writeFile(projectId, path, content);
                filesWritten++;
            }
        }

        return filesWritten;
    }

    private parseInstructions(instructions: string): Array<Omit<DecomposedTask, 'id' | 'goalId' | 'planId' | 'status' | 'revisionCount' | 'createdAt' | 'updatedAt'>> {
        // Simple instruction parser: split by newlines or numbered steps
        const lines = instructions.split('\n').filter((l) => l.trim());
        const tasks: Array<Omit<DecomposedTask, 'id' | 'goalId' | 'planId' | 'status' | 'revisionCount' | 'createdAt' | 'updatedAt'>> = [];

        for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            if (!rawLine) continue;
            const line = rawLine.trim().replace(/^\d+[.)]\s*/, '');
            if (line.length < 3) continue;

            tasks.push({
                title: line.slice(0, 60),
                description: line,
                requiredCapabilities: [],
                estimatedDurationMs: 5000,
                dependencies: i > 0 ? [tasks[i - 1]?.title ?? ''] : [],
                order: i,
            });
        }

        // If no tasks parsed, create a single task
        if (tasks.length === 0) {
            tasks.push({
                title: instructions.slice(0, 60),
                description: instructions,
                requiredCapabilities: [],
                estimatedDurationMs: 10000,
                dependencies: [],
                order: 0,
            });
        }

        return tasks;
    }
}
