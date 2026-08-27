import { Target, Loader2, Activity, Zap, Play } from 'lucide-react';
import type { ProbeResult } from '../../kernel/contracts/probe';
import type {
    AutoDebateResult,
    BatchTestResult,
    ProviderWinRate,
} from '../../kernel/contracts/auto-debate';
import AutoDebateSection from './AutoDebateSection';
import ProbeResults from './ProbeResults';
import { TEMP_LABELS, strategyName } from './wizard-constants';
import {
    textCenter,
    stepCardPanel,
    h3StepTitle,
    iconCircleGreen,
    pageSubtitleMuted,
} from '../../styles/common';
import { Button } from '../Common';

interface ReviewStepProps {
    topic: string;
    strategy: string;
    maxRounds: number;
    debateTemperature: number;
    selectedAgents: string[];
    availableAgents: Array<{ id: string; label: string }>;
    probeResults: Map<string, ProbeResult> | null;
    probeLoading: boolean;
    onProbe: () => void;
    expandedProbe: string | null;
    onToggleProbe: (id: string | null) => void;
    actionLoading: 'start' | 'inject' | null;
    onStart: () => void;
    showAuto: boolean;
    onToggleAuto: () => void;
    autoResults: AutoDebateResult[];
    autoWinRates: ProviderWinRate[];
    onAutoDebate: (options?: {
        topic?: string;
        category?: string;
        maxParticipants?: number;
        maxRounds?: number;
    }) => Promise<AutoDebateResult>;
    onStressTest: (count?: number) => Promise<AutoDebateResult[]>;
    onBatchTest: (topic: string, runs?: number) => Promise<BatchTestResult>;
    onClearAuto: () => void;
    t: (key: string) => string;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
    topic,
    strategy,
    maxRounds,
    debateTemperature,
    selectedAgents,
    availableAgents,
    probeResults,
    probeLoading,
    onProbe,
    expandedProbe,
    onToggleProbe,
    actionLoading,
    onStart,
    showAuto,
    onToggleAuto,
    autoResults,
    autoWinRates,
    onAutoDebate,
    onStressTest,
    onBatchTest,
    onClearAuto,
    t,
}) => (
    <div style={stepCardPanel}>
        <div style={textCenter}>
            <div style={iconCircleGreen}>
                <Target size={40} color="#10b981" />
            </div>
            <h3 style={h3StepTitle}>Review & Launch</h3>
            <p style={pageSubtitleMuted}>Verify configuration, probe participants, and start.</p>
        </div>

        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                padding: '1.25rem',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div>
                <div
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--slate-500)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginBottom: 4,
                    }}
                >
                    Thesis
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-200)', fontWeight: 500 }}>
                    {topic}
                </div>
            </div>
            <div>
                <div
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--slate-500)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginBottom: 4,
                    }}
                >
                    Strategy
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-200)', fontWeight: 500 }}>
                    {strategyName(strategy)}
                </div>
            </div>
            <div>
                <div
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--slate-500)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginBottom: 4,
                    }}
                >
                    Rounds
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-200)', fontWeight: 500 }}>
                    {maxRounds}
                </div>
            </div>
            <div>
                <div
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--slate-500)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginBottom: 4,
                    }}
                >
                    Temperature
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-200)', fontWeight: 500 }}>
                    {TEMP_LABELS[debateTemperature]}
                </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
                <div
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--slate-500)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginBottom: 4,
                    }}
                >
                    Participants ({selectedAgents.length})
                </div>
                <div
                    style={{
                        fontSize: '0.8rem',
                        color: 'var(--slate-400)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 4,
                    }}
                >
                    {selectedAgents.map((id) => {
                        const node = availableAgents.find((a) => a.id === id);
                        return (
                            <span
                                key={id}
                                style={{
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    background: 'var(--purple-tint)',
                                    color: '#c084fc',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {node?.label || id}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>

        <div>
            <button
                onClick={onProbe}
                className="btn-secondary"
                disabled={probeLoading || selectedAgents.length < 2}
                style={{
                    padding: '0.7rem 1.2rem',
                    borderRadius: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#a855f7',
                    borderColor: 'rgba(168,85,247,0.3)',
                    background: 'rgba(168,85,247,0.05)',
                }}
            >
                {probeLoading ? <Loader2 size={18} className="spinning" /> : <Activity size={18} />}
                Check Participants
            </button>
            {probeResults && probeResults.size > 0 && (
                <ProbeResults
                    results={probeResults}
                    availableAgents={availableAgents}
                    expandedProbe={expandedProbe}
                    onToggleProbe={onToggleProbe}
                />
            )}
        </div>

        <div style={textCenter}>
            <Button variant="ghost" onClick={onToggleAuto} className="btn-secondary">
                <Zap size={18} color="#f59e0b" />
                {showAuto ? 'Hide Auto-Debate' : 'Auto-Debate'}
            </Button>
        </div>

        {showAuto && (
            <div
                style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: '1.5rem',
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.03)',
                }}
            >
                <AutoDebateSection
                    onAutoDebate={onAutoDebate}
                    onStressTest={onStressTest}
                    onBatchTest={onBatchTest}
                    results={autoResults}
                    winRates={autoWinRates}
                    onClear={onClearAuto}
                />
            </div>
        )}

        <button
            onClick={onStart}
            className="btn-primary"
            aria-label={t('debate.initialize')}
            style={{
                padding: '1.25rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginTop: '0.5rem',
                background: 'linear-gradient(90deg, #9333ea, #a855f7)',
                boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
                borderRadius: 14,
            }}
            disabled={selectedAgents.length < 2 || !topic || actionLoading === 'start'}
        >
            {actionLoading === 'start' ? (
                <Loader2 size={22} className="spinning" />
            ) : (
                <Play size={22} fill="currentColor" />
            )}
            {t('debate.initialize')}
        </button>
    </div>
);

export default ReviewStep;
