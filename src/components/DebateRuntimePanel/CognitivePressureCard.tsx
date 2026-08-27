import { Thermometer } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { CognitivePressure, PressureLevel } from '../../kernel/instances';
import { PRESSURE_COLORS } from './debate-runtime-constants';
import {
    cognitiveCard,
    flexColGap3FontSize075,
    flexJustifyBetween,
    h3Section,
    iconMarginRight,
    textSecondary,
    textSecondarySm,
} from '../../styles/common';

interface CognitivePressureCardProps {
    pressure: CognitivePressure | null;
}

export function CognitivePressureCard({ pressure }: CognitivePressureCardProps) {
    const { t } = useTranslation();
    return (
        <div style={cognitiveCard}>
            <h4 style={h3Section}>
                <Thermometer size={14} style={iconMarginRight} />{' '}
                {t('debate_runtime.cognitive_pressure_title')}
            </h4>
            {pressure ? (
                <div style={flexColGap3FontSize075}>
                    <div style={flexJustifyBetween}>
                        <span style={textSecondary}>{t('debate_runtime.level')}</span>
                        <span
                            style={{
                                fontWeight: 700,
                                color:
                                    PRESSURE_COLORS[pressure.level as PressureLevel] || '#94a3b8',
                                textTransform: 'uppercase',
                            }}
                        >
                            {pressure.level}
                        </span>
                    </div>
                    <div style={flexJustifyBetween}>
                        <span style={textSecondary}>{t('debate_runtime.active_chains')}</span>
                        <span style={{ color: 'var(--slate-200)', fontWeight: 600 }}>
                            {pressure.activeReasoningChains}
                        </span>
                    </div>
                    <div style={flexJustifyBetween}>
                        <span style={textSecondary}>{t('debate_runtime.contention_label')}</span>
                        <span
                            style={{
                                color: pressure.contentionScore > 0.5 ? '#f59e0b' : '#94a3b8',
                                fontWeight: 600,
                            }}
                        >
                            {(pressure.contentionScore * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div style={flexJustifyBetween}>
                        <span style={textSecondary}>{t('debate_runtime.complexity_label')}</span>
                        <span
                            style={{
                                color: pressure.complexityScore > 0.6 ? '#f59e0b' : '#94a3b8',
                                fontWeight: 600,
                            }}
                        >
                            {(pressure.complexityScore * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
            ) : (
                <div style={textSecondarySm}>{t('debate_runtime.waiting_session')}</div>
            )}
        </div>
    );
}
