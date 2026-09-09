import React from 'react';
import type { TeamStrategy } from '../../../kernel/contracts/role-team';
import { TEAM_STRATEGY_LABELS, STRATEGY_COLORS } from '../../../kernel/contracts/role-team';
import { card } from './wizard-constants';
import type { TeamState } from './wizard-constants';

const STRATEGIES: TeamStrategy[] = [
    'parallel',
    'sequential',
    'pipeline',
    'debate',
    'consensus',
    'hierarchical',
    'swarm',
    'tournament',
    'round-robin',
    'review',
];

const StrategyPicker: React.FC<TeamState> = ({ team, setTeam }) => (
    <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: 12 }}>
            Choose how the team coordinates to solve the task. Each strategy has different
            strengths.
        </div>
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 8,
            }}
        >
            {STRATEGIES.map((s) => {
                const active = team.coordinationStrategy === s;
                return (
                    <div
                        key={s}
                        onClick={() => setTeam((prev) => ({ ...prev, coordinationStrategy: s }))}
                        style={{
                            ...card,
                            border: active
                                ? `2px solid ${STRATEGY_COLORS[s]}`
                                : '1px solid rgba(255,255,255,0.08)',
                            background: active
                                ? `${STRATEGY_COLORS[s]}10`
                                : 'rgba(255,255,255,0.04)',
                            padding: 12,
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                            if (!active)
                                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        }}
                        onMouseLeave={(e) => {
                            if (!active)
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        }}
                    >
                        <div
                            style={{
                                fontWeight: 600,
                                color: STRATEGY_COLORS[s],
                                fontSize: '0.85rem',
                                textTransform: 'capitalize',
                                marginBottom: 4,
                            }}
                        >
                            {s}
                        </div>
                        <div
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--slate-400)',
                                lineHeight: 1.3,
                            }}
                        >
                            {TEAM_STRATEGY_LABELS[s]}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

export default StrategyPicker;
