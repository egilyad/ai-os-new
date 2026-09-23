/**
 * Advanced autonomy types (roadmapp.md §P14).
 */

export type AutonomyPhase = 'goal' | 'planning' | 'decomposition' | 'assignment' | 'execution' | 'testing' | 'revision' | 'completed' | 'failed';

export interface AutonomyGoal {
    id: string;
    projectId: string;
    description: string;
    successCriteria: string[];
    constraints: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: AutonomyPhase;
    createdAt: number;
    updatedAt: number;
}

export interface AutonomyPlan {
    id: string;
    goalId: string;
    strategy: string;
    estimatedSteps: number;
    riskAssessment: string;
    createdAt: number;
}

export interface DecomposedTask {
    id: string;
    goalId: string;
    planId: string;
    title: string;
    description: string;
    requiredCapabilities: string[];
    estimatedDurationMs: number;
    dependencies: string[]; // other task ids
    order: number;
    status: 'pending' | 'assigned' | 'running' | 'testing' | 'revision' | 'completed' | 'failed';
    assignedAgentId?: string;
    result?: string;
    testPassed?: boolean;
    revisionCount: number;
    createdAt: number;
    updatedAt: number;
}

export interface AutonomyRun {
    id: string;
    goalId: string;
    phase: AutonomyPhase;
    tasksTotal: number;
    tasksCompleted: number;
    tasksFailed: number;
    startedAt: number;
    completedAt?: number;
    durationMs?: number;
}

export const PHASE_ORDER: AutonomyPhase[] = ['goal', 'planning', 'decomposition', 'assignment', 'execution', 'testing', 'revision', 'completed'];

export function nextPhase(current: AutonomyPhase): AutonomyPhase | null {
    const idx = PHASE_ORDER.indexOf(current);
    if (idx < 0 || idx >= PHASE_ORDER.length - 1) return null;
    return PHASE_ORDER[idx + 1] ?? null;
}
