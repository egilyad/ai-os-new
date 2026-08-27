import React from 'react';
import { Activity, Terminal } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { SectionTitle } from './DashboardComponents';
import { getStatusColor } from '../Common/status-vocabulary';

export type RecentEvent = {
    id: number;
    time: string;
    event: string;
    summary: string;
    severity: 'info' | 'success' | 'warning' | 'error';
};

interface LiveTerminalSectionProps {
    events: RecentEvent[];
    onNavigate: (page: string) => void;
}

const LiveTerminalSection: React.FC<LiveTerminalSectionProps> = ({ events, onNavigate }) => {
    const { t } = useTranslation();

    return (
        <div
            className="glass-panel"
            style={{
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div
                style={{
                    padding: '1.25rem 1.5rem',
                    background: 'rgba(0,0,0,0.3)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <SectionTitle
                    icon={<Terminal size={18} color="#a855f7" />}
                    title={t('dashboard.live_system_stream')}
                    action={t('dashboard.full_logs')}
                    onAction={() => onNavigate('events')}
                />
            </div>
            <div
                style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    background: 'var(--slate-950)',
                    height: '100%',
                    minHeight: 300,
                }}
            >
                {events.map((event) => (
                    <div
                        key={`${event.id}-${event.event}`}
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'flex-start',
                            fontSize: '0.8rem',
                            fontFamily: 'JetBrains Mono, monospace',
                        }}
                    >
                        <span style={{ color: 'var(--slate-600)', flexShrink: 0, marginTop: 2 }}>
                            [{event.time}]
                        </span>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.2rem',
                            }}
                        >
                            <div
                                style={{
                                    color: getStatusColor(event.severity),
                                    fontWeight: 700,
                                }}
                            >
                                {event.event}
                            </div>
                            <div
                                style={{
                                    color: 'var(--slate-300)',
                                    opacity: 0.8,
                                    lineHeight: 1.4,
                                    wordBreak: 'break-word',
                                }}
                            >
                                {event.summary}
                            </div>
                        </div>
                    </div>
                ))}
                {events.length === 0 && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'var(--slate-600)',
                        }}
                    >
                        <Activity size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <span>{t('dashboard.awaiting_telemetry')}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveTerminalSection;
