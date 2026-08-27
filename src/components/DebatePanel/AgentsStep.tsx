import { motion, AnimatePresence } from 'framer-motion';
import { Users, Bot, CheckCircle2 } from 'lucide-react';
import {
    textCenter,
    stepCardPanel,
    h3StepTitle,
    iconCircleBlue,
    pageSubtitleMuted,
} from '../../styles/common';

interface AgentsStepProps {
    selectedAgents: string[];
    onToggleAgent: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    availableAgents: Array<{ id: string; label: string }>;
    strategy?: string;
    agentConstraints?: Record<string, string>;
    onConstraintChange?: (agentId: string, constraint: string) => void;
    agentArchetypes?: Record<string, string>;
    onArchetypeChange?: (id: string) => void;
    selectedHistoricalCount?: number;
    onOpenHistoricalFigures?: () => void;
    t: (key: string) => string;
}

const AgеntsStep: React.FC<AgentsStepProps> = ({
    selectedAgents,
    onToggleAgent,
    onSelectAll,
    onDeselectAll,
    availableAgents,
    t,
}) => {
    return (
        <div style={stepCardPanel}>
            <div style={textCenter}>
                <div style={iconCircleBlue}>
                    <Users size={40} color="#3b82f6" />
                </div>
                <h3 style={h3StepTitle}>Select Participants</h3>
                <p style={pageSubtitleMuted}>Choose 2+ agents for the debate.</p>
            </div>

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
        </div>
    );
};

export default AgеntsStep;
