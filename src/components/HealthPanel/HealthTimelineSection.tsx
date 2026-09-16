import { Activity } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import { h3White } from '../../styles/common';
import type { HealthEvent } from '../../kernel/instances';

interface HealthTimelineSectionProps {
    healthEvents: HealthEvent[];
    healthEventFilter: string;
    setHealthEventFilter: (filter: string) => void;
    now: number;
}

export const HealthTimelineSection: React.FC<HealthTimelineSectionProps> = ({
    healthEvents,
    healthEventFilter,
    setHealthEventFilter,
    now,
}) => {
    const { t } = useTranslation();

    const getEventColor = (type: string) => {
        switch (type) {
            case 'latency_spike':
                return '#f59e0b';
            case 'error_burst':
                return '#ef4444';
            case 'status_change':
                return '#8b5cf6';
            case 'rate_limit':
                return '#f97316';
            default:
                return '#10b981';
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'latency_spike':
                return <span aria-hidden="true">⚡</span>;
            case 'error_burst':
                return <span aria-hidden="true">✕</span>;
            case 'status_change':
                return <span aria-hidden="true">◉</span>;
            case 'rate_limit':
                return <span aria-hidden="true">⚠</span>;
            default:
                return <span aria-hidden="true">✓</span>;
        }
    };

    const getEventLabel = (type: string) => {
        switch (type) {
            case 'latency_spike':
                return t('health.event_latency_spike');
            case 'error_burst':
                return t('health.event_error_burst');
            case 'status_change':
                return t('health.event_status_change');
            case 'rate_limit':
                return t('health.event_rate_limit');
            default:
                return t('health.event_recovery');
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.5rem',
                borderRadius: 16,
                background: 'rgba(139,92,246,0.02)',
                border: '1px solid rgba(139,92,246,0.08)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderBottom: '1px solid rgba(139,92,246,0.08)',
                    paddingBottom: '0.75rem',
                }}
            >
                <Activity size={20} color="#8b5cf6" aria-hidden="true" />
                <h3 style={h3White}>{t('health.health_timeline')}</h3>
                <select
                    value={healthEventFilter}
                    onChange={(e) => setHealthEventFilter(e.target.value)}
                    style={{
                        marginLeft: 'auto',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6,
                        padding: '3px 8px',
                        fontSize: '0.7rem',
                        color: 'var(--slate-400)',
                    }}
                >
                    <option value="all">All</option>
                    <option value="latency_spike">Latency</option>
                    <option value="error_burst">Errors</option>
                    <option value="status_change">Status</option>
                    <option value="rate_limit">Rate Limit</option>
                    <option value="recovery">Recovery</option>
                </select>
            </div>
            {healthEvents.length === 0 ? (
                <div
                    style={{
                        padding: '2rem',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        color: 'var(--slate-500)',
                    }}
                >
                    {t('health.timeline_empty')}
                </div>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        maxHeight: 300,
                        overflowY: 'auto',
                    }}
                >
                    {healthEvents
                        .filter((e) => healthEventFilter === 'all' || e.type === healthEventFilter)
                        .slice(0, 50)
                        .map((ev, i) => {
                            const eventColor = getEventColor(ev.type);
                            const ago = Math.floor((now - ev.timestamp) / 1000);
                            const agoStr = ago < 60 ? `${ago}s` : `${Math.floor(ago / 60)}m`;
                            return (
                                <div
                                    key={`${ev.provider}-${ev.timestamp}-${i}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: 8,
                                        background: 'rgba(0,0,0,0.15)',
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: eventColor,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <span style={{ fontSize: '0.85rem' }}>
                                        {getEventIcon(ev.type)}
                                    </span>
                                    <ProviderIcon provider={ev.provider} size={12} />
                                    <span style={{ color: 'var(--slate-200)', fontWeight: 500 }}>
                                        {ev.provider}
                                    </span>
                                    <span
                                        style={{
                                            color: eventColor,
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {getEventLabel(ev.type)}
                                    </span>
                                    <span
                                        style={{
                                            marginLeft: 'auto',
                                            fontSize: '0.65rem',
                                            color: 'var(--slate-500)',
                                        }}
                                    >
                                        {agoStr} ago
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '0.65rem',
                                            color: 'var(--slate-400)',
                                            maxWidth: 200,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                        title={ev.detail}
                                    >
                                        {ev.detail}
                                    </span>
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
};
