import { Target, Brain, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n/useTranslation';
import type { CognitiveTrace } from '../../kernel/instances';
import { metricBlurCard, h3SectionLgFlex, textXsMutedLh } from '../../styles/common';

interface Props {
    step: CognitiveTrace['steps'][number] | undefined;
    onClose?: () => void;
}

const StepAnalysisPanel: React.FC<Props> = ({ step: selectedStep, onClose }) => {
    const { t } = useTranslation();
    if (!selectedStep)
        return (
            <div
                style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--slate-400)',
                }}
            >
                Select a step to begin cognitive analysis
            </div>
        );

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={selectedStep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '2.5rem',
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: '0.5rem',
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: '1.75rem',
                                    fontWeight: 800,
                                    margin: 0,
                                    color: 'var(--slate-50)',
                                }}
                            >
                                {selectedStep.label}
                            </h2>
                            <span
                                style={{
                                    padding: '0.2rem 0.6rem',
                                    background: 'var(--accent-tint)',
                                    borderRadius: 6,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: 'var(--accent)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {selectedStep.type}
                            </span>
                        </div>
                        <p style={{ color: 'var(--slate-400)', margin: 0 }}>
                            {t('traces.step_analysis_desc')}
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--slate-200)',
                                cursor: 'pointer',
                                fontWeight: 600,
                            }}
                            aria-label={t('traces.close_microscope')}
                        >
                            {t('traces.close_microscope')}
                        </button>
                    )}
                </div>

                {selectedStep.decision && (
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={h3SectionLgFlex}>
                            <Target size={18} color="#3b82f6" aria-hidden="true" /> Decision Logic
                        </h3>
                        <div
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}
                        >
                            <div
                                style={{
                                    padding: '1.5rem',
                                    borderRadius: 16,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    background: 'rgba(0,0,0,0.2)',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--slate-400)',
                                        marginBottom: '1rem',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {t('traces.alternatives_heading')}
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                    }}
                                >
                                    {selectedStep.decision.alternatives.map((alt) => (
                                        <div
                                            key={alt.id}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: 10,
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                background:
                                                    alt.id === selectedStep.decision?.selectedId
                                                        ? 'rgba(16,185,129,0.05)'
                                                        : 'rgba(255,255,255,0.02)',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '0.4rem',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: 700,
                                                        fontSize: '0.9rem',
                                                        color: 'var(--slate-50)',
                                                    }}
                                                >
                                                    {alt.label}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: '0.8rem',
                                                        fontWeight: 800,
                                                        color:
                                                            alt.id ===
                                                            selectedStep.decision?.selectedId
                                                                ? '#10b981'
                                                                : '#94a3b8',
                                                    }}
                                                >
                                                    {Math.round(alt.score * 100)}%
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--slate-400)',
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {alt.reasoning}
                                            </div>
                                            {alt.id === selectedStep.decision?.selectedId && (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        left: 0,
                                                        top: 0,
                                                        bottom: 0,
                                                        width: 3,
                                                        background: 'var(--success)',
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                            >
                                <div
                                    style={{
                                        padding: '1.5rem',
                                        borderRadius: 16,
                                        background: 'rgba(59,130,246,0.05)',
                                        border: '1px solid rgba(59,130,246,0.2)',
                                        backdropFilter: 'blur(10px)',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--accent)',
                                            marginBottom: '0.75rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Selected Strategy Logic
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '1rem',
                                            fontWeight: 500,
                                            lineHeight: 1.6,
                                            color: 'var(--slate-50)',
                                        }}
                                    >
                                        "{selectedStep.decision.logic}"
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '1rem',
                                    }}
                                >
                                    <div style={metricBlurCard}>
                                        <div style={textXsMutedLh}>CONFIDENCE</div>
                                        <div
                                            style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 800,
                                                color: 'var(--accent)',
                                            }}
                                        >
                                            {Math.round(selectedStep.decision.confidence * 100)}%
                                        </div>
                                    </div>
                                    <div style={metricBlurCard}>
                                        <div style={textXsMutedLh}>UNCERTAINTY</div>
                                        <div
                                            style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 800,
                                                color: 'var(--warning)',
                                            }}
                                        >
                                            {Math.round(
                                                (1 - selectedStep.decision.confidence) * 100,
                                            )}
                                            %
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {selectedStep.thoughts && selectedStep.thoughts.length > 0 && (
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={h3SectionLgFlex}>
                            <Brain size={18} color="#a855f7" aria-hidden="true" /> Thought Process
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <AnimatePresence>
                                {selectedStep.thoughts.map((thought, i) => (
                                    <motion.div
                                        key={`thought-${i}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 + 0.3 }}
                                        style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            alignItems: 'flex-start',
                                        }}
                                    >
                                        <div
                                            style={{
                                                marginTop: '0.5rem',
                                                width: 6,
                                                height: 6,
                                                borderRadius: '50%',
                                                background: '#a855f7',
                                                boxShadow: '0 0 8px #a855f7',
                                            }}
                                            aria-hidden="true"
                                        />
                                        <div
                                            style={{
                                                fontSize: '0.95rem',
                                                color: 'var(--slate-200)',
                                                opacity: 0.9,
                                            }}
                                        >
                                            {thought}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {selectedStep.observations && (
                    <div>
                        <h3
                            style={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                color: 'var(--slate-50)',
                            }}
                        >
                            <Activity size={18} color="#10b981" aria-hidden="true" /> Environmental
                            Feedback
                        </h3>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                padding: '1.25rem',
                                background: 'rgba(16,185,129,0.05)',
                                borderRadius: 12,
                                border: '1px solid rgba(16,185,129,0.2)',
                                fontSize: '0.9rem',
                                lineHeight: 1.6,
                                fontFamily: 'monospace',
                                color: 'var(--success)',
                            }}
                        >
                            {selectedStep.observations}
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default StepAnalysisPanel;
