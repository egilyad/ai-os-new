import { HeartPulse } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import { getHealthBand, HEALTH_THRESHOLDS } from '../../kernel/contracts/key-state';
import {
    flexCenterGap2Mb05,
    flexCenterGap2Mb075,
    h3White,
    textWeight700Capitalize,
} from '../../styles/common';
import type { KeyEntry } from '../../kernel/instances';
import type { IKeyStateStore } from '../../kernel/contracts/key-state';

const HEALTH_BAND_COLORS: Record<string, string> = {
    healthy: '#10b981',
    warm: '#f59e0b',
    degraded: '#f97316',
    cooling: '#ef4444',
    dead: '#dc2626',
};

const HEALTH_BAND_LABELS: Record<string, string> = {
    healthy: 'Healthy',
    warm: 'Warm',
    degraded: 'Degraded',
    cooling: 'Cooling',
    dead: 'Dead',
};

interface HealthScoreSectionProps {
    keyStateStore: IKeyStateStore | null;
    keys: KeyEntry[];
    now: number;
}

export const HealthScoreSection: React.FC<HealthScoreSectionProps> = ({
    keyStateStore,
    keys,
    now,
}) => {
    const { t } = useTranslation();
    const allKeyStates = keyStateStore?.getAll() || [];
    if (allKeyStates.length === 0) return null;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.5rem',
                borderRadius: 16,
                background: 'rgba(16,185,129,0.02)',
                border: '1px solid rgba(16,185,129,0.08)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderBottom: '1px solid rgba(16,185,129,0.08)',
                    paddingBottom: '0.75rem',
                }}
            >
                <HeartPulse size={20} color="#10b981" aria-hidden="true" />
                <h3 style={h3White}>{t('health.health_score_title') || 'Health Score Overview'}</h3>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                    KeyState Projection — recovery +5/min
                </span>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '0.75rem',
                }}
            >
                {allKeyStates.map((ks) => {
                    const band = getHealthBand(ks.healthScore);
                    const color = HEALTH_BAND_COLORS[band] || '#64748b';
                    const label = HEALTH_BAND_LABELS[band] || band;
                    const keyObj = keys.find((k) => k.id === ks.id);
                    const recoveryMinutes =
                        ks.healthScore < HEALTH_THRESHOLDS.healthy
                            ? Math.ceil((HEALTH_THRESHOLDS.healthy - ks.healthScore) / 5)
                            : 0;
                    const degradedAgo = ks.degradedSince
                        ? Math.round((now - ks.degradedSince) / 60000)
                        : null;
                    const healthyAgo = ks.lastHealthyAt
                        ? Math.round((now - ks.lastHealthyAt) / 60000)
                        : null;
                    return (
                        <div
                            key={ks.id}
                            style={{
                                padding: '1rem',
                                borderRadius: 12,
                                background: 'rgba(0,0,0,0.2)',
                                border: `1px solid ${color}20`,
                            }}
                        >
                            <div style={flexCenterGap2Mb075}>
                                <ProviderIcon provider={keyObj?.provider || 'unknown'} size={14} />
                                <span style={textWeight700Capitalize}>
                                    {keyObj?.label || ks.id.slice(0, 8)}
                                </span>
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        padding: '2px 8px',
                                        borderRadius: 10,
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        color,
                                        background: `${color}20`,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {label}
                                </span>
                            </div>
                            <div style={flexCenterGap2Mb05}>
                                <div
                                    style={{
                                        flex: 1,
                                        height: 8,
                                        borderRadius: 4,
                                        background: 'rgba(255,255,255,0.06)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${Math.min(100, ks.healthScore)}%`,
                                            height: '100%',
                                            borderRadius: 4,
                                            background: color,
                                            transition: 'width 0.5s ease',
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 800,
                                        color,
                                        minWidth: 32,
                                        textAlign: 'right',
                                    }}
                                >
                                    {ks.healthScore}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.15rem',
                                    fontSize: '0.65rem',
                                    color: 'var(--slate-500)',
                                }}
                            >
                                {healthyAgo !== null && (
                                    <span>
                                        Last healthy:{' '}
                                        {healthyAgo < 1 ? 'just now' : `${healthyAgo}m ago`}
                                    </span>
                                )}
                                {degradedAgo !== null && (
                                    <span>Degraded since: {degradedAgo}m ago</span>
                                )}
                                {recoveryMinutes > 0 && (
                                    <span style={{ color }}>
                                        Est. recovery: ~{recoveryMinutes}m
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
