import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { CARD, pLevelColor } from './pressure-map-constants';
import type { PressureAlert } from '../../kernel/instances';

interface Props {
    alerts: PressureAlert[];
    onAck: (id: string) => void;
}

const PressureAlerts: React.FC<Props> = ({ alerts, onAck }) => {
    const { t } = useTranslation();
    const active = alerts.filter((a) => !a.acknowledged);
    if (active.length === 0) return null;

    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertTriangle size={14} color="#ef4444" />
                <span
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--error)',
                    }}
                >
                    {t('pressure_map.active_alerts', { count: active.length })}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {active.map((a) => {
                    const pc = pLevelColor(a.level);
                    return (
                        <div
                            key={a.id}
                            style={{
                                ...CARD,
                                borderLeft: `3px solid ${pc?.text || '#64748b'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0.75rem',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        color: pc?.text,
                                    }}
                                >
                                    {a.scope}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--slate-300)' }}>
                                    {a.message}
                                </span>
                            </div>
                            <button
                                onClick={() => onAck(a.id)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '4px 8px',
                                    color: 'var(--slate-400)',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                }}
                            >
                                <CheckCircle2 size={12} /> {t('pressure_map.acknowledge')}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PressureAlerts;
