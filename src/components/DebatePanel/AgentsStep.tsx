import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Users, Bot, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import {
    textCenter,
    stepCardPanel,
    h3StepTitle,
    iconCircleBlue,
    pageSubtitleMuted,
} from '../../styles/common';
import { DEBATE_ARCHETYPES, getPersonaArchetypes } from '../../kernel/instances';

interface AgentsStepProps {
    selectedAgents: string[];
    onToggleAgent: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    availableAgents: Array<{ id: string; label: string }>;
    strategy: string;
    agentConstraints: Record<string, string>;
    onConstraintChange: (agentId: string, constraint: string) => void;
    agentArchetypes: Record<string, string>;
    onArchetypeChange: (id: string) => void;
    selectedHistoricalCount: number;
    onOpenHistoricalFigures: () => void;
    t: (key: string) => string;
}

const CONSTRAINTS = [
    'none',
    'facts_only',
    'emotional_only',
    'data_driven',
    'ethical_framework',
    'first_principles',
    'pragmatic',
] as const;

const personaArchetypes = getPersonaArchetypes();
const scientistPersonae = personaArchetypes.filter(
    (p) =>
        !p.id.includes('facilitator') &&
        !p.id.includes('mediator') &&
        !p.id.includes('negotiator') &&
        !p.id.includes('coach') &&
        !p.id.includes('mentor') &&
        !p.id.includes('strategist') &&
        !p.id.includes('project-manager') &&
        !p.id.includes('systems-architect') &&
        !p.id.includes('quality-assurance') &&
        !p.id.includes('risk-analyst') &&
        !p.id.includes('decision-analyst') &&
        !p.id.includes('innovation-catalyst') &&
        !p.id.includes('process-engineer') &&
        !p.id.includes('change-manager') &&
        !p.id.includes('operations-researcher') &&
        !p.id.includes('knowledge-manager') &&
        !p.id.includes('communications-specialist') &&
        !p.id.includes('design-thinker') &&
        !p.id.includes('ethical-advisor') &&
        !p.id.includes('systems-thinker') &&
        !p.id.includes('complexity-scientist') &&
        !p.id.includes('integration-specialist'),
);
const expertPersonae = personaArchetypes.filter(
    (p) =>
        p.id.includes('facilitator') ||
        p.id.includes('mediator') ||
        p.id.includes('negotiator') ||
        p.id.includes('coach') ||
        p.id.includes('mentor') ||
        p.id.includes('strategist') ||
        p.id.includes('project-manager') ||
        p.id.includes('systems-architect') ||
        p.id.includes('quality-assurance') ||
        p.id.includes('risk-analyst') ||
        p.id.includes('decision-analyst') ||
        p.id.includes('innovation-catalyst') ||
        p.id.includes('process-engineer') ||
        p.id.includes('change-manager') ||
        p.id.includes('operations-researcher') ||
        p.id.includes('knowledge-manager') ||
        p.id.includes('communications-specialist') ||
        p.id.includes('design-thinker') ||
        p.id.includes('ethical-advisor') ||
        p.id.includes('systems-thinker') ||
        p.id.includes('complexity-scientist') ||
        p.id.includes('integration-specialist'),
);

