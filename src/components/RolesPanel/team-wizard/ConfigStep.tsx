import React from 'react';
import type { TeamState } from './wizard-constants';

const ConfigStep: React.FC<TeamState> = ({ team, setTeam }) => (
    <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: 12 }}>
            Fine-tune how the team executes. These settings affect the behavior of the coordination
            strategy.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
            <div>
                <label
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--slate-500)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                    }}
                >
                    <span>Max Rounds</span>
                    <span style={{ color: '#60a5fa' }}>{team.executionConfig?.maxRounds || 3}</span>
                </label>
                <input
                    type="range"
                    min={1}
                    max={10}
                    value={team.executionConfig?.maxRounds || 3}
                    onChange={(e) =>
                        setTeam((prev) => ({
                            ...prev,
                            executionConfig: {
                                ...prev.executionConfig!,
                                maxRounds: parseInt(e.target.value),
                            },
                        }))
                    }
                    style={{ width: '100%' }}
                />
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.65rem',
                        color: 'var(--slate-500)',
                    }}
                >
                    <span>1</span>
                    <span>10</span>
                </div>
            </div>
            <div>
                <label
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--slate-500)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                    }}
                >
                    <span>Consensus Threshold</span>
                    <span style={{ color: 'var(--warning)' }}>
                        {(team.executionConfig?.consensusThreshold || 0.7).toFixed(1)}
                    </span>
                </label>
                <input
                    type="range"
                    min={0.5}
                    max={1}
                    step={0.1}
                    value={team.executionConfig?.consensusThreshold || 0.7}
                    onChange={(e) =>
                        setTeam((prev) => ({
                            ...prev,
                            executionConfig: {
                                ...prev.executionConfig!,
                                consensusThreshold: parseFloat(e.target.value),
                            },
                        }))
                    }
                    style={{ width: '100%' }}
                />
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.65rem',
                        color: 'var(--slate-500)',
                    }}
                >
                    <span>0.5 (easy)</span>
                    <span>1.0 (strict)</span>
                </div>
            </div>
            <div>
                <label
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--slate-500)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                    }}
                >
                    <span>Parallel Timeout (ms)</span>
                    <span style={{ color: 'var(--success)' }}>
                        {team.executionConfig?.parallelTimeout || 30000}ms
                    </span>
                </label>
                <input
                    type="range"
                    min={5000}
                    max={120000}
                    step={5000}
                    value={team.executionConfig?.parallelTimeout || 30000}
                    onChange={(e) =>
                        setTeam((prev) => ({
                            ...prev,
                            executionConfig: {
                                ...prev.executionConfig!,
                                parallelTimeout: parseInt(e.target.value),
                            },
                        }))
                    }
                    style={{ width: '100%' }}
                />
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.65rem',
                        color: 'var(--slate-500)',
                    }}
                >
                    <span>5s</span>
                    <span>120s</span>
                </div>
            </div>
        </div>
    </div>
);

export default ConfigStep;
