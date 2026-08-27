import React from 'react';
import StrategySelector from './StrategySelector';
import { stepCardPanel } from '../../styles/common';

interface DebateSetupWizardProps {
    topic: string;
    onTopicChange: (value: string) => void;
    strategy: import('../../kernel/contracts/debate-types').DebateSessionStrategy;
    onStrategyChange: (value: import('../../kernel/contracts/debate-types').DebateSessionStrategy) => void;
    maxRounds: number;
    onMaxRoundsChange: (value: number) => void;
    debateTemperature?: number;
    onTemperatureChange?: (value: number) => void;
    agentArchetypes?: Record<string, string>;
    onArchetypeChange?: (id: string) => void;
    selectedAgents: string[];
    onToggleAgent: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    availableAgents: Array<{ id: string; label: string }>;
    agentConstraints?: Record<string, string>;
    onConstraintChange?: (agentId: string, constraint: string) => void;
    probeResults?: Map<string, unknown> | null;
    probeLoading?: boolean;
    onProbe?: () => void;
    expandedProbe?: string | null;
    onToggleProbe?: (id: string | null) => void;
    actionLoading: 'start' | 'inject' | null;
    onStart: () => void;
    showAuto?: boolean;
    onToggleAuto?: () => void;
    autoResults?: unknown[];
    autoWinRates?: unknown[];
    onAutoDebate?: (options?: unknown) => Promise<unknown>;
    onStressTest?: (count?: number) => Promise<unknown[]>;
    onBatchTest?: (topic: string, runs?: number) => Promise<unknown>;
    onClearAuto?: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    selectedHistoricalCount?: number;
    onOpenHistoricalFigures?: () => void;
}

const DebateSetupWizard: React.FC<DebateSetupWizardProps> = ({
    topic,
    onTopicChange,
    strategy,
    onStrategyChange,
    maxRounds,
    onMaxRoundsChange,
    selectedAgents,
    onToggleAgent,
    onSelectAll,
    onDeselectAll,
    availableAgents,
    actionLoading,
    onStart,
    t,
}) => {
    const canStart = topic.trim().length > 0 && selectedAgents.length >= 2 && actionLoading !== 'start';

    return (
        <div style={{ display: 'block', padding: '1.5rem', overflow: 'visible' }}>
            <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
                <div style={stepCardPanel}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* 1. Debate name */}
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-300)' }}>1. {t('debate.thesis')}</span>
                            <textarea
                                rows={2}
                                placeholder={t('debate.thesis_placeholder')}
                                value={topic}
                                onChange={e => onTopicChange(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(100,116,139,0.25)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-100)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                            />
                        </label>

                        {/* 2. Strategy */}
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-300)' }}>2. {t('debate.strategy')}</span>
                            <StrategySelector value={strategy} onChange={onStrategyChange} t={t} />
                        </label>

                        {/* 3. Agents minimal */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-300)' }}>3. {t('debate.participants')} — {selectedAgents.length} {t('debate.selected')}</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={onSelectAll} style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(168,85,247,0.3)', background: 'transparent', color: '#a855f7', cursor: 'pointer' }}>Select All</button>
                                    <button onClick={onDeselectAll} style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer' }}>Clear</button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, maxHeight: 220, overflowY: 'auto', padding: 2 }}>
                                {availableAgents.map(agent => {
                                    const selected = selectedAgents.includes(agent.id);
                                    return (
                                        <button
                                            key={agent.id}
                                            onClick={() => onToggleAgent(agent.id)}
                                            style={{
                                                padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                                                border: selected ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                                background: selected ? 'rgba(168,85,247,0.12)' : 'rgba(15,23,42,0.4)',
                                                color: selected ? '#e9d5ff' : 'var(--slate-300)',
                                            }}
                                        >
                                            {selected ? '✓ ' : ''}{agent.label}
                                        </button>
                                    );
                                })}
                                {availableAgents.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{t('debate.no_agents')}</div>}
                            </div>
                        </div>

                        {/* 4. Rounds */}
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-300)' }}>4. {t('debate.max_rounds')}</span>
                            <input
                                type="number"
                                min={2}
                                max={50}
                                value={maxRounds}
                                onChange={e => onMaxRoundsChange(parseInt(e.target.value) || 10)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(100,116,139,0.25)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-100)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </label>

                        {/* 5. Start */}
                        <button
                            onClick={onStart}
                            disabled={!canStart}
                            style={{
                                marginTop: 8, width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                                background: !canStart ? 'rgba(100,116,139,0.3)' : 'linear-gradient(90deg, #9333ea, #a855f7)',
                                color: 'white', fontWeight: 800, fontSize: '1rem', cursor: !canStart ? 'not-allowed' : 'pointer',
                                boxShadow: canStart ? '0 4px 20px rgba(168,85,247,0.35)' : 'none',
                                opacity: !canStart ? 0.6 : 1,
                            }}
                        >
                            {actionLoading === 'start' ? 'Starting...' : `5. ${t('debate.initialize')}`}
                        </button>
                        {!canStart && <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textAlign: 'center' }}>{!topic.trim() ? 'Enter topic' : selectedAgents.length < 2 ? 'Select at least 2 agents' : ''}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebateSetupWizard;
