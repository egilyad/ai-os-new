/**
 * Autonomy orchestrator contract (roadmapp.md §P14).
 */
import type { AutonomyGoal, AutonomyPlan, DecomposedTask, AutonomyRun, AutonomyPhase } from '../types/autonomy-types';

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
