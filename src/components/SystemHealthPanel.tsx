import { useSystemStatus } from '../stores/useSystemStatus';
import { useTranslation } from '../i18n/useTranslation';
import { useNow } from '../hooks/useNow';
import {
    Heart,
    AlertTriangle,
    CheckCircle,
    Loader2,
    Activity,
    Key,
    Shield,
    BarChart3,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
    READY: '#22c55e',
    LOADING: '#f59e0b',
    EMPTY: '#94a3b8',
    DEGRADED: '#ef4444',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    READY: <CheckCircle size={16} />,
    LOADING: <Loader2 size={16} className="animate-spin" />,
    EMPTY: <AlertTriangle size={16} />,
    DEGRADED: <AlertTriangle size={16} />,
};

const AREA_LABELS: Record<string, string> = {
    groupManager: 'GroupManager',
    keys: 'Keys',
    passports: 'Passports',
    projections: 'Projections',
};

const AREA_ICONS: Record<string, React.ReactNode> = {
    groupManager: <Activity size={14} />,
    keys: <Key size={14} />,
    passports: <Shield size={14} />,
    projections: <BarChart3 size={14} />,
};

const AREA_STATUS_COLORS: Record<string, string> = {
    ready: '#22c55e',
    loading: '#f59e0b',
    populated: '#22c55e',
    empty: '#94a3b8',
    partial: '#f59e0b',
    degraded: '#ef4444',
    full: '#22c55e',
    missing: '#ef4444',
    synced: '#22c55e',
    stale: '#f59e0b',
    unavailable: '#94a3b8',
};

const SystemHealthPanel: React.FC = () => {
    const { t } = useTranslation();
    const { report } = useSystemStatus();
    const now = useNow();
    const status = report?.status ?? 'LOADING';
    const summary = report?.summary ?? '';
    const areas = report?.areas ?? {
        groupManager: 'loading' as const,
        keys: 'empty' as const,
        passports: 'missing' as const,
        projections: 'unavailable' as const,
    };
    const warnings = report?.warnings ?? [];
    const timestamp = report?.timestamp ?? now;

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                overflowY: 'auto',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2
                        style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            margin: '0 0 0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <Heart size={28} color="#3b82f6" aria-hidden="true" />{' '}
                        {t('system_health.title')}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                        {t('system_health.subtitle')}
                    </p>
                </div>
            </div>

            {/* Status Badge */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.25rem',
                    borderRadius: 12,
                    background: `${STATUS_COLORS[status]}12`,
                    border: `1px solid ${STATUS_COLORS[status]}40`,
                }}
            >
                <div style={{ color: STATUS_COLORS[status] }}>{STATUS_ICONS[status]}</div>
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: STATUS_COLORS[status],
                        }}
                    >
                        {t(`system_health.status.${status}`)}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{summary}</div>
                </div>
            </div>

            {/* Area Breakdown */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '0.75rem',
                }}
            >
                {(Object.keys(areas) as Array<keyof typeof areas>).map((area) => {
                    const value = areas[area];
                    const color = AREA_STATUS_COLORS[value] || '#94a3b8';
                    return (
                        <div
                            key={area}
                            style={{
                                padding: '1rem',
                                borderRadius: 10,
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    color: 'var(--text-muted)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                }}
                            >
                                {AREA_ICONS[area]} {AREA_LABELS[area]}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ color, fontSize: '0.9rem', fontWeight: 700 }}>
                                    {t(`system_health.area.${value}`)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h3
                        style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            margin: 0,
                            color: 'var(--text-muted)',
                        }}
                    >
                        {t('system_health.warnings')}
                    </h3>
                    {warnings.map((w, _i) => (
                        <div
                            key={w}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 8,
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.15)',
                                fontSize: '0.85rem',
                                color: '#fca5a5',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <AlertTriangle size={12} /> {w}
                        </div>
                    ))}
                </div>
            )}

            {/* Timestamp */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                {t('system_health.updated_at')}: {new Date(timestamp).toLocaleTimeString()}
            </div>
        </div>
    );
};

export default SystemHealthPanel;
