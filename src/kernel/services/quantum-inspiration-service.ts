import type {
    IQuantumInspirationService,
    QuantumOptimizationProblem,
    QuantumSolution,
    QuantumSolverType,
} from '../contracts/quantum-inspiration';
import { rootLogger } from './logger-service';
import { SeededRng } from '../utils/seedable-rng';

const LOGGER = rootLogger.child('QuantumInspiration');

export class QuantumInspirationService implements IQuantumInspirationService {
    private totalSolutions = 0;
    private convergences: number[] = [];
    private _rng = new SeededRng();

    private randomInRange(min: number, max: number): number {
        return min + this._rng.next() * (max - min);
    }

    private gaussianRandom(): number {
        let u = 0,
            v = 0;
        while (u === 0) u = this._rng.next();
        while (v === 0) v = this._rng.next();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    getStatus() {
        return {
            solversAvailable: [
                'simulated_annealing' as const,
                'quantum_tunneling' as const,
                'grover_search' as const,
            ],
            totalSolutions: this.totalSolutions,
            avgConvergence:
                this.convergences.length > 0
                    ? this.convergences.reduce((a, b) => a + b, 0) / this.convergences.length
                    : 0,
        };
    }

    solve(problem: QuantumOptimizationProblem, solver: QuantumSolverType): QuantumSolution {
        switch (solver) {
            case 'simulated_annealing':
                return this.simulatedAnnealing(problem);
            case 'quantum_tunneling':
                return this.quantumTunneling(problem);
            case 'grover_search':
                return this.groverSearch(problem);
        }
    }

    private simulatedAnnealing(problem: QuantumOptimizationProblem): QuantumSolution {
        const varNames = Object.keys(problem.variables);
        const getCost = (vars: Record<string, number>): number => {
            let cost = 0;
            for (const [name, val] of Object.entries(vars)) {
                const constraint = problem.constraints.find((c) => c.variable === name);
                if (constraint) {
                    if (val < constraint.min || val > constraint.max) cost += 1000;
                    cost += Math.abs(val - (constraint.min + constraint.max) / 2);
                }
            }
            return cost;
        };

        let current: Record<string, number> = {};
        for (const name of varNames) {
            const constraint = problem.constraints.find((c) => c.variable === name);
            current[name] = constraint
                ? this.randomInRange(constraint.min, constraint.max)
                : problem.variables[name]![0]!;
        }

        let currentCost = getCost(current);
        let best = { ...current };
        let bestCost = currentCost;
        let temperature = problem.temperature || 100;
        const coolingRate = 0.95;
        let tunnelingEvents = 0;

        for (let iter = 0; iter < 1000; iter++) {
            const neighbor = { ...current };
            const varName = this._rng.pick(varNames);
            const constraint = problem.constraints.find((c) => c.variable === varName);
            const step = constraint
                ? (constraint.max - constraint.min) * 0.1 * this.gaussianRandom()
                : this.gaussianRandom();
            neighbor[varName] = (neighbor[varName] || 0) + step;
            if (constraint) {
                neighbor[varName] = Math.max(
                    constraint.min,
                    Math.min(constraint.max, neighbor[varName]),
                );
            }

            const neighborCost = getCost(neighbor);
            const delta = neighborCost - currentCost;

            if (delta < 0 || this._rng.chance(Math.exp(-delta / temperature))) {
                current = neighbor;
                currentCost = neighborCost;
                if (currentCost < bestCost) {
                    best = { ...current };
                    bestCost = currentCost;
                }
            }

            if (delta > 0 && this._rng.chance(0.01)) tunnelingEvents++;
            temperature *= coolingRate;
        }

        this.totalSolutions++;
        this.convergences.push(Math.max(0, 1 - bestCost / 10000));

        LOGGER.info('QuantumInspiration', 'Simulated annealing complete', {
            cost: bestCost,
            iterations: 1000,
            tunnelingEvents,
        });

        return {
            variables: best,
            cost: bestCost,
            iterations: 1000,
            tunnelingEvents,
            convergence: Math.max(0, 1 - bestCost / 10000),
        };
    }

    private quantumTunneling(problem: QuantumOptimizationProblem): QuantumSolution {
        const varNames = Object.keys(problem.variables);
        const getCost = (vars: Record<string, number>): number => {
            let cost = 0;
            for (const [name, val] of Object.entries(vars)) {
                const constraint = problem.constraints.find((c) => c.variable === name);
                if (constraint) {
                    if (val < constraint.min || val > constraint.max) cost += 1000;
                    cost += Math.abs(val - (constraint.min + constraint.max) / 2);
                }
            }
            return cost;
        };

        // Initialize multiple parallel solutions
        const numParticles = 10;
        const particles: Record<string, number>[] = [];
        for (let i = 0; i < numParticles; i++) {
            const p: Record<string, number> = {};
            for (const name of varNames) {
                const constraint = problem.constraints.find((c) => c.variable === name);
                p[name] = constraint
                    ? this.randomInRange(constraint.min, constraint.max)
                    : problem.variables[name]![0]!;
            }
            particles.push(p);
        }

        let globalBest = { ...particles[0] };
        let globalBestCost = getCost(globalBest);
        let tunnelingEvents = 0;

        for (let iter = 0; iter < 500; iter++) {
            for (let i = 0; i < numParticles; i++) {
                const candidate = { ...particles[i] };
                const varName = this._rng.pick(varNames);
                const constraint = problem.constraints.find((c) => c.variable === varName);

                // Quantum tunneling: occasional large jump
                if (this._rng.chance(0.05)) {
                    // Tunnel to a random far-away state
                    for (const vn of varNames) {
                        const c = problem.constraints.find((con) => con.variable === vn);
                        if (c) candidate[vn] = this.randomInRange(c.min, c.max);
                    }
                    tunnelingEvents++;
                } else {
                    const step = constraint
                        ? (constraint.max - constraint.min) * 0.05 * this.gaussianRandom()
                        : this.gaussianRandom();
                    candidate[varName] = (candidate[varName] || 0) + step;
                }

                const candidateCost = getCost(candidate);
                const currentCost = getCost(particles[i]!);
                if (candidateCost < currentCost) {
                    particles[i] = candidate;
                    if (candidateCost < globalBestCost) {
                        globalBest = { ...candidate };
                        globalBestCost = candidateCost;
                    }
                }
            }
        }

        this.totalSolutions++;
        this.convergences.push(Math.max(0, 1 - globalBestCost / 10000));

        LOGGER.info('QuantumInspiration', 'Quantum tunneling complete', {
            cost: globalBestCost,
            particles: numParticles,
            tunnelingEvents,
        });

        return {
            variables: globalBest,
            cost: globalBestCost,
            iterations: 500,
            tunnelingEvents,
            convergence: Math.max(0, 1 - globalBestCost / 10000),
        };
    }

    private groverSearch(problem: QuantumOptimizationProblem): QuantumSolution {
        // Grover-inspired: amplitude amplification through repeated sampling
        const varNames = Object.keys(problem.variables);
        const getCost = (vars: Record<string, number>): number => {
            let cost = 0;
            for (const [name, val] of Object.entries(vars)) {
                const constraint = problem.constraints.find((c) => c.variable === name);
                if (constraint) {
                    if (val < constraint.min || val > constraint.max) cost += 1000;
                    cost += Math.abs(val - (constraint.min + constraint.max) / 2);
                }
            }
            return cost;
        };

        const numSamples = 200;
        const topK = 5;
        let best: Record<string, number> = {};
        let bestCost = Infinity;
        const samples: { vars: Record<string, number>; cost: number }[] = [];

        for (let i = 0; i < numSamples; i++) {
            const vars: Record<string, number> = {};
            for (const name of varNames) {
                const constraint = problem.constraints.find((c) => c.variable === name);
                vars[name] = constraint
                    ? this.randomInRange(constraint.min, constraint.max)
                    : problem.variables[name]![0]!;
            }
            const cost = getCost(vars);
            samples.push({ vars, cost });
            if (cost < bestCost) {
                best = { ...vars };
                bestCost = cost;
            }
        }

        // Amplify: sample more around top candidates
        samples.sort((a, b) => a.cost - b.cost);
        for (let round = 0; round < 3; round++) {
            for (let t = 0; t < topK; t++) {
                if (t >= samples.length) break;
                const base = samples[t]!.vars;
                for (let i = 0; i < 10; i++) {
                    const vars: Record<string, number> = {};
                    for (const name of varNames) {
                        const constraint = problem.constraints.find((c) => c.variable === name);
                        const perturbation =
                            this.gaussianRandom() *
                            0.1 *
                            (constraint ? constraint.max - constraint.min : 1);
                        vars[name] = (base[name] || 0) + perturbation;
                        if (constraint) {
                            vars[name] = Math.max(
                                constraint.min,
                                Math.min(constraint.max, vars[name]),
                            );
                        }
                    }
                    const cost = getCost(vars);
                    if (cost < bestCost) {
                        best = { ...vars };
                        bestCost = cost;
                    }
                }
            }
        }

        this.totalSolutions++;
        this.convergences.push(Math.max(0, 1 - bestCost / 10000));

        LOGGER.info('QuantumInspiration', 'Grover search complete', {
            cost: bestCost,
            samples: numSamples,
        });

        return {
            variables: best,
            cost: bestCost,
            iterations: numSamples + 30 * topK,
            tunnelingEvents: 0,
            convergence: Math.max(0, 1 - bestCost / 10000),
        };
    }
}
