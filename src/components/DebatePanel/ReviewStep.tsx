import { Target, Loader2, Play } from 'lucide-react';
import { strategyName } from './wizard-constants';
import {
    textCenter,
    stepCardPanel,
    h3StepTitle,
    iconCircleGreen,
    pageSubtitleMuted,
} from '../../styles/common';

interface ReviewStepProps {
    topic: string;
    strategy: string;
    maxRounds: number;
    selectedAgents: string[];
    availableAgents: Array<{ id: string; label: string }>;
    actionLoading: 'start' | 'inject' | null;
    onStart: () => void;
    t: (key: string) => string;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
    topic,
    strategy,
    maxRounds,
    selectedAgents,
    availableAgents,
    actionLoading,
    onStart,
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
