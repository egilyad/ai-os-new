import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { TurnProposal } from '../../kernel/contracts/conversation/turn';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import { agentService } from '../../kernel/instances/services-core';

const TURN_TYPES: TurnProposal['objective']['type'][] = [
    'INTRODUCE',
    'CRITIQUE',
    'RESPOND',
    'ANALYZE',
    'SUMMARIZE',
    'CHALLENGE',
    'CUSTOM',
];

const OBJECTIVE_KEY: Record<TurnProposal['objective']['type'], string> = {
    INTRODUCE: 'director.objective.introduce',
    CRITIQUE: 'director.objective.critique',
    RESPOND: 'director.objective.respond',
    ANALYZE: 'director.objective.analyze',
    SUMMARIZE: 'director.objective.summarize',
    CHALLENGE: 'director.objective.challenge',
    CUSTOM: 'director.objective.custom',
};

const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    color: 'inherit',
    padding: '0.35rem 0.5rem',
    fontSize: '0.8rem',
};

const btnStyle = (color: string): React.CSSProperties => ({
    background: 'none',
    border: `1px solid ${color}`,
    color,
    cursor: 'pointer',
    padding: '0.25rem 0.55rem',
    borderRadius: 4,
    fontSize: '0.72rem',
});

const TurnsField: React.FC<{
    value: TurnProposal[];
    participantIds: string[];
    onChange: (next: TurnProposal[]) => void;
}> = ({ value, participantIds, onChange }) => {
    const { t } = useTranslation();

    const patchTurn = (idx: number, patch: Partial<TurnProposal>) =>
        onChange(value.map((tr, i) => (i === idx ? { ...tr, ...patch } : tr)));
    const patchObjective = (idx: number, patch: Partial<TurnProposal['objective']>) =>
        onChange(
            value.map((tr, i) =>
                i === idx ? { ...tr, objective: { ...tr.objective, ...patch } } : tr,
            ),
        );

    const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
    const add = () =>
        onChange([
            ...value,
            {
                participantId: participantIds[0] ?? '',
                objective: { type: 'INTRODUCE', description: '', constraints: [] },
            },
        ]);
    const move = (idx: number, dir: -1 | 1) => {
        const target = idx + dir;
        if (target < 0 || target >= value.length) return;
        const next = [...value];
        const tmp = next[idx];
        if (!next[target] || !tmp) return;
        next[idx] = next[target]!;
        next[target] = tmp;
        onChange(next);
    };

    const setConstraint = (turnIdx: number, cIdx: number, text: string) => {
        const turn = value[turnIdx];
        if (!turn) return;
        patchObjective(turnIdx, {
            constraints: turn.objective.constraints.map((c, i) => (i === cIdx ? text : c)),
        });
    };
    const addConstraint = (turnIdx: number) => {
        const turn = value[turnIdx];
        if (!turn) return;
        patchObjective(turnIdx, { constraints: [...turn.objective.constraints, ''] });
    };
    const removeConstraint = (turnIdx: number, cIdx: number) => {
        const turn = value[turnIdx];
        if (!turn) return;
        patchObjective(turnIdx, {
            constraints: turn.objective.constraints.filter((_, i) => i !== cIdx),
        });
    };

    return (
        <div>
            <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                {t('director.configure.turns')}
            </div>
            {value.map((tr, idx) => (
                <div
                    key={idx}
                    style={{
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '0.6rem',
                        marginBottom: '0.6rem',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.4rem',
                            alignItems: 'center',
                            marginBottom: '0.4rem',
                            flexWrap: 'wrap',
                        }}
                    >
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>#{idx + 1}</span>
                        <select
                            aria-label={t('director.configure.turn_participant')}
                            value={tr.participantId}
                            onChange={(e) => patchTurn(idx, { participantId: e.target.value })}
                            style={inputStyle}
                        >
                            {participantIds.length === 0 ? (
                                <option value="">—</option>
                            ) : (
                                participantIds.map((pid) => (
                                    <option key={pid} value={pid}>
                                        {
                                            resolveAgentIdentity(pid, { resolver: agentService })
                                                .displayName
                                        }
                                    </option>
                                ))
                            )}
                        </select>
                        <select
                            aria-label={t('director.configure.turn_type')}
                            value={tr.objective.type}
                            onChange={(e) =>
                                patchObjective(idx, {
                                    type: e.target.value as TurnProposal['objective']['type'],
                                })
                            }
                            style={inputStyle}
                        >
                            {TURN_TYPES.map((ty) => (
                                <option key={ty} value={ty}>
                                    {t(OBJECTIVE_KEY[ty])}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => move(idx, -1)}
                            disabled={idx === 0}
                            aria-label={t('director.configure.move_up')}
                            style={btnStyle('#94a3b8')}
                        >
                            {t('director.configure.move_up')}
                        </button>
                        <button
                            onClick={() => move(idx, 1)}
                            disabled={idx === value.length - 1}
                            aria-label={t('director.configure.move_down')}
                            style={btnStyle('#94a3b8')}
                        >
                            {t('director.configure.move_down')}
                        </button>
                        <button
                            onClick={() => remove(idx)}
                            aria-label={t('director.configure.remove')}
                            style={btnStyle('#ef4444')}
                        >
                            {t('director.configure.remove')}
                        </button>
                    </div>
                    <textarea
                        aria-label={t('director.configure.turn_description')}
                        value={tr.objective.description}
                        onChange={(e) => patchObjective(idx, { description: e.target.value })}
                        placeholder={t('director.configure.turn_description')}
                        style={{ ...inputStyle, width: '100%' }}
                    />
                    <div style={{ marginTop: '0.4rem' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                            {t('director.configure.turn_constraints')}
                        </div>
                        {tr.objective.constraints.map((c, cIdx) => (
                            <div
                                key={cIdx}
                                style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.25rem' }}
                            >
                                <input
                                    aria-label={`${t('director.configure.turn_constraints')} ${cIdx + 1}`}
                                    value={c}
                                    onChange={(e) => setConstraint(idx, cIdx, e.target.value)}
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                                <button
                                    onClick={() => removeConstraint(idx, cIdx)}
                                    aria-label={t('director.configure.remove')}
                                    style={btnStyle('#ef4444')}
                                >
                                    {t('director.configure.remove')}
                                </button>
                            </div>
                        ))}
                        <button onClick={() => addConstraint(idx)} style={btnStyle('#10b981')}>
                            {t('director.configure.add_constraint')}
                        </button>
                    </div>
                </div>
            ))}
            <button onClick={add} style={btnStyle('#3b82f6')}>
                {t('director.configure.add_turn')}
            </button>
        </div>
    );
};

export default TurnsField;
