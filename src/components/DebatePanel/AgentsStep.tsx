import { useState } from 'react';
import { Users, ChevronDown, X } from 'lucide-react';
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
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const selectedSet = new Set(selectedAgents);
    const filtered = availableAgents.filter(a => !selectedSet.has(a.id) && a.label.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div style={stepCardPanel}>
            <div style={textCenter}>
                <div style={iconCircleBlue}>
                    <Users size={40} color="#3b82f6" />
                </div>
                <h3 style={h3StepTitle}>Select Participants</h3>
                <p style={pageSubtitleMuted}>Choose 2+ agents — add one by one.</p>
            </div>

            <div>
                <label className="debate-label debate-label--flex">
                    {t('debate.participants')}
                    <span className="debate-badge" style={{ color: '#a855f7', background: 'var(--purple-tint)', border: '1px solid rgba(168,85,247,0.2)' }}>
                        {selectedAgents.length} {t('debate.selected')}
                    </span>
                </label>

                {/* Chips for selected */}
                {selectedAgents.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                        {selectedAgents.map(id => {
                            const ag = availableAgents.find(a => a.id === id);
                            return (
                                <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#e9d5ff', fontSize: '0.8rem', fontWeight: 600 }}>
                                    {ag?.label || id}
                                    <button onClick={() => onToggleAgent(id)} aria-label={`Remove ${ag?.label || id}`} style={{ background: 'none', border: 'none', color: '#c4b5fd', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Dropdown trigger */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setOpen(v => !v)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(100,116,139,0.25)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-200)', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left' }}
                    >
                        <span style={{ color: selectedAgents.length === 0 ? 'var(--slate-400)' : 'var(--slate-200)' }}>
                            {selectedAgents.length === 0 ? 'Select agent...' : `Add agent (${availableAgents.length - selectedAgents.length} left)`}
                        </span>
                        <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'var(--slate-400)' }} />
                    </button>

                    {open && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(100,116,139,0.25)', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.4)', zIndex: 20, overflow: 'hidden' }}>
                            <div style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <input
                                    autoFocus
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    placeholder="Search agents..."
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(0,0,0,0.2)', color: 'var(--slate-100)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                                {filtered.length === 0 ? (
                                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.8rem' }}>{availableAgents.length === 0 ? t('debate.no_agents') : 'No match'}</div>
                                ) : (
                                    filtered.map(agent => (
                                        <button
                                            key={agent.id}
                                            onClick={() => { onToggleAgent(agent.id); setFilter(''); }}
                                            style={{ width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', background: 'transparent', color: 'var(--slate-200)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                                            {agent.label}
                                        </button>
                                    ))
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 6, padding: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <button onClick={onSelectAll} style={{ flex: 1, padding: '6px', borderRadius: 8, border: '1px solid rgba(168,85,247,0.25)', background: 'transparent', color: '#a855f7', fontSize: '0.75rem', cursor: 'pointer' }}>Select All</button>
                                <button onClick={onDeselectAll} style={{ flex: 1, padding: '6px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--slate-400)', fontSize: '0.75rem', cursor: 'pointer' }}>Clear</button>
                                <button onClick={() => setOpen(false)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'var(--slate-300)', fontSize: '0.75rem', cursor: 'pointer' }}>Done</button>
                            </div>
                        </div>
                    )}
                </div>
                {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} aria-hidden="true" />}
            </div>
        </div>
    );
};

export default AgеntsStep;
