/**
 * Autonomy runner contract.
 */
import type { DecomposedTask } from '../types/autonomy-types';

export interface IAutonomyRunner {
    runGoal(goalId: string): Promise<{ completed: number; failed: number; durationMs: number }>;
    autoDecompose(goalId: string, instructions: string): Promise<DecomposedTask[]>;
}
