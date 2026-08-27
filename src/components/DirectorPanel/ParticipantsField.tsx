import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { agentService } from '../../kernel/instances/services-core';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import AgentIdentityChip from './AgentIdentityChip';

export interface ParticipantInput {
    id: string;
    /** Per-conversation role — distinct from the agent's base role. */
    role: string;
}

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

const ParticipantsField: React.FC<{
    value: ParticipantInput[];
    onChange: (next: ParticipantInput[]) => void;
}> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const [selected, setSelected] = useState('');

    const agents = agentService.getAgents();
    const available = agents.filter((a) => !value.some((p) => p.id === a.id));

    const identities = useMemo(() => value.map((p) => resolveAgentIdentity(p.id)), [value]);
    const selectedIdentity = useMemo(
        () => (selected ? resolveAgentIdentity(selected) : null),
        [selected],
    );

    const update = (cb: (p: ParticipantInput, i: number) => ParticipantInput) =>
        onChange(value.map((p, i) => cb(p, i)));
    const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
    const addSelected = () => {
        const agent = agents.find((a) => a.id === selected);
        if (!agent) return;
        // Keep `{ id, role }` — `role` is the per-conversation role, the agent
        // identity itself is resolved live from `id` everywhere it is shown.
        onChange([...value, { id: agent.id, role: agent.role }]);
        setSelected('');
    };

    return (
        <div>
            <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                {t('director.configure.participants')}
            </div>

            {value.map((p, idx) => (
                <div
                    key={idx}
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        padding: '0.5rem',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.2)',
                    }}
                >
                    <AgentIdentityChip identity={identities[idx]!} showDetails />
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flex: 1 }}>
                        <span style={{ fontSize: '0.72rem', opacity: 0.6, whiteSpace: 'nowrap' }}>
                            {t('director.configure.conversation_role')}:
                        </span>
                        <input
                            aria-label={t('director.configure.conversation_role')}
                            value={p.role}
                            onChange={(e) =>
                                update((cur, i) =>
                                    i === idx ? { ...cur, role: e.target.value } : cur,
                                )
                            }
                            placeholder={t('director.configure.conversation_role')}
                            style={{ ...inputStyle, flex: 1 }}
                        />
                        <button
                            onClick={() => remove(idx)}
                            aria-label={t('director.configure.remove')}
                            style={btnStyle('#ef4444')}
                        >
                            {t('director.configure.remove')}
                        </button>
                    </div>
                </div>
            ))}

            <div
                style={{
                    display: 'flex',
                    gap: '0.4rem',
                    marginTop: '0.2rem',
                    alignItems: 'center',
                }}
            >
                <select
                    aria-label={t('director.configure.select_agent')}
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                >
                    <option value="">{t('director.configure.select_agent')}</option>
                    {available.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name} — {a.role}
                        </option>
                    ))}
                </select>
                <button onClick={addSelected} disabled={!selected} style={btnStyle('#3b82f6')}>
                    {t('director.configure.add_participant')}
                </button>
            </div>

            {selectedIdentity && (
                <div
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        borderRadius: 8,
                        border: '1px dashed rgba(59,130,246,0.4)',
                    }}
                >
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: 4 }}>
                        {t('director.configure.agent')}
                    </div>
                    <AgentIdentityChip identity={selectedIdentity} showDetails />
                </div>
            )}

            {agents.length === 0 && (
                <p style={{ color: 'var(--warning)', fontSize: '0.75rem', margin: '0.4rem 0 0' }}>
                    {t('director.configure.no_agents')}
                </p>
            )}
        </div>
    );
};

export default ParticipantsField;
