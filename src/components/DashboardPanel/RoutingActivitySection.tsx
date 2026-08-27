import React from 'react';
import { Zap } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { SectionTitle } from './DashboardComponents';
import { panelRounded16, textSecondary } from '../../styles/common';
import type { RouterDecision } from '../../kernel/instances';

interface RoutingActivitySectionProps {
    decisions: RouterDecision[];
    onNavigate: (page: string) => void;
}

const RoutingActivitySection: React.FC<RoutingActivitySectionProps> = ({
    decisions,
    onNavigate,
}) => {
    const { t } = useTranslation();

    return (
        <div className="glass-panel" style={panelRounded16}>
            <SectionTitle
                icon={<Zap size={16} color="#f59e0b" />}
                title={t('dashboard.routing_activity')}
                action={t('dashboard.full_view')}
                onAction={() => onNavigate('routing')}
            />
            {decisions.length > 0 ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        marginTop: '0.5rem',
                    }}
                >
                    {decisions.slice(0, 6).map((d, i) => {
                        const top = d.scores[0];
                        return (
                            <div
                                key={`${d.requestId}-${i}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: 8,
                                    background: 'rgba(0,0,0,0.15)',
                                    fontSize: '0.7rem',
                                }}
                            >
                                <span
                                    style={{
                                        color: 'var(--slate-600)',
                                        fontFamily: 'monospace',
                                        minWidth: 60,
                                    }}
                                >
                                    {new Date(d.timestamp).toLocaleTimeString()}
                                </span>
                                <span
                                    style={{
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: 4,
                                        background: 'var(--warning-tint)',
                                        color: 'var(--warning)',
                                        fontWeight: 700,
                                        fontSize: '0.6rem',
                                    }}
                                >
                                    {d.strategy}
                                </span>
                                <span style={textSecondary}>→</span>
                                <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                                    {d.selected}
                                </span>
                                {d.secondBest && (
                                    <span style={textSecondary}>(fallback: {d.secondBest})</span>
                                )}
                                {top && (
                                    <span style={{ marginLeft: 'auto', color: 'var(--slate-500)' }}>
                                        score: {top.score.toFixed(3)}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        color: 'var(--slate-500)',
                        fontSize: '0.75rem',
                        fontStyle: 'italic',
                    }}
                >
                    {t('dashboard.no_routing_decisions')}
                </div>
            )}
        </div>
    );
};

export default RoutingActivitySection;
