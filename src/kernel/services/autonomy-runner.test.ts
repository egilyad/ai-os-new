/**
 * AutonomyRunner tests — wires orchestrator to real runtime.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- stub services cast to real types */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutonomyRunner } from './autonomy-runner';
import { AutonomyOrchestrator } from './autonomy-orchestrator';
import { ProjectWorkspaceService } from './project-workspace-service';
import { SuperAgentsDB } from './dexie-schema';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function mockPM() {
    return {
        getProject: vi.fn().mockResolvedValue({ id: 'p1', name: 'Test' }),
        listProjects: vi.fn().mockResolvedValue([]),
        createProject: vi.fn(),
        updateProject: vi.fn(),
        deleteProject: vi.fn(),
        assignAgent: vi.fn(),
        unassignAgent: vi.fn(),
        getAgents: vi.fn(),
        createTask: vi.fn(),
        updateTask: vi.fn(),
        listTasks: vi.fn(),
        startRun: vi.fn(),
        completeRun: vi.fn(),
        getRun: vi.fn(),
        listRuns: vi.fn(),
        addMemory: vi.fn(),
        getMemories: vi.fn(),
        searchMemories: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
    };
}

function mockEventBus() {
    return {
        on: vi.fn(), off: vi.fn(), emit: vi.fn(), emitOnce: vi.fn(), once: vi.fn(),
        onSafe: vi.fn().mockReturnValue(vi.fn()), subscribeAll: vi.fn().mockReturnValue(vi.fn()),
        getSubscriptionStats: vi.fn(),
    } as any;
}

let db: SuperAgentsDB;
let ws: ProjectWorkspaceService;
let orch: AutonomyOrchestrator;
let runner: AutonomyRunner;

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
    ws = new ProjectWorkspaceService(db as any);
    orch = new AutonomyOrchestrator(mockPM() as any, ws);

    // Stub runtime that echoes the prompt
    const stubRuntime = {
        execute: vi.fn().mockImplementation(async (_pid: string, prompt: string) => ({
            output: `Executed: ${prompt.slice(0, 50)}`,
        })),
        getStatus: vi.fn().mockReturnValue('idle'),
        pause: vi.fn(),
        resume: vi.fn(),
        abort: vi.fn(),
        getEvents: vi.fn().mockReturnValue([]),
        on: vi.fn(),
    };

    runner = new AutonomyRunner(orch, stubRuntime as any, ws, mockEventBus());
});

describe('AutonomyRunner', () => {
    it('auto-decomposes instructions into tasks', async () => {
        const goal = orch.createGoal('p1', 'Build a website');
        const tasks = await runner.autoDecompose(goal.id, '1. Create HTML\n2. Add CSS\n3. Write JS');
        expect(tasks).toHaveLength(3);
        expect(tasks[0].title).toContain('Create HTML');
        expect(tasks[1].title).toContain('Add CSS');
    });

    it('runs a goal through real runtime and writes files', async () => {
        const goal = orch.createGoal('p1', 'Build a website');
        await runner.autoDecompose(goal.id, 'Create HTML\nAdd CSS\nWrite JS');

        // Stub runtime that outputs file patterns
        const fileRuntime = {
            execute: vi.fn().mockImplementation(async (_pid: string, prompt: string) => {
                if (prompt.includes('HTML')) {
                    return { output: 'FILE: /index.html\n```\n<!DOCTYPE html>\n<html><body>Hello</body></html>\n```' };
                }
                if (prompt.includes('CSS')) {
                    return { output: 'FILE: /style.css\n```\nbody { color: red; }\n```' };
                }
                return { output: 'FILE: /script.js\n```\nconsole.log("test")\n```' };
            }),
            getStatus: vi.fn().mockReturnValue('idle'),
            pause: vi.fn(), resume: vi.fn(), abort: vi.fn(),
            getEvents: vi.fn().mockReturnValue([]), on: vi.fn(),
        };

        const fileRunner = new AutonomyRunner(orch, fileRuntime as any, ws, mockEventBus());
        const result = await fileRunner.runGoal(goal.id);
        expect(result.completed).toBe(3);

        // Verify files were written to workspace
        const html = await ws.readFile('p1', '/index.html');
        expect(html).toBeDefined();
        expect(html!.content).toContain('Hello');

        const css = await ws.readFile('p1', '/style.css');
        expect(css).toBeDefined();
        expect(css!.content).toContain('color: red');

        const js = await ws.readFile('p1', '/script.js');
        expect(js).toBeDefined();
    });

    it('handles task failures gracefully', async () => {
        const goal = orch.createGoal('p1', 'Failing project');
        await runner.autoDecompose(goal.id, 'Good task');

        // Make runtime throw
        const failingRuntime = {
            execute: vi.fn().mockRejectedValue(new Error('LLM timeout')),
            getStatus: vi.fn().mockReturnValue('idle'),
            pause: vi.fn(), resume: vi.fn(), abort: vi.fn(),
            getEvents: vi.fn().mockReturnValue([]), on: vi.fn(),
        };

        const failingRunner = new AutonomyRunner(orch, failingRuntime as any, ws, mockEventBus());
        const result = await failingRunner.runGoal(goal.id);
        expect(result.completed).toBe(0);
        expect(result.failed).toBe(1);
    });
});
