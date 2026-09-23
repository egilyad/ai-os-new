/**
 * AgentProjectRuntime tests — project-scoped agentic loop.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentProjectRuntime } from './agent-project-runtime';
import { ProjectService } from './project-service';
import { ProjectWorkspaceService } from './project-workspace-service';
import { ProjectRepository } from '../dal/project-repository';
import { SuperAgentsDB } from './dexie-schema';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

let db: SuperAgentsDB;
let projectService: ProjectService;
let workspace: ProjectWorkspaceService;
let runtime: AgentProjectRuntime;
let mockToolRunner: { runWithTools: ReturnType<typeof vi.fn> };
const PID = 'test-project';

beforeEach(async () => {
    try { await db?.delete(); } catch { /* first test */ }
    db = new SuperAgentsDB();
    db.version(999).stores({
        projects: 'id, status, type, createdAt, updatedAt',
        projectTasks: 'id, projectId, agentId, status, priority, createdAt',
        projectRuns: 'id, taskId, projectId, agentId, status, createdAt',
        projectFiles: '[projectId+path], projectId, path',
        projectArtifacts: 'id, projectId, type, createdAt',
        projectAssignments: '[projectId+agentId], projectId, agentId',
        keyValue: 'id',
    });
    await db.open();

    const repo = new ProjectRepository(db as any);
    projectService = new ProjectService(repo);
    workspace = new ProjectWorkspaceService(db as any);

    mockToolRunner = {
        runWithTools: vi.fn(async (..._args: unknown[]) => ({ output: 'Tool output: done', toolCalls: [] as unknown[] })),
    };

    runtime = new AgentProjectRuntime(projectService, workspace, mockToolRunner);

    // Create a project
    await projectService.create({ name: 'Test', description: '', type: 'website' });
});

describe('AgentProjectRuntime', () => {
    describe('init', () => {
        it('initializes runtime for a project', async () => {
            await runtime.init(PID);
            expect(runtime.getStatus(PID)).toBe('idle');
        });
    });

    describe('runTask', () => {
        it('runs a task and marks it completed', async () => {
            await runtime.init(PID);
            const task = await projectService.createTask(PID, 'agent-1', 'Build page', 'Create index.html');

            const result = await runtime.runTask(PID, task.id, 'agent-1', task);

            expect(result.status).toBe('completed');
            expect(result.output).toBe('Tool output: done');
            expect(result.duration).toBeGreaterThan(0);
            expect(mockToolRunner.runWithTools).toHaveBeenCalledTimes(1);

            // Task should be completed
            const updatedTask = await projectService.getTask(task.id);
            expect(updatedTask!.status).toBe('completed');
        });

        it('marks task as failed on error', async () => {
            mockToolRunner.runWithTools.mockRejectedValueOnce(new Error('LLM failed'));
            await runtime.init(PID);
            const task = await projectService.createTask(PID, 'agent-1', 'Failing task', 'Will fail');

            const result = await runtime.runTask(PID, task.id, 'agent-1', task);

            expect(result.status).toBe('failed');
            expect(result.error).toContain('LLM failed');

            const updatedTask = await projectService.getTask(task.id);
            expect(updatedTask!.status).toBe('failed');
        });

        it('rejects when runtime is busy', async () => {
            mockToolRunner.runWithTools.mockImplementation(() => new Promise(() => {})); // never resolves
            await runtime.init(PID);
            const task1 = await projectService.createTask(PID, 'agent-1', 'T1', 'd1');
            const task2 = await projectService.createTask(PID, 'agent-1', 'T2', 'd2');

            // Start first task (won't complete)
            runtime.runTask(PID, task1.id, 'agent-1', task1).catch(() => {});

            // Second task should be rejected
            await expect(
                runtime.runTask(PID, task2.id, 'agent-1', task2),
            ).rejects.toThrow('Runtime is busy');
        });
    });

    describe('runPrompt', () => {
        it('runs a freeform prompt', async () => {
            await runtime.init(PID);

            const result = await runtime.runPrompt(PID, 'agent-1', 'What files are in the project?');

            expect(result.status).toBe('completed');
            expect(result.output).toBe('Tool output: done');
            expect(result.taskId).toBe('freeform');
        });

        it('returns error on failure', async () => {
            mockToolRunner.runWithTools.mockRejectedValueOnce(new Error('timeout'));
            await runtime.init(PID);

            const result = await runtime.runPrompt(PID, 'agent-1', 'Do something');

            expect(result.status).toBe('failed');
            expect(result.error).toContain('timeout');
        });
    });

    describe('pause / resume', () => {
        it('pauses and resumes', async () => {
            await runtime.init(PID);
            expect(runtime.getStatus(PID)).toBe('idle');

            // Simulate running state
            mockToolRunner.runWithTools.mockImplementation(() => new Promise(() => {}));
            const task = await projectService.createTask(PID, 'agent-1', 'T1', 'd1');
            runtime.runTask(PID, task.id, 'agent-1', task).catch(() => {});

            // Wait a tick for the task to start
            await new Promise((r) => setTimeout(r, 50));

            await runtime.pause(PID);
            expect(runtime.getStatus(PID)).toBe('paused');

            await runtime.resume(PID);
            expect(runtime.getStatus(PID)).toBe('idle');
        });
    });

    describe('getProgress', () => {
        it('reports task progress', async () => {
            await runtime.init(PID);
            await projectService.createTask(PID, 'agent-1', 'T1', 'd1');
            const t2 = await projectService.createTask(PID, 'agent-1', 'T2', 'd2');
            await projectService.updateTaskStatus(t2.id, 'completed');

            const progress = await runtime.getProgress(PID);
            expect(progress.totalTasks).toBe(2);
            expect(progress.completedTasks).toBe(1);
        });
    });

    describe('events', () => {
        it('emits events during run', async () => {
            await runtime.init(PID);
            const task = await projectService.createTask(PID, 'agent-1', 'T1', 'd1');

            await runtime.runTask(PID, task.id, 'agent-1', task);

            const events = runtime.getEvents(PID);
            expect(events.length).toBeGreaterThanOrEqual(3); // init + task:start + llm:start + llm:complete + task:complete
            expect(events.some((e) => e.type === 'task:start')).toBe(true);
            expect(events.some((e) => e.type === 'task:complete')).toBe(true);
        });
    });
});
