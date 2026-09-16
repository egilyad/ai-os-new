import { motion, type Variants } from 'framer-motion';
import { ZapOff, ChevronRight } from 'lucide-react';
import type { DecisionTrace } from '../../types/metrics';
import { useTranslation } from '../../i18n/useTranslation';

interface DecisionsTabProps {
    history: DecisionTrace[];
    currentTime: number;
    itemVariants: Variants;
}

export const DecisionsTab: React.FC<DecisionsTabProps> = ({
    history,
    currentTime,
    itemVariants,
}) => {
    const { t } = useTranslation();
    if (history.length === 0) {
        return (
            <motion.div
                key="decisions"
                variants={itemVariants}
                initial="hidden"
                animate="show"
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--slate-500)' }}>
                    <ZapOff
                        size={48}
                        style={{ marginBottom: '1rem', opacity: 0.2 }}
                        aria-hidden="true"
                    />
                    <p>{t('analytics.empty.decisions')}</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="decisions"
            variants={itemVariants}
            initial="hidden"
            animate="show"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
            {history.slice(0, 20).map((d) => (
                <motion.div
                    key={d.requestId}
                    variants={itemVariants}
                    style={{
                        padding: '1.25rem 1.5rem',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 16,
                        borderLeft: `4px solid ${d.isExperiment ? '#f59e0b' : '#3b82f6'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem',
                                flexWrap: 'wrap',
                            }}
                        >
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--slate-50)' }}>
                                {d.selected}
                            </span>
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    background: 'var(--accent-tint)',
                                    color: '#60a5fa',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: 8,
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    border: '1px solid rgba(59,130,246,0.2)',
                                }}
                            >
                                {d.strategy}
                            </span>
                            {d.classification && (
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        background: 'var(--purple-tint)',
                                        color: 'var(--purple-muted)',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: 6,
                                        fontWeight: 700,
                                    }}
                                >
                                    {d.classification.complexity}
                                    {d.classification.isCode ? ' +code' : ''}
                                </span>
                            )}
                            {d.profile && (
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        background: 'var(--success-tint)',
                                        color: 'var(--success)',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: 6,
                                        fontWeight: 700,
                                    }}
                                >
                                    {d.profile}
                                </span>
                            )}
                            {d.isExperiment && (
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        background: 'var(--warning-tint)',
                                        color: 'var(--warning)',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: 6,
                                        fontWeight: 700,
                                    }}
                                >
                                    A/B
                                </span>
                            )}
                            <span
                                style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}
                            >
                                {new Date(d.timestamp || currentTime).toLocaleTimeString()}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                            {d.secondBest
                                ? t('analytics.decision_chosen', {
                                      provider: d.secondBest,
                                  })
                                : t('analytics.decision_sole')}
                        </div>
                        {d.skipped && d.skipped.length > 0 && (
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--slate-500)',
                                    marginTop: '0.3rem',
                                }}
                            >
                                Skipped: {d.skipped.map((s) => s.provider).join(', ')}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--slate-500)',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    marginBottom: '0.3rem',
                                }}
                            >
                                {t('analytics.matrix_scores')}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {d.scores.slice(0, 3).map((s, i) => (
                                    <span
                                        key={`${s.p}-${s.s}`}
                                        style={{
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            color: i === 0 ? '#10b981' : '#94a3b8',
                                            background: 'rgba(0,0,0,0.2)',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 6,
                                        }}
                                    >
                                        {s.p}: {s.s}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            className="btn-secondary"
                            style={{ padding: '0.5rem', borderRadius: 10 }}
                            aria-label={t('analytics.view_details')}
                        >
                            <ChevronRight size={18} aria-hidden="true" />
                        </button>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};
