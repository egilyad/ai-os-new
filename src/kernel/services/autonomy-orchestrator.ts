/**
 * AutonomyOrchestrator — goal-driven autonomous project execution (roadmapp.md §P14).
 *
 * Flow: goal → planning → decomposition → assignment → execution → testing → revision → completion
 */
import type {
    AutonomyGoal,
    AutonomyPlan,
    DecomposedTask,
    AutonomyRun,
    AutonomyPhase,
} from '../types/autonomy-types';
import type { IProjectManagerService } from '../contracts/project';
import type { IProjectWorkspaceService } from '../contracts/project-workspace';
import { nextPhase } from '../types/autonomy-types';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AutonomyOrchestrator');

export interface IAutonomyOrchestrator {
    createGoal(projectId: string, description: string, criteria?: string[], constraints?: string[]): AutonomyGoal;
    getGoal(goalId: string): AutonomyGoal | undefined;
    listGoals(projectId: string): AutonomyGoal[];
    createPlan(goalId: string, strategy: string, estimatedSteps: number, risk?: string): AutonomyPlan;
    decomposeTasks(goalId: string, planId: string, tasks: Array<Omit<DecomposedTask, 'id' | 'goalId' | 'planId' | 'status' | 'revisionCount' | 'createdAt' | 'updatedAt'>>): DecomposedTask[];
    assignTask(taskId: string, agentId: string): void;
    startTask(taskId: string): void;
    completeTask(taskId: string, result: string): void;
    failTask(taskId: string, reason: string): void;
    runTests(taskId: string, passed: boolean): void;
    requestRevision(taskId: string): void;
    getGoalTasks(goalId: string): DecomposedTask[];
    advanceGoal(goalId: string): AutonomyPhase | null;
    getRun(goalId: string): AutonomyRun | undefined;
}

let goalCounter = 0;
let planCounter = 0;
let taskCounter = 0;
let runCounter = 0;

export class AutonomyOrchestrator implements IAutonomyOrchestrator {
    private goals = new Map<string, AutonomyGoal>();
    private plans = new Map<string, AutonomyPlan>();
    private tasks = new Map<string, DecomposedTask>();
    private runs = new Map<string, AutonomyRun>();
    private projectManager: IProjectManagerService;
    private workspace: IProjectWorkspaceService;

    constructor(projectManager: IProjectManagerService, workspace: IProjectWorkspaceService) {
        this.projectManager = projectManager;
        this.workspace = workspace;
    }

