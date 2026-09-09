import React from 'react';
import { Server } from 'lucide-react';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import { FREE_TIER_LIMITS } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import { thresholdColor } from '../Common/status-vocabulary';
import { SectionTitle } from './DashboardComponents';
import {
    panelRounded16,
    flexColGap2,
    flexCenterSmGap,
    flexCenterGap3,
    flex1Min0,
} from '../../styles/common';
import type { ApiKey } from '../../kernel/types/metrics-types';

interface ProviderPressureMapProps {
    keys: ApiKey[];
    onNavigate: (page: string) => void;
}

const ThresholdBar: React.FC<{ pct: number }> = ({ pct }) => (
    <div
        style={{
            width: '100%',
            height: 4,
            borderRadius: 2,
            background: 'var(--border-subtle)',
            overflow: 'hidden',
        }}
    >
        <div
            style={{
                width: `${Math.min(pct, 100)}%`,
                height: '100%',
                borderRadius: 2,
                background: thresholdColor(pct, 70, 90),
                transition: 'width 0.3s',
            }}
        />
    </div>
);

export const ProviderPressureMap: React.FC<ProviderPressureMapProps> = ({ keys, onNavigate }) => {
    const { t } = useTranslation();

    return (
        <div className="glass-panel" style={panelRounded16}>
            <SectionTitle
                icon={<Server size={16} color="#a855f7" />}
                title={t('dashboard.resource_pressure_map')}
                action={t('dashboard.pools')}
                onAction={() => onNavigate('pools')}
            />
            <div
                style={{
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                {Array.from(new Set(keys.map((k) => k.provider))).map((provider) => {
                    const providerKeys = keys.filter((k) => k.provider === provider);
                    const totalUsed = providerKeys.reduce(
                        (s, k) => s + (k.stats?.extended?.usageToday?.requests || 0),
                        0,
                    );
                    const totalLimit = providerKeys.reduce(
                        (s, k) => s + (FREE_TIER_LIMITS[k.provider]?.requestsPerDay || 0),
                        0,
                    );
                    const avgLat =
                        providerKeys
                            .filter((k) => k.latency)
                            .reduce((s, k) => s + (k.latency || 0), 0) /
                        Math.max(1, providerKeys.filter((k) => k.latency).length);
                    const pct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
                    const color = thresholdColor(pct, 70, 90);
                    return (
                        <div
                            key={provider}
                            style={{
                                flex: '1 1 160px',
                                padding: '0.6rem 0.75rem',
                                borderRadius: 10,
                                background: `${color}08`,
                                border: `1px solid ${color}25`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                                fontSize: '0.7rem',
                            }}
                        >
                            <div style={flexCenterSmGap}>
                                <ProviderIcon provider={provider} size={14} />
                                <span
                                    style={{
                                        fontWeight: 700,
                                        color: 'var(--slate-200)',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {provider}
                                </span>
                                <span style={{ marginLeft: 'auto', fontWeight: 800, color }}>
                                    {pct}%
                                </span>
                            </div>
                            <ThresholdBar pct={pct} />
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    color: 'var(--slate-500)',
                                    fontSize: '0.6rem',
                                }}
                            >
                                <span>
                                    {Math.round(avgLat)}
                                    {t('dashboard.ms_avg')}
                                </span>
                                <span
                                    style={{
                                        color:
                                            providerKeys.filter((k) => k.status === 'error')
                                                .length > 0
                                                ? '#ef4444'
                                                : '#10b981',
                                    }}
                                >
                                    {t('dashboard.active_count', {
                                        active: providerKeys.filter((k) => k.status === 'active')
                                            .length,
                                        total: providerKeys.length,
                                    })}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div style={flexColGap2}>
                {keys.map((key) => {
                    const limit = FREE_TIER_LIMITS[key.provider]?.requestsPerDay;
                    const used = key.stats?.extended?.usageToday?.requests || 0;
                    const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
                    return (
                        <div key={key.id} style={flexCenterGap3}>
                            <ProviderIcon provider={key.provider} size={14} />
                            <div style={flex1Min0}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.7rem',
                                        marginBottom: '0.15rem',
                                    }}
                                >
                                    <span style={{ color: 'var(--slate-200)', fontWeight: 600 }}>
                                        {key.label}
                                    </span>
                                    <span style={{ color: thresholdColor(pct, 70, 90) }}>
                                        {limit
                                            ? `${Math.round(pct)}%`
                                            : `${formatNumber(used)} req`}
                                    </span>
                                </div>
                                <ThresholdBar pct={pct} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

function formatNumber(value: number) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
}
