import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Bot } from 'lucide-react';
import { DEBATE_ARCHETYPES } from '../../kernel/instances';

const TEMPERATURE_LABELS = [
    'Pure Logic',
    'Mostly Logic',
    'Slightly Logical',
    'Analytical',
    'Leaning Logic',
    'Balanced',
    'Leaning Emotion',
    'Passionate',
    'Very Emotional',
    'Intense',
    'Pure Emotion',
];

interface TemperatureSliderProps {
    value: number;
    onChange: (v: number) => void;
    t: (key: string) => string;
}

export const TemperatureSlider: React.FC<TemperatureSliderProps> = ({ value, onChange, t }) => (
    <div>
        <label className="debate-label debate-label--block" style={{ marginTop: 6 }}>
            {t('debate.temperature_label')}: {TEMPERATURE_LABELS[value]}
        </label>
        <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            aria-label={t('debate.temperature')}
            className="debate-input"
            style={{
                width: '100%',
                accentColor:
                    value <= 2
                        ? '#38bdf8'
                        : value <= 4
                          ? '#34d399'
                          : value <= 6
                            ? '#fbbf24'
                            : value <= 8
                              ? '#fb923c'
                              : '#ef4444',
            }}
        />
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--slate-500)',
                marginTop: 2,
            }}
        >
            <span>{t('debate.temperature_min')}</span>
            <span>{t('debate.temperature_mid')}</span>
            <span>{t('debate.temperature_max')}</span>
        </div>
    </div>
);

interface ArchetypeSelectorProps {
    agentArchetypes: Record<string, string>;
    onChange: (id: string) => void;
    t: (key: string) => string;
}

function getArchetypeDisplayName(key: string): string {
    const builtin = DEBATE_ARCHETYPES[key as keyof typeof DEBATE_ARCHETYPES];
    if (builtin) return builtin.name;
    return key.replace(/^persona-/, '').replace(/-/g, ' ');
}

export const ArchetypeSelector: React.FC<ArchetypeSelectorProps> = ({
    agentArchetypes,
    onChange,
    t,
}) => (
    <div>
        <label className="debate-label debate-label--block">{t('debate.archetype')}</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(['auto', ...Object.keys(DEBATE_ARCHETYPES)] as const).map((key) => {
                const isActive =
                    key === 'auto'
                        ? Object.keys(agentArchetypes).length === 0
                        : Object.values(agentArchetypes).includes(key);
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        style={{
                            padding: '4px 12px',
                            borderRadius: 8,
                            border: '1px solid',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            background: isActive ? 'rgba(168,85,247,0.15)' : 'transparent',
                            borderColor: isActive
                                ? 'rgba(168,85,247,0.3)'
                                : 'rgba(255,255,255,0.08)',
                            color: isActive ? '#a855f7' : '#94a3b8',
                        }}
                    >
                        {key === 'auto' ? 'Auto' : getArchetypeDisplayName(key)}
                    </button>
                );
            })}
        </div>
    </div>
);

interface ParticipantSelectorProps {
    selectedAgents: string[];
    onToggle: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    availableAgents: Array<{ id: string; label: string }>;
    t: (key: string) => string;
}

export const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
    selectedAgents,
    onToggle,
    onSelectAll,
    onDeselectAll,
    availableAgents,
    t,
}) => (
    <div>
        <label className="debate-label debate-label--flex">
            {t('debate.participants')}
            <span
                className="debate-badge"
                style={{
                    color: '#a855f7',
                    background: 'var(--purple-tint)',
                    border: '1px solid rgba(168,85,247,0.2)',
                }}
            >
                {selectedAgents.length} {t('debate.selected')}
            </span>
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
            <button
                onClick={onSelectAll}
                className="btn-ghost"
                style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.75rem',
                    color: '#a855f7',
                    border: '1px solid rgba(168,85,247,0.3)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: 'transparent',
                }}
            >
                {t('debate.select_all')}
            </button>
            <button
                onClick={onDeselectAll}
                className="btn-ghost"
                style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.75rem',
                    color: 'var(--slate-400)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: 'transparent',
                }}
            >
                {t('debate.deselect_all')}
            </button>
        </div>
        <motion.div
            layout
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1rem',
            }}
        >
            <AnimatePresence>
                {availableAgents.map((agent, i) => (
                    <motion.div
                        key={agent.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', delay: i * 0.05 }}
                        onClick={() => onToggle(agent.id)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onToggle(agent.id);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedAgents.includes(agent.id)}
                        className={`debate-card${selectedAgents.includes(agent.id) ? ' debate-card--selected' : ''}`}
                    >
                        {selectedAgents.includes(agent.id) ? (
                            <CheckCircle2 size={18} color="#a855f7" />
                        ) : (
                            <Bot size={18} color="#64748b" />
                        )}
                        <span
                            style={{
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: selectedAgents.includes(agent.id) ? 'white' : '#94a3b8',
                            }}
                        >
                            {agent.label}
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>
            {availableAgents.length === 0 && (
                <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="debate-error-msg"
                >
                    {t('debate.no_agents')}
                </motion.div>
            )}
        </motion.div>
    </div>
);

interface ConstraintsSectionProps {
    strategy: string;
    selectedAgents: string[];
    agentConstraints: Record<string, string>;
    onConstraintChange: (agentId: string, constraint: string) => void;
    availableAgents: Array<{ id: string; label: string }>;
    t: (key: string) => string;
}

export const ConstraintsSection: React.FC<ConstraintsSectionProps> = ({
    strategy,
    selectedAgents,
    agentConstraints,
    onConstraintChange,
    availableAgents,
    t,
}) => {
    if (strategy !== 'constrained' || selectedAgents.length === 0) return null;

    return (
        <div>
            <label className="debate-label debate-label--block" style={{ marginTop: '0.75rem' }}>
                {t('debate.constraints')}
                <span
                    className="debate-badge"
                    style={{
                        marginLeft: 8,
                        color: 'var(--warning)',
                        background: 'var(--warning-tint)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        fontSize: '0.65rem',
                    }}
                >
                    {t('debate.constraints_desc')}
                </span>
            </label>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    marginTop: '0.4rem',
                }}
            >
                {selectedAgents.map((id) => {
                    const node = availableAgents.find((a) => a.id === id);
                    return (
                        <div
                            key={id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.78rem',
                            }}
                        >
                            <span style={{ color: 'var(--slate-200)', minWidth: 140, fontWeight: 600 }}>
                                {node?.label || id}
                            </span>
                            <select
                                value={agentConstraints[id] || 'none'}
                                onChange={(e) => onConstraintChange(id, e.target.value)}
                                style={{
                                    padding: '0.25rem 0.4rem',
                                    borderRadius: 4,
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    background: 'rgba(15,15,30,0.6)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.7rem',
                                    outline: 'none',
                                    flex: 1,
                                }}
                            >
                                <option value="none">{t('debate.constraint_none')}</option>
                                <option value="facts_only">{t('debate.constraint_facts')}</option>
                                <option value="emotional_only">
                                    {t('debate.constraint_emotional')}
                                </option>
                                <option value="data_driven">{t('debate.constraint_data')}</option>
                                <option value="ethical_framework">
                                    {t('debate.constraint_ethical')}
                                </option>
                                <option value="first_principles">
                                    {t('debate.constraint_first')}
                                </option>
                                <option value="pragmatic">
                                    {t('debate.constraint_pragmatic')}
                                </option>
                            </select>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
