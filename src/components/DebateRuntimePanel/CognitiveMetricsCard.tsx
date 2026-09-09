import { Brain } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { CognitiveMetricsSnapshot } from '../../kernel/instances';
import {
    cognitiveCard,
    flexColGap3FontSize075,
    flexJustifyBetween,
    h3Section,
    iconMarginRight,
    textSecondary,
    textSecondarySm,
} from '../../styles/common';

interface CognitiveMetricsCardProps {
    metrics: CognitiveMetricsSnapshot | null;
}

export function CognitiveMetricsCard({ metrics }: CognitiveMetricsCardProps) {
    const { t } = useTranslation();
    return (
        <div style={cognitiveCard}>
            <h4 style={h3Section}>
                <Brain size={14} style={iconMarginRight} /> {t('debate_runtime.cognitive_metrics')}
            </h4>
            {metrics ? (
                <div style={flexColGap3FontSize075}>
                    <div style={flexJustifyBetween}>
                        <span style={textSecondary}>{t('debate_runtime.debate_quality')}</span>
                        <span
                            style={{
                                color: metrics.debateQuality > 0.6 ? '#22c55e' : '#f59e0b',
                                fontWeight: 600,
                            }}
                        >
                            {(metrics.debateQuality * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div style={flexJustifyBetween}>
                        <span style={textSecondary}>{t('debate_runtime.avg_contradiction')}</span>
                        <span
                            style={{
                                color:
                                    metrics.avgContradictionDensity > 0.4 ? '#ef4444' : '#94a3b8',
                                fontWeight: 600,
                            }}
                        >
                            {(metrics.avgContradictionDensity * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div style={flexJustifyBetween}>
                        <span style={textSecondary}>{t('debate_runtime.avg_coherence')}</span>
                        <span
                            style={{
                                color: metrics.avgReasoningCoherence > 0.6 ? '#22c55e' : '#94a3b8',
                                fontWeight: 600,
                            }}
                        >
                            {(metrics.avgReasoningCoherence * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div style={flexJustifyBetween}>
                        <span style={textSecondary}>{t('debate_runtime.avg_confidence')}</span>
                        <span
                            style={{
                                color: metrics.avgConsensusConfidence > 0.6 ? '#22c55e' : '#94a3b8',
                                fontWeight: 600,
                            }}
                        >
                            {(metrics.avgConsensusConfidence * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
            ) : (
                <div style={textSecondarySm}>{t('debate_runtime.waiting_session')}</div>
            )}
        </div>
    );
}