    createGoal(projectId: string, description: string, criteria: string[] = [], constraints: string[] = []): AutonomyGoal {
        const goal: AutonomyGoal = {
            id: `goal-${Date.now()}-${++goalCounter}`,
            projectId,
            description,
            successCriteria: criteria,
            constraints,
            priority: 'medium',
            status: 'goal',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.goals.set(goal.id, goal);

        this.runs.set(goal.id, {
            id: `run-${Date.now()}-${++runCounter}`,
            goalId: goal.id,
            phase: 'goal',
            tasksTotal: 0,
            tasksCompleted: 0,
            tasksFailed: 0,
            startedAt: Date.now(),
        });

        LOGGER.info('createGoal', `Goal created: "${description}" for project ${projectId}`);
        return goal;
    }

    getGoal(goalId: string): AutonomyGoal | undefined {
        return this.goals.get(goalId);
    }

    listGoals(projectId: string): AutonomyGoal[] {
        return Array.from(this.goals.values()).filter((g) => g.projectId === projectId);
    }

    createPlan(goalId: string, strategy: string, estimatedSteps: number, risk = 'Low'): AutonomyPlan {
        const plan: AutonomyPlan = {
            id: `plan-${Date.now()}-${++planCounter}`,
            goalId,
            strategy,
            estimatedSteps,
            riskAssessment: risk,
            createdAt: Date.now(),
        };
        this.plans.set(plan.id, plan);
        LOGGER.info('createPlan', `Plan created for goal ${goalId}: ${strategy}`);
        return plan;
    }

    decomposeTasks(goalId: string, planId: string, taskDefs: Array<Omit<DecomposedTask, 'id' | 'goalId' | 'planId' | 'status' | 'revisionCount' | 'createdAt' | 'updatedAt'>>): DecomposedTask[] {
        const result: DecomposedTask[] = [];

        for (const def of taskDefs) {
            const task: DecomposedTask = {
                ...def,
                id: `task-${Date.now()}-${++taskCounter}`,
                goalId,
                planId,
                status: 'pending',
                revisionCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            this.tasks.set(task.id, task);
            result.push(task);
        }

        const run = this.runs.get(goalId);
        if (run) run.tasksTotal = result.length;

        LOGGER.info('decomposeTasks', `Decomposed ${result.length} tasks for goal ${goalId}`);
        return result;
    }

    assignTask(taskId: string, agentId: string): void {
        const task = this.tasks.get(taskId);
        if (!task) throw new Error(`Task not found: ${taskId}`);
        task.assignedAgentId = agentId;
        task.status = 'assigned';
        task.updatedAt = Date.now();
    }

    startTask(taskId: string): void {
        const task = this.tasks.get(taskId);
        if (!task) throw new Error(`Task not found: ${taskId}`);
        task.status = 'running';
        task.updatedAt = Date.now();
    }

    completeTask(taskId: string, result: string): void {
        const task = this.tasks.get(taskId);
        if (!task) throw new Error(`Task not found: ${taskId}`);
        task.status = 'testing';
        task.result = result;
        task.updatedAt = Date.now();
    }

    failTask(taskId: string, reason: string): void {
        const task = this.tasks.get(taskId);
        if (!task) throw new Error(`Task not found: ${taskId}`);
        task.status = 'failed';
        task.result = reason;
        task.updatedAt = Date.now();

        const run = this.runs.get(task.goalId);
        if (run) run.tasksFailed++;
    }

    runTests(taskId: string, passed: boolean): void {
        const task = this.tasks.get(taskId);
        if (!task) throw new Error(`Task not found: ${taskId}`);
        task.testPassed = passed;

        if (passed) {
            task.status = 'completed';
            const run = this.runs.get(task.goalId);
            if (run) run.tasksCompleted++;
        } else {
            task.status = 'revision';
        }
        task.updatedAt = Date.now();
    }

    requestRevision(taskId: string): void {
        const task = this.tasks.get(taskId);
        if (!task) throw new Error(`Task not found: ${taskId}`);
        task.status = 'revision';
        task.revisionCount++;
        task.updatedAt = Date.now();
    }

    getGoalTasks(goalId: string): DecomposedTask[] {
        return Array.from(this.tasks.values()).filter((t) => t.goalId === goalId);
    }

    advanceGoal(goalId: string): AutonomyPhase | null {
        const goal = this.goals.get(goalId);
        if (!goal) throw new Error(`Goal not found: ${goalId}`);
        if (goal.status === 'completed' || goal.status === 'failed') return null;

        // Check if all tasks completed
        const tasks = this.getGoalTasks(goalId);
        const allDone = tasks.length > 0 && tasks.every((t) => t.status === 'completed');
        const anyFailed = tasks.some((t) => t.status === 'failed');

        if (allDone) {
            goal.status = 'completed';
            goal.updatedAt = Date.now();
            const run = this.runs.get(goalId);
            if (run) {
                run.phase = 'completed';
                run.completedAt = Date.now();
                run.durationMs = run.completedAt - run.startedAt;
            }
            return 'completed';
        }

        if (anyFailed) {
            goal.status = 'failed';
            goal.updatedAt = Date.now();
            return 'failed';
        }

        const next = nextPhase(goal.status);
        if (next) {
            goal.status = next;
            goal.updatedAt = Date.now();
            const run = this.runs.get(goalId);
            if (run) run.phase = next;
        }
        return next;
    }

    getRun(goalId: string): AutonomyRun | undefined {
        return this.runs.get(goalId);
    }
}
