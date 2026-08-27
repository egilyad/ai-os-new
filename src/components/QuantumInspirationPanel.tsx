/**
 * Cognitive-aux / research panel (Experimental).
 * Quantum-inspiration showcase — research-grade, not production surface (P1.21).
 */
import React, { useState, useCallback } from 'react';
import { usePolling } from './Common/usePolling';
import { Atom, Zap, BarChart3 } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { quantumInspirationService } from '../kernel/instances';
import type {
    QuantumOptimizationProblem,
    QuantumSolution,
    QuantumSolverType,
} from '../kernel/contracts/quantum-inspiration';

const SOLVER_NAMES: Record<QuantumSolverType, string> = {
    simulated_annealing: 'Simulated Annealing',
    quantum_tunneling: 'Quantum Tunneling',
    grover_search: 'Grover Search',
};

const SOLVER_COLORS: Record<QuantumSolverType, string> = {
    simulated_annealing: '#f59e0b',
    quantum_tunneling: '#a855f7',
    grover_search: '#3b82f6',
};

const QuantumInspirationPanelContent: React.FC = () => {
    const [status, setStatus] = useState(() => quantumInspirationService.getStatus());
    const [selectedSolver, setSelectedSolver] = useState<QuantumSolverType>('simulated_annealing');
    const [problem, setProblem] = useState<QuantumOptimizationProblem>({
        variables: { x1: [0, 10], x2: [0, 10], x3: [0, 10] },
        constraints: [
            { variable: 'x1', min: 0, max: 10 },
            { variable: 'x2', min: 0, max: 10 },
            { variable: 'x3', min: 0, max: 10 },
        ],
        objective: 'minimize',
        temperature: 100,
    });
    const [solution, setSolution] = useState<QuantumSolution | null>(null);

    const refresh = useCallback(() => {
        setStatus(quantumInspirationService.getStatus());
    }, []);

    usePolling(refresh, 3000);

    const handleSolve = () => {
        const result = quantumInspirationService.solve(problem, selectedSolver);
        setSolution(result);
        refresh();
    };

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Atom size={20} color="#a855f7" /> Quantum Inspiration Engine
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--slate-400)' }}>
                        Quantum-inspired optimization algorithms
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                        Solvers: {status.totalSolutions}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                        Avg convergence: {(status.avgConvergence * 100).toFixed(0)}%
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div
                    style={{
                        flex: 1,
                        background: 'var(--slate-900)',
                        borderRadius: 10,
                        padding: 16,
                        border: '1px solid rgba(255,255,255,0.04)',
                    }}
                >
                    <h3
                        style={{
                            margin: '0 0 12px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                        }}
                    >
                        Problem Definition
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {['x1', 'x2', 'x3'].map((v) => {
                            const c = problem.constraints.find((con) => con.variable === v);
                            return (
                                <div key={v}>
                                    <label
                                        style={{
                                            fontSize: 11,
                                            color: 'var(--slate-400)',
                                            marginBottom: 2,
                                            display: 'block',
                                        }}
                                    >
                                        {v} [{c?.min ?? 0} – {c?.max ?? 10}]
                                    </label>
                                    <input
                                        type="range"
                                        min={c?.min ?? 0}
                                        max={c?.max ?? 10}
                                        step="0.1"
                                        value={problem.variables[v]?.[0] ?? 5}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setProblem({
                                                ...problem,
                                                variables: {
                                                    ...problem.variables,
                                                    [v]: [val],
                                                },
                                            });
                                        }}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div
                    style={{
                        flex: 1,
                        background: 'var(--slate-900)',
                        borderRadius: 10,
                        padding: 16,
                        border: '1px solid rgba(255,255,255,0.04)',
                    }}
                >
                    <h3
                        style={{
                            margin: '0 0 12px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                        }}
                    >
                        Solver Configuration
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(
                            [
                                'simulated_annealing',
                                'quantum_tunneling',
                                'grover_search',
                            ] as QuantumSolverType[]
                        ).map((s) => (
                            <label
                                key={s}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    background:
                                        selectedSolver === s
                                            ? `${SOLVER_COLORS[s]}20`
                                            : 'transparent',
                                    border:
                                        selectedSolver === s
                                            ? `1px solid ${SOLVER_COLORS[s]}40`
                                            : '1px solid transparent',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="solver"
                                    checked={selectedSolver === s}
                                    onChange={() => setSelectedSolver(s)}
                                />
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: SOLVER_COLORS[s],
                                        fontWeight: 600,
                                    }}
                                >
                                    {SOLVER_NAMES[s]}
                                </span>
                            </label>
                        ))}
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <label
                            style={{
                                fontSize: 11,
                                color: 'var(--slate-400)',
                                marginBottom: 2,
                                display: 'block',
                            }}
                        >
                            Temperature: {problem.temperature}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="200"
                            value={problem.temperature}
                            onChange={(e) =>
                                setProblem({ ...problem, temperature: parseInt(e.target.value) })
                            }
                            style={{ width: '100%' }}
                        />
                    </div>
                    <button
                        onClick={handleSolve}
                        style={{
                            marginTop: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '10px 20px',
                            borderRadius: 10,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 700,
                            background: '#a855f7',
                            color: '#fff',
                            width: '100%',
                            justifyContent: 'center',
                        }}
                    >
                        <Zap size={16} /> Solve
                    </button>
                </div>
            </div>

            {solution && (
                <div
                    style={{
                        background: 'var(--slate-900)',
                        borderRadius: 10,
                        padding: 16,
                        border: '1px solid rgba(168,85,247,0.2)',
                    }}
                >
                    <h3
                        style={{
                            margin: '0 0 12px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <BarChart3 size={16} color="#a855f7" /> Solution
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 10,
                            marginBottom: 12,
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 10, color: 'var(--slate-500)' }}>Cost</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--slate-200)' }}>
                                {solution.cost.toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: 'var(--slate-500)' }}>Convergence</div>
                            <div
                                style={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: solution.convergence > 0.8 ? '#22c55e' : '#f59e0b',
                                }}
                            >
                                {(solution.convergence * 100).toFixed(0)}%
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: 'var(--slate-500)' }}>Iterations</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                                {solution.iterations}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: 'var(--slate-500)' }}>Tunneling Events</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#a855f7' }}>
                                {solution.tunnelingEvents}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                        {Object.entries(solution.variables).map(([k, v]) => (
                            <div
                                key={k}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                }}
                            >
                                <span style={{ color: 'var(--slate-500)' }}>{k}: </span>
                                <span style={{ color: 'var(--slate-200)', fontWeight: 600 }}>
                                    {v.toFixed(3)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const QuantumInspirationPanel: React.FC = () => (
    <PanelLoader name="Quantum Inspiration">
        <QuantumInspirationPanelContent />
    </PanelLoader>
);

export default QuantumInspirationPanel;
