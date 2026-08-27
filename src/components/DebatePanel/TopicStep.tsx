import { MessageSquare, Zap } from 'lucide-react';
import { TEMP_LABELS } from './wizard-constants';
import { DEBATE_TEMPLATES } from '../../kernel/instances';
import StrategySelector from './StrategySelector';
import {
    textCenter,
    stepCardPanel,
    h3StepTitle,
    iconCircleBase,
    pageSubtitleMuted,
} from '../../styles/common';

interface TopicStepProps {
    topic: string;
    onTopicChange: (v: string) => void;
    strategy: string;
    onStrategyChange: (v: string) => void;
    maxRounds: number;
    onMaxRoundsChange: (v: number) => void;
    debateTemperature: number;
    onTemperatureChange: (v: number) => void;
    t: (key: string) => string;
}

const TopicStep: React.FC<TopicStepProps> = ({
    topic,
    onTopicChange,
    strategy,
    onStrategyChange,
    maxRounds,
    onMaxRoundsChange,
    debateTemperature,
    onTemperatureChange,
    t,
}) => {
    const accentColor =
        debateTemperature <= 2
            ? '#38bdf8'
            : debateTemperature <= 4
              ? '#34d399'
              : debateTemperature <= 6
                ? '#fbbf24'
                : debateTemperature <= 8
                  ? '#fb923c'
                  : '#ef4444';

    const templateCardBase: React.CSSProperties = {
        padding: '0.6rem 0.8rem',
        borderRadius: 10,
        border: '1px solid rgba(139,92,246,0.15)',
        background: 'rgba(139,92,246,0.04)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontSize: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    };

    return (
        <div style={stepCardPanel}>
            <div style={textCenter}>
                <div style={iconCircleBase}>
                    <MessageSquare size={40} color="#a855f7" />
                </div>
                <h3 style={h3StepTitle}>{t('debate.config_title')}</h3>
                <p style={pageSubtitleMuted}>{t('debate.config_desc')}</p>
            </div>

            {/* Template picker */}
            <div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 6,
                        fontSize: '0.75rem',
                        color: 'var(--slate-400)',
                        fontWeight: 600,
                    }}
                >
                    <Zap size={14} color="#a855f7" />
                    {t('debate.templates')}
                    <span style={{ fontWeight: 400, color: 'var(--slate-500)', marginLeft: 4 }}>
                        — {t('debate.templates_desc')}
                    </span>
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: 6,
                    }}
                >
                    {DEBATE_TEMPLATES.map((tmpl) => (
                        <div
                            key={tmpl.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                                onTopicChange(tmpl.topic);
                                onStrategyChange(tmpl.strategy);
                                onMaxRoundsChange(tmpl.maxRounds);
                                onTemperatureChange(Math.round(tmpl.debateTemperature * 10));
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onTopicChange(tmpl.topic);
                                    onStrategyChange(tmpl.strategy);
                                    onMaxRoundsChange(tmpl.maxRounds);
                                    onTemperatureChange(Math.round(tmpl.debateTemperature * 10));
                                }
                            }}
                            style={{
                                ...templateCardBase,
                                borderColor:
                                    topic === tmpl.topic
                                        ? 'rgba(139,92,246,0.5)'
                                        : 'rgba(139,92,246,0.15)',
                                background:
                                    topic === tmpl.topic
                                        ? 'rgba(139,92,246,0.1)'
                                        : 'rgba(139,92,246,0.04)',
                            }}
                            aria-label={`${t('debate.template.' + tmpl.id)} template`}
                        >
                            <span style={{ fontWeight: 600, color: 'var(--slate-200)' }}>
                                {t('debate.template.' + tmpl.id)}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                                {t('debate.template.' + tmpl.id + '_desc')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label className="debate-label debate-label--block">{t('debate.thesis')}</label>
                <textarea
                    rows={3}
                    placeholder={t('debate.thesis_placeholder')}
                    aria-label={t('debate.thesis')}
                    className="debate-input debate-textarea"
                    value={topic}
                    onChange={(e) => onTopicChange(e.target.value)}
                />
            </div>

            <div>
                <label className="debate-label debate-label--block">{t('debate.strategy')}</label>
                <StrategySelector value={strategy} onChange={onStrategyChange} t={t} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                    <label className="debate-label debate-label--block">
                        {t('debate.max_rounds')}
                    </label>
                    <input
                        type="number"
                        min={2}
                        max={50}
                        value={maxRounds}
                        onChange={(e) => onMaxRoundsChange(parseInt(e.target.value) || 10)}
                        aria-label={t('debate.max_rounds')}
                        className="debate-input"
                    />
                </div>
            </div>

            <div>
                <label className="debate-label debate-label--block" style={{ marginTop: 6 }}>
                    Temperature: {TEMP_LABELS[debateTemperature]}
                </label>
                <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={debateTemperature}
                    onChange={(e) => onTemperatureChange(parseInt(e.target.value))}
                    aria-label={t('common.aria.temperature')}
                    className="debate-input"
                    style={{ width: '100%', accentColor }}
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
                    <span>Pure Logic</span>
                    <span>Balanced</span>
                    <span>Pure Emotion</span>
                </div>
            </div>
        </div>
    );
};

export default TopicStep;
