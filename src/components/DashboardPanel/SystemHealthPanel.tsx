import React from 'react';
import { Activity } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { SectionTitle } from './DashboardComponents';
import { FREE_TIER_LIMITS } from '../../kernel/instances';
import {
    flex1Min100,
    panelRounded16,
    progressBar8,
    textLabelSmall,
    textSmMutedMarginTop,
    textXxsSecondary,
    metricBox,
    flexCenterGap2,
} from '../../styles/common';

interface SystemHealthPanelProps {
    providerCounts: { active: number; error: number; inactive: number };
    keys: Array<{
        provider: string;
        latency?: number;
        stats?: { extended?: { usageToday?: { requests: number } } };
    }>;
    errorRateTrend: string;
    healthIndicators: { score: number; status: string } | null;
    tokenSparkData: number[];
    rps: number;
    todayRequests: number;
    estimatedCost: number;
    onNavigate: (page: string) => void;
}

const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({
    providerCounts,
    keys,
    errorRateTrend,
    healthIndicators,
    tokenSparkData,
    rps,
    todayRequests,
    estimatedCost,
    onNavigate,
}) => {
    const { t } = useTranslation();

    return (
        <div className="glass-panel" style={panelRounded16}>
            <SectionTitle
                icon={<Activity size={16} color="#10b981" />}
                title={t('dashboard.system_health')}
                action={t('dashboard.details')}
                onAction={() => onNavigate('health')}
            />
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginTop: '0.75rem',
                }}
            >
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={flex1Min100}>
                        <div style={textLabelSmall}>{t('dashboard.health_label')}</div>
                        <div style={progressBar8}>
                            <div
                                style={{
                                    width: `${Math.max(10, Math.min(100, (providerCounts.active / Math.max(1, keys.length)) * 100))}%`,
                                    height: '100%',
                                    background: providerCounts.error > 0 ? '#ef4444' : '#10b981',
                                    borderRadius: 4,
                                    transition: 'width 0.5s',
                                }}
                            />
                        </div>
                        <div style={textSmMutedMarginTop}>
                            {t('dashboard.active_count', {
                                active: providerCounts.active,
                                total: keys.length,
                            })}
                        </div>
                    </div>
                    <div style={flex1Min100}>
                        <div style={textLabelSmall}>{t('dashboard.error_rate_label')}</div>
                        <div style={progressBar8}>
                            <div
                                style={{
                                    width: `${Math.min(100, (providerCounts.error / Math.max(1, keys.length)) * 100)}%`,
                                    height: '100%',
                                    background:
                                        providerCounts.error > 2
                                            ? '#ef4444'
                                            : providerCounts.error > 0
                                              ? '#f59e0b'
                                              : '#10b981',
                                    borderRadius: 4,
                                }}
                            />
                        </div>
                        <div
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--slate-400)',
                                marginTop: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            {t('dashboard.error_count', { count: providerCounts.error })}
                            <span
                                style={{
                                    color:
                                        errorRateTrend === 'improving'
                                            ? '#10b981'
                                            : errorRateTrend === 'worsening'
                                              ? '#ef4444'
                                              : '#64748b',
                                    fontSize: '0.65rem',
                                }}
                            >
                                {errorRateTrend === 'improving'
                                    ? t('dashboard.trend_improving')
                                    : errorRateTrend === 'worsening'
                                      ? t('dashboard.trend_worsening')
                                      : t('dashboard.trend_stable')}
                            </span>
                        </div>
                    </div>
                    <div style={flex1Min100}>
                        <div style={textLabelSmall}>{t('dashboard.quota_burn_label')}</div>
                        <div style={progressBar8}>
                            {(() => {
                                const maxQuota = Math.max(
                                    1,
                                    ...keys.map(
                                        (_k) => FREE_TIER_LIMITS[_k.provider]?.requestsPerDay || 1,
                                    ),
                                );
                                const totalUsed = keys.reduce(
                                    (s, _k) => s + (_k.stats?.extended?.usageToday?.requests || 0),
                                    0,
                                );
                                const pct = Math.min(100, (totalUsed / maxQuota) * 100);
                                return (
                                    <div
                                        style={{
                                            width: `${pct}%`,
                                            height: '100%',
                                            background:
                                                pct > 80
                                                    ? '#ef4444'
                                                    : pct > 50
                                                      ? '#f59e0b'
                                                      : '#3b82f6',
                                            borderRadius: 4,
                                        }}
                                    />
                                );
                            })()}
                        </div>
                        <div style={textSmMutedMarginTop}>
                            {keys
                                .reduce(
                                    (s, _k) => s + (_k.stats?.extended?.usageToday?.requests || 0),
                                    0,
                                )
                                .toLocaleString()}{' '}
                            / day
                        </div>
                    </div>
                    <div style={flex1Min100}>
                        <div style={textLabelSmall}>{t('dashboard.latency_label')}</div>
                        <div style={progressBar8}>
                            {(() => {
                                const avgLat =
                                    keys
                                        .filter((_k) => _k.latency)
                                        .reduce((s, _k) => s + (_k.latency || 0), 0) /
                                    Math.max(1, keys.filter((_k) => _k.latency).length);
                                return (
                                    <div
                                        style={{
                                            width: `${Math.min(100, (avgLat / 2000) * 100)}%`,
                                            height: '100%',
                                            background:
                                                avgLat < 500
                                                    ? '#10b981'
                                                    : avgLat < 1500
                                                      ? '#f59e0b'
                                                      : '#ef4444',
                                            borderRadius: 4,
                                        }}
                                    />
                                );
                            })()}
                        </div>
                        <div style={textSmMutedMarginTop}>
                            {keys.filter((_k) => _k.latency).length > 0
                                ? `${Math.round(keys.filter((_k) => _k.latency).reduce((s, _k) => s + (_k.latency || 0), 0) / Math.max(1, keys.filter((_k) => _k.latency).length))}${t('dashboard.ms_avg')}`
                                : t('dashboard.dash')}
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        borderLeft: '1px solid rgba(255,255,255,0.05)',
                        paddingLeft: '1rem',
                    }}
                >
                    {healthIndicators && (
                        <div
                            style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: 8,
                                background: `${healthIndicators.score >= 0.8 ? '#10b981' : healthIndicators.score >= 0.5 ? '#f59e0b' : '#ef4444'}15`,
                                border: `1px solid ${healthIndicators.score >= 0.8 ? '#10b981' : healthIndicators.score >= 0.5 ? '#f59e0b' : '#ef4444'}30`,
                                marginBottom: '0.25rem',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    marginBottom: '0.15rem',
                                }}
                            >
                                {t('dashboard.health_score')}
                            </div>
                            <div style={flexCenterGap2}>
                                <div
                                    style={{
                                        flex: 1,
                                        height: 6,
                                        background: 'var(--border-default)',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${Math.round(healthIndicators.score * 100)}%`,
                                            height: '100%',
                                            background:
                                                healthIndicators.score >= 0.8
                                                    ? '#10b981'
                                                    : healthIndicators.score >= 0.5
                                                      ? '#f59e0b'
                                                      : '#ef4444',
                                            borderRadius: 3,
                                            transition: 'width 0.5s',
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontSize: '1.1rem',
                                        fontWeight: 800,
                                        color:
                                            healthIndicators.score >= 0.8
                                                ? '#10b981'
                                                : healthIndicators.score >= 0.5
                                                  ? '#f59e0b'
                                                  : '#ef4444',
                                    }}
                                >
                                    {Math.round(healthIndicators.score * 100)}%
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    marginTop: '0.15rem',
                                    textTransform: 'capitalize',
                                }}
                            >
                                {t('dashboard.status_label')} {healthIndicators.status}
                            </div>
                        </div>
                    )}
                    {tokenSparkData.some((v) => v > 0) && (
                        <div style={{ marginBottom: '0.5rem' }}>
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    marginBottom: '0.25rem',
                                }}
                            >
                                {t('dashboard.token_spark')}
                            </div>
                            <svg width="100%" height="24" viewBox="0 0 120 24">
                                <defs>
                                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                {tokenSparkData.map((v, i) => {
                                    const barH = Math.max(
                                        2,
                                        (v / Math.max(1, ...tokenSparkData)) * 20,
                                    );
                                    return (
                                        <rect
                                            key={i}
                                            x={i * 20}
                                            y={22 - barH}
                                            width="14"
                                            height={barH}
                                            rx="2"
                                            fill="#a855f7"
                                            opacity={0.6 + (i / tokenSparkData.length) * 0.4}
                                        />
                                    );
                                })}
                            </svg>
                        </div>
                    )}
                    <div
                        style={{
                            fontSize: '0.65rem',
                            color: 'var(--slate-500)',
                            marginBottom: '0.15rem',
                        }}
                    >
                        {t('dashboard.real_time_metrics')}
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.4rem',
                        }}
                    >
                        <div style={metricBox}>
                            <span style={textXxsSecondary}>{t('dashboard.rps')}</span>
                            <div
                                style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    color: rps > 10 ? '#10b981' : rps > 3 ? '#f59e0b' : '#64748b',
                                }}
                            >
                                {rps}
                            </div>
                        </div>
                        <div style={metricBox}>
                            <span style={textXxsSecondary}>{t('dashboard.latency_p50')}</span>
                            <div
                                style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    color: 'var(--slate-50)',
                                }}
                            >
                                {keys.filter((_k) => _k.latency).length > 0
                                    ? `${Math.round(keys.filter((_k) => _k.latency).reduce((s, _k) => s + (_k.latency || 0), 0) / Math.max(1, keys.filter((_k) => _k.latency).length))}${t('chat.latency_ms')}`
                                    : t('dashboard.dash')}
                            </div>
                        </div>
                        <div style={metricBox}>
                            <span style={textXxsSecondary}>{t('dashboard.today_reqs')}</span>
                            <div
                                style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    color: 'var(--slate-50)',
                                }}
                            >
                                {todayRequests}
                            </div>
                        </div>
                        <div style={metricBox}>
                            <span style={textXxsSecondary}>{t('dashboard.cost_today')}</span>
                            <div
                                style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    color: 'var(--warning)',
                                }}
                            >
                                ${estimatedCost.toFixed(4)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemHealthPanel;