const AgеntsStep: React.FC<AgentsStepProps> = ({
    selectedAgents,
    onToggleAgent,
    onSelectAll,
    onDeselectAll,
    availableAgents,
    strategy,
    agentConstraints,
    onConstraintChange,
    agentArchetypes,
    onArchetypeChange,
    selectedHistoricalCount,
    onOpenHistoricalFigures,
    t,
}) => {
    const [showPersonae, setShowPersonae] = useState(false);
    const isActive = (key: string) =>
        key === 'auto'
            ? Object.keys(agentArchetypes).length === 0
            : Object.values(agentArchetypes).includes(key);

    return (
        <div style={stepCardPanel}>
            <div style={textCenter}>
                <div style={iconCircleBlue}>
                    <Users size={40} color="#3b82f6" />
                </div>
                <h3 style={h3StepTitle}>Select Participants</h3>
                <p style={pageSubtitleMuted}>Choose agents and set their thinking archetype.</p>
            </div>

            <div>
                <label className="debate-label debate-label--block">Base Thinking Archetype</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(['auto', ...Object.keys(DEBATE_ARCHETYPES)] as Array<'auto' | string>).map(
                        (key) => (
                            <button
                                key={key}
                                onClick={() => onArchetypeChange(key)}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: 8,
                                    border: '1px solid',
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    background: isActive(key)
                                        ? 'rgba(168,85,247,0.15)'
                                        : 'transparent',
                                    borderColor: isActive(key)
                                        ? 'rgba(168,85,247,0.3)'
                                        : 'rgba(255,255,255,0.08)',
                                    color: isActive(key) ? '#a855f7' : '#94a3b8',
                                }}
                            >
                                {key === 'auto'
                                    ? 'Auto'
                                    : DEBATE_ARCHETYPES[key as keyof typeof DEBATE_ARCHETYPES].name}
                            </button>
                        ),
                    )}
                </div>
            </div>

            <div>
                <button
                    onClick={() => setShowPersonae(!showPersonae)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: '1px solid rgba(16,185,129,0.3)',
                        background: showPersonae ? 'rgba(16,185,129,0.12)' : 'rgba(30,30,50,0.4)',
                        color: 'var(--success)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        marginTop: '0.5rem',
                    }}
                >
                    {showPersonae ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    Expert Persona Roles ({personaArchetypes.length})
                </button>
            </div>

            {showPersonae && (
                <div
                    style={{
                        marginTop: '0.5rem',
                        maxHeight: 400,
                        overflowY: 'auto',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        padding: '0.75rem',
                    }}
                >
                    <div style={{ marginBottom: '0.5rem' }}>
                        <div
                            style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--success)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: 8,
                            }}
                        >
                            Scientists & Specialists
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {scientistPersonae.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => onArchetypeChange(p.id)}
                                    title={p.description}
                                    style={{
                                        padding: '3px 10px',
                                        borderRadius: 6,
                                        border: '1px solid',
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        background: isActive(p.id)
                                            ? 'rgba(16,185,129,0.15)'
                                            : 'transparent',
                                        borderColor: isActive(p.id)
                                            ? 'rgba(16,185,129,0.3)'
                                            : 'rgba(255,255,255,0.06)',
                                        color: isActive(p.id) ? '#10b981' : '#94a3b8',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                >
                                    <span>{p.icon}</span>
                                    <span>{p.name.split('/')[1]?.trim() || p.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--warning)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: 8,
                                marginTop: '0.5rem',
                            }}
                        >
                            Process & Strategy Experts
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {expertPersonae.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => onArchetypeChange(p.id)}
                                    title={p.description}
                                    style={{
                                        padding: '3px 10px',
                                        borderRadius: 6,
                                        border: '1px solid',
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        background: isActive(p.id)
                                            ? 'rgba(245,158,11,0.15)'
                                            : 'transparent',
                                        borderColor: isActive(p.id)
                                            ? 'rgba(245,158,11,0.3)'
                                            : 'rgba(255,255,255,0.06)',
                                        color: isActive(p.id) ? '#f59e0b' : '#94a3b8',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                >
                                    <span>{p.icon}</span>
                                    <span>{p.name.split('/')[1]?.trim() || p.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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
                        Select All
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
                        Deselect All
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
                                onClick={() => onToggleAgent(agent.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onToggleAgent(agent.id);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-pressed={selectedAgents.includes(agent.id)}
                                aria-label={`${agent.label}${selectedAgents.includes(agent.id) ? ' (selected)' : ''}`}
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
                                        color: selectedAgents.includes(agent.id)
                                            ? 'white'
                                            : '#94a3b8',
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

            <div>
                <button
                    onClick={onOpenHistoricalFigures}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0.5rem 1rem',
                        borderRadius: 10,
                        border: '1px solid rgba(168,85,247,0.3)',
                        background:
                            selectedHistoricalCount > 0
                                ? 'rgba(168,85,247,0.15)'
                                : 'rgba(30,30,50,0.4)',
                        color: '#a855f7',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}
                >
                    Historical Figures
                    {selectedHistoricalCount > 0 && (
                        <span
                            style={{
                                background: 'rgba(168,85,247,0.3)',
                                borderRadius: 6,
                                padding: '1px 6px',
                                fontSize: '0.75rem',
                            }}
                        >
                            {selectedHistoricalCount}
                        </span>
                    )}
                </button>
            </div>

            {strategy === 'constrained' && selectedAgents.length > 0 && (
                <div>
                    <label
                        className="debate-label debate-label--block"
                        style={{ marginTop: '0.75rem' }}
                    >
                        Argument Constraints
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
                            Per-agent
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
                                    <span
                                        style={{ color: 'var(--slate-200)', minWidth: 140, fontWeight: 600 }}
                                    >
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
                                        {CONSTRAINTS.map((c) => (
                                            <option key={c} value={c}>
                                                {c === 'none'
                                                    ? 'No constraint'
                                                    : c
                                                          .split('_')
                                                          .map(
                                                              (w) =>
                                                                  w.charAt(0).toUpperCase() +
                                                                  w.slice(1),
                                                          )
                                                          .join(' ')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgеntsStep;
