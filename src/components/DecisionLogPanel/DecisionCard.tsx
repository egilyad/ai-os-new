import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { textMutedXs, textSecondaryXs, textWhiteXs } from '../../styles/common';
import type { ProviderDecisionEntry } from './decision-log-types';
import { ScoreRow } from './ScoreRow';

interface DecisionCardProps {
    entry: ProviderDecisionEntry;
    isExpanded: boolean;
    onToggle: () => void;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({ entry: d, isExpanded, onToggle }) => {
    const { t } = useTranslation();
    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.2)',
                overflow: 'hidden',
            }}
        >
            <div
                onClick={onToggle}
                style={{
                    padding: '0.5rem 0.75rem',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto auto auto',
                    gap: 8,
                    alignItems: 'center',
                    cursor: 'pointer',
                }}
            >
                {isExpanded ? (
                    <ChevronDown size={14} color="#94a3b8" />
                ) : (
                    <ChevronRight size={14} color="#94a3b8" />
                )}
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                            style={{
                                padding: '0.1rem 0.5rem',
                                borderRadius: 6,
                                background: 'rgba(16,185,129,0.15)',
                                color: '#6ee7b7',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                            }}
                        >
                            {d.chosenProvider}
                        </span>
                        <span style={textWhiteXs}>{d.chosenModel}</span>
                    </div>
                    <div style={{ ...textMutedXs, marginTop: 2 }}>
                        {d.promptPreview.slice(0, 80)}
                        {d.promptPreview.length > 80 ? '...' : ''}
                    </div>
                </div>
                <span style={textMutedXs}>{d.latencyMs}ms</span>
                <span style={{ ...textSecondaryXs, color: 'var(--warning)' }}>
                    ${d.estimatedCost.toFixed(4)}
                </span>
                <span style={textMutedXs}>{new Date(d.timestamp).toLocaleTimeString()}</span>
            </div>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                            overflow: 'hidden',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <div
                            style={{
                                padding: '0.75rem 1rem',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1rem',
                            }}
                        >
                            <div>
                                <div style={textSecondaryXs}>{t('decision_log.reason')}</div>
                                <div style={{ ...textWhiteXs, fontSize: '0.85rem', marginTop: 4 }}>
                                    {d.reason}
                                </div>
                                {d.policyApplied.length > 0 && (
                                    <>
                                        <div style={{ ...textSecondaryXs, marginTop: 12 }}>
                                            {t('decision_log.policies')}
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: 4,
                                                flexWrap: 'wrap',
                                                marginTop: 4,
                                            }}
                                        >
                                            {d.policyApplied.map((p) => (
                                                <span
                                                    key={p}
                                                    style={{
                                                        padding: '0.1rem 0.4rem',
                                                        borderRadius: 6,
                                                        background: 'var(--accent-tint)',
                                                        color: '#93c5fd',
                                                        fontSize: '0.7rem',
                                                    }}
                                                >
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}
                                <div style={{ ...textSecondaryXs, marginTop: 12 }}>
                                    {t('decision_log.scoring')}
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: 4,
                                        marginTop: 4,
                                    }}
                                >
                                    <ScoreRow label="reliability" value={d.scoring.reliability} />
                                    <ScoreRow label="latency" value={d.scoring.latency} />
                                    <ScoreRow label="cost" value={d.scoring.cost} />
                                    <ScoreRow label="ttft" value={d.scoring.ttft} />
                                    <ScoreRow label="tps" value={d.scoring.tps} />
                                </div>
                            </div>
                            <div>
                                <div style={textSecondaryXs}>
                                    {t('decision_log.rejected', { count: d.rejectedKeys.length })}
                                </div>
                                {d.rejectedKeys.length === 0 ? (
                                    <div style={textMutedXs}>{t('decision_log.no_rejections')}</div>
                                ) : (
                                    <div
                                        style={{
                                            marginTop: 4,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 4,
                                            maxHeight: 200,
                                            overflow: 'auto',
                                        }}
                                    >
                                        {d.rejectedKeys.map((r) => (
                                            <div
                                                key={`${r.provider}-${r.model}`}
                                                style={{
                                                    padding: '0.3rem 0.5rem',
                                                    borderRadius: 6,
                                                    background: 'rgba(0,0,0,0.2)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                }}
                                            >
                                                <div
                                                    style={{ ...textWhiteXs, fontSize: '0.75rem' }}
                                                >
                                                    {r.provider} / {r.model}
                                                </div>
                                                <div style={{ ...textMutedXs, fontSize: '0.7rem' }}>
                                                    {r.reason}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
