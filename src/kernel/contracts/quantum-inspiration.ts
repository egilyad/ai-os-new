export type QuantumSolverType = 'simulated_annealing' | 'quantum_tunneling' | 'grover_search';

export interface QuantumOptimizationProblem {
    variables: Record<string, number[]>;
    constraints: { variable: string; min: number; max: number }[];
    objective: 'minimize' | 'maximize';
    temperature: number;
}

export interface QuantumSolution {
    variables: Record<string, number>;
    cost: number;
    iterations: number;
    tunnelingEvents: number;
    convergence: number; // 0-1 how close to optimal
}

export interface IQuantumInspirationService {
    solve(problem: QuantumOptimizationProblem, solver: QuantumSolverType): QuantumSolution;
    getStatus(): {
        solversAvailable: QuantumSolverType[];
        totalSolutions: number;
        avgConvergence: number;
    };
}
