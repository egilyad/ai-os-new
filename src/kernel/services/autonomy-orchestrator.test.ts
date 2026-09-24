/**
 * AutonomyOrchestrator tests — goal → planning → decomposition → assignment → execution → testing → revision → completion.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- stub services cast to real types */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutonomyOrchestrator } from './autonomy-orchestrator';
import { nextPhase } from '../types/autonomy-types';

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

function mockWS() {
    return {
        writeFile: vi.fn(),
        readFile: vi.fn(),
        editFile: vi.fn(),
        deleteFile: vi.fn(),
        listDir: vi.fn().mockResolvedValue([]),
        getTree: vi.fn().mockResolvedValue([]),
        searchFiles: vi.fn().mockResolvedValue([]),
        grepContent: vi.fn().mockResolvedValue([]),
        copyFile: vi.fn(),
        moveFile: vi.fn(),
        mkdir: vi.fn(),
        rmdir: vi.fn(),
        getHistory: vi.fn().mockResolvedValue([]),
    } as any;
}

describe('AutonomyOrchestrator', () => {
    let orch: AutonomyOrchestrator;

    beforeEach(() => {
        orch = new AutonomyOrchestrator(mockPM() as any, mockWS());
    });

    describe('goal lifecycle', () => {
        it('creates a goal', () => {
            const goal = orch.createGoal('p1', 'Build a landing page', ['Looks good', 'Fast load']);
            expect(goal.description).toBe('Build a landing page');
            expect(goal.successCriteria).toHaveLength(2);
            expect(goal.status).toBe('goal');
        });

        it('lists goals by project', () => {
            orch.createGoal('p1', 'g1');
            orch.createGoal('p1', 'g2');
            orch.createGoal('p2', 'g3');
            expect(orch.listGoals('p1')).toHaveLength(2);
        });
    });

    describe('planning', () => {
        it('creates a plan', () => {
            const goal = orch.createGoal('p1', 'Build site');
            const plan = orch.createPlan(goal.id, 'Sequential build', 5);
            expect(plan.strategy).toBe('Sequential build');
            expect(plan.estimatedSteps).toBe(5);
        });
    });

    describe('decomposition', () => {
        it('decomposes into tasks', () => {
            const goal = orch.createGoal('p1', 'Build site');
            const plan = orch.createPlan(goal.id, 'Plan', 2);
            const tasks = orch.decomposeTasks(goal.id, plan.id, [
                { title: 'Design', description: 'Create design', requiredCapabilities: ['design'], estimatedDurationMs: 1000, dependencies: [], order: 0 },
                { title: 'Code', description: 'Write code', requiredCapabilities: ['dev'], estimatedDurationMs: 2000, dependencies: [], order: 1 },
            ]);
            expect(tasks).toHaveLength(2);
            expect(tasks[0].status).toBe('pending');
        });
    });

    describe('task execution', () => {
        it('assigns, starts, completes, and tests a task', () => {
            const goal = orch.createGoal('p1', 'Build site');
            const plan = orch.createPlan(goal.id, 'Plan', 1);
            const [task] = orch.decomposeTasks(goal.id, plan.id, [
                { title: 'T1', description: 'd', requiredCapabilities: [], estimatedDurationMs: 100, dependencies: [], order: 0 },
            ]);

            orch.assignTask(task.id, 'agent-1');
            expect(orch.getGoalTasks(goal.id)[0].status).toBe('assigned');

            orch.startTask(task.id);
            expect(orch.getGoalTasks(goal.id)[0].status).toBe('running');

            orch.completeTask(task.id, 'Done');
            expect(orch.getGoalTasks(goal.id)[0].status).toBe('testing');

            orch.runTests(task.id, true);
            expect(orch.getGoalTasks(goal.id)[0].status).toBe('completed');
        });

        it('handles test failure and revision', () => {
            const goal = orch.createGoal('p1', 'Build site');
            const plan = orch.createPlan(goal.id, 'Plan', 1);
            const [task] = orch.decomposeTasks(goal.id, plan.id, [
                { title: 'T1', description: 'd', requiredCapabilities: [], estimatedDurationMs: 100, dependencies: [], order: 0 },
            ]);

            orch.assignTask(task.id, 'agent-1');
            orch.startTask(task.id);
            orch.completeTask(task.id, 'Done');
            orch.runTests(task.id, false);
            expect(orch.getGoalTasks(goal.id)[0].status).toBe('revision');

            orch.requestRevision(task.id);
            expect(orch.getGoalTasks(goal.id)[0].revisionCount).toBe(1);
        });

        it('fails a task', () => {
            const goal = orch.createGoal('p1', 'Build site');
            const plan = orch.createPlan(goal.id, 'Plan', 1);
            const [task] = orch.decomposeTasks(goal.id, plan.id, [
                { title: 'T1', description: 'd', requiredCapabilities: [], estimatedDurationMs: 100, dependencies: [], order: 0 },
            ]);

            orch.startTask(task.id);
            orch.failTask(task.id, 'Error');
            expect(orch.getGoalTasks(goal.id)[0].status).toBe('failed');
        });
    });

    describe('goal advancement', () => {
        it('advances through phases', () => {
            const goal = orch.createGoal('p1', 'Build site');
            expect(orch.advanceGoal(goal.id)).toBe('planning');
            expect(orch.advanceGoal(goal.id)).toBe('decomposition');
            expect(orch.advanceGoal(goal.id)).toBe('assignment');
            expect(orch.advanceGoal(goal.id)).toBe('execution');
        });

        it('completes when all tasks done', () => {
            const goal = orch.createGoal('p1', 'Build site');
            const plan = orch.createPlan(goal.id, 'Plan', 1);
            const [task] = orch.decomposeTasks(goal.id, plan.id, [
                { title: 'T1', description: 'd', requiredCapabilities: [], estimatedDurationMs: 100, dependencies: [], order: 0 },
            ]);

            // Advance to execution
            for (let i = 0; i < 4; i++) orch.advanceGoal(goal.id);

            orch.assignTask(task.id, 'agent-1');
            orch.startTask(task.id);
            orch.completeTask(task.id, 'Done');
            orch.runTests(task.id, true);

            const result = orch.advanceGoal(goal.id);
            expect(result).toBe('completed');
            expect(orch.getGoal(goal.id)!.status).toBe('completed');
        });

        it('returns null for completed goals', () => {
            const goal = orch.createGoal('p1', 'Build site');
            orch.advanceGoal(goal.id); // planning
            orch.advanceGoal(goal.id); // decomposition
            orch.advanceGoal(goal.id); // assignment
            orch.advanceGoal(goal.id); // execution
            orch.advanceGoal(goal.id); // testing
            orch.advanceGoal(goal.id); // revision
            orch.advanceGoal(goal.id); // completed
            expect(orch.advanceGoal(goal.id)).toBeNull();
        });
    });

    describe('run tracking', () => {
        it('tracks run progress', () => {
            const goal = orch.createGoal('p1', 'Build site');
            const plan = orch.createPlan(goal.id, 'Plan', 2);
            orch.decomposeTasks(goal.id, plan.id, [
                { title: 'T1', description: 'd', requiredCapabilities: [], estimatedDurationMs: 100, dependencies: [], order: 0 },
                { title: 'T2', description: 'd', requiredCapabilities: [], estimatedDurationMs: 100, dependencies: [], order: 1 },
            ]);

            const run = orch.getRun(goal.id)!;
            expect(run.tasksTotal).toBe(2);
            expect(run.tasksCompleted).toBe(0);
        });
    });
});

describe('nextPhase', () => {
    it('returns next phase in order', () => {
        expect(nextPhase('goal')).toBe('planning');
        expect(nextPhase('planning')).toBe('decomposition');
        expect(nextPhase('revision')).toBe('completed');
        expect(nextPhase('completed')).toBeNull();
    });
});
