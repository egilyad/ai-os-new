import React from 'react';
import { Layers } from 'lucide-react';
import { inputBase } from './wizard-constants';
import type { TeamState } from './wizard-constants';

const LeaderAssignment: React.FC<TeamState> = ({ team, setTeam }) => {
    const show = team.coordinationStrategy === 'hierarchical';
    return (
        <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: 12 }}>
                {show
                    ? 'Hierarchical strategy requires a team leader who delegates tasks and synthesizes results.'
                    : 'Leader assignment is only needed for the "hierarchical" strategy. Select "hierarchical" in the previous step to configure a leader.'}
            </div>
            {show ? (
                <div>
                    <label
                        style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: 'var(--slate-500)',
                            display: 'block',
                            marginBottom: 4,
                        }}
                    >
                        Select Team Leader
                    </label>
                    <select
                        value={team.leaderRoleId || ''}
                        onChange={(e) =>
                            setTeam((prev) => ({ ...prev, leaderRoleId: e.target.value }))
                        }
                        style={{
                            ...inputBase,
                            maxWidth: 400,
                        }}
                    >
                        <option value="">-- Select leader --</option>
                        {(team.roleIds || []).map((roleId) => (
                            <option key={roleId} value={roleId}>
                                {roleId}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div
                    style={{
                        padding: 16,
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 8,
                        textAlign: 'center',
                        color: 'var(--slate-500)',
                        fontSize: '0.8rem',
                    }}
                >
                    <Layers size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div>Leader assignment skipped for "{team.coordinationStrategy}" strategy</div>
                </div>
            )}
        </div>
    );
};

export default LeaderAssignment;
