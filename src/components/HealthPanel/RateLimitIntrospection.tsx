import { Activity, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import {
    flexBetweenXsMargin,
    flexCenterGap2Mb075,
    h3White,
    progressBar4,
    textWeight700Capitalize,
} from '../../styles/common';
import type { KeyEntry, AlertEntry } from '../../kernel/instances';

interface RateLimitIntrospectionProps {
    keys: KeyEntry[];
    allAlerts: AlertEntry[];
    introspectionResults: Record<string, Record<string, unknown>>;
    introspectingKeys: boolean;
}

export const RateLimitIntrospection: React.FC<RateLimitIntrospectionProps> = ({
    keys,
    allAlerts,
    introspectionResults,
    introspectingKeys,
}) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.5rem',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '0.75rem',
                }}
            >
                <Activity size={20} color="#f59e0b" aria-hidden="true" />
                <h3 style={h3White}>{t('health.rate_limit_introspection')}</h3>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                    {t('health.quota_subtitle')}
                </span>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '0.75rem',
                }}
            >
                {keys.map((key) => {
                    const stats = key.stats?.extended;
                    const usageRequests = stats?.usageToday?.requests || 0;
                    const usageTokens = stats?.usageToday?.tokens || 0;
                    const limitRequests = stats?.rules?.quota?.requestsPerDay || 0;
                    const limitTokens = stats?.rules?.quota?.tokensPerDay || 0;
                    const rateLimitCount = stats?.errorBreakdown?.rateLimit || 0;
                    const pressure = stats?.rateLimitPressure || 0;
                    const reqPct =
                        limitRequests > 0
                            ? Math.min(100, Math.round((usageRequests / limitRequests) * 100))
                            : 0;
                    const tokPct =
                        limitTokens > 0
                            ? Math.min(100, Math.round((usageTokens / limitTokens) * 100))
                            : 0;
                    const alerts = allAlerts.filter((a) => a.keyId === key.id);

                    return (
                        <div
                            key={key.id}
                            style={{
                                padding: '1rem',
                                borderRadius: 12,
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.03)',
                            }}
                        >
                            <div style={flexCenterGap2Mb075}>
                                <ProviderIcon provider={key.provider} size={14} />
                                <span style={textWeight700Capitalize}>{key.provider}</span>
                                {alerts.length > 0 && (
                                    <span style={{ marginLeft: 'auto' }} title={alerts[0]!.message}>
                                        <AlertTriangle size={12} color="#ef4444" />
                                    </span>
                                )}
                            </div>

                            {limitRequests > 0 && (
                                <>
                                    <div style={flexBetweenXsMargin}>
                                        <span style={{ color: 'var(--slate-400)' }}>
                                            {t('health.rate_limit_requests')}
                                        </span>
                                        <span
                                            style={{
                                                color:
                                                    reqPct > 80
                                                        ? '#ef4444'
                                                        : reqPct > 50
                                                          ? '#f59e0b'
                                                          : '#94a3b8',
                                            }}
                                        >
                                            {usageRequests}/{limitRequests}
                                        </span>
                                    </div>
                                    <div style={progressBar4}>
                                        <div
                                            style={{
                                                width: `${reqPct}%`,
                                                height: '100%',
                                                background:
                                                    reqPct > 80
                                                        ? '#ef4444'
                                                        : reqPct > 50
                                                          ? '#f59e0b'
                                                          : '#3b82f6',
                                                borderRadius: 2,
                                            }}
                                        />
                                    </div>
                                </>
                            )}

                            {limitTokens > 0 && (
                                <>
                                    <div style={flexBetweenXsMargin}>
                                        <span style={{ color: 'var(--slate-400)' }}>
                                            {t('health.rate_limit_tokens')}
                                        </span>
                                        <span
                                            style={{
                                                color:
                                                    tokPct > 80
                                                        ? '#ef4444'
                                                        : tokPct > 50
                                                          ? '#f59e0b'
                                                          : '#94a3b8',
                                            }}
                                        >
                                            {(usageTokens / 1000).toFixed(1)}k/
                                            {(limitTokens / 1000).toFixed(0)}k
                                        </span>
                                    </div>
                                    <div style={progressBar4}>
                                        <div
                                            style={{
                                                width: `${tokPct}%`,
                                                height: '100%',
                                                background:
                                                    tokPct > 80
                                                        ? '#ef4444'
                                                        : tokPct > 50
                                                          ? '#f59e0b'
                                                          : '#a855f7',
                                                borderRadius: 2,
                                            }}
                                        />
                                    </div>
                                </>
                            )}

                            <div
                                style={{
                                    display: 'flex',
                                    gap: '0.75rem',
                                    fontSize: '0.65rem',
                                    color: 'var(--slate-500)',
                                    marginTop: '0.25rem',
                                }}
                            >
                                <span>
                                    {t('health.rate_limit_429s', { count: rateLimitCount })}
                                </span>
                                <span>
                                    {t('health.pressure_label', {
                                        value: (pressure * 100).toFixed(0),
                                    })}
                                </span>
                            </div>
                            {introspectionResults[key.id] &&
                                !introspectionResults[key.id]!.error && (
                                    <div
                                        style={{
                                            marginTop: '0.4rem',
                                            padding: '0.35rem 0.5rem',
                                            background: 'rgba(0,0,0,0.25)',
                                            borderRadius: 6,
                                            fontSize: '0.6rem',
                                            color: 'var(--slate-400)',
                                            fontFamily: 'monospace',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {(() => {
                                            const r = introspectionResults[key.id]!;
                                            const parts: string[] = [];
                                            if (r.credits !== undefined)
                                                parts.push(`credits: ${r.credits}`);
                                            if (r.total_granted !== undefined)
                                                parts.push(`granted: ${r.total_granted}`);
                                            if (r.total_available !== undefined)
                                                parts.push(`available: ${r.total_available}`);
                                            if (r.rate_limit_remaining !== undefined)
                                                parts.push(
                                                    `rate-limit: ${r.rate_limit_remaining}/${r.rate_limit_limit}`,
                                                );
                                            if (r.available_models !== undefined)
                                                parts.push(`models: ${r.available_models}`);
                                            if (r.has_generation !== undefined)
                                                parts.push(`gen: ${r.has_generation}`);
                                            return parts.length > 0
                                                ? parts.join(' | ')
                                                : JSON.stringify(r).slice(0, 120);
                                        })()}
                                    </div>
                                )}
                            {Boolean(introspectionResults[key.id]?.error) && (
                                <div
                                    style={{
                                        marginTop: '0.4rem',
                                        fontSize: '0.6rem',
                                        color: 'var(--error)',
                                    }}
                                >
                                    introspection: {String(introspectionResults[key.id]!.error)}
                                </div>
                            )}
                            {introspectingKeys && !introspectionResults[key.id] && (
                                <div
                                    style={{
                                        marginTop: '0.4rem',
                                        fontSize: '0.6rem',
                                        color: 'var(--slate-500)',
                                    }}
                                >
                                    {t('health.loading_introspection')}
                                </div>
                            )}
                        </div>
                    );
                })}
                {keys.length === 0 && (
                    <div
                        style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '2rem',
                            color: 'var(--slate-500)',
                            fontSize: '0.8rem',
                        }}
                    >
                        {t('health.no_api_keys')}
                    </div>
                )}
            </div>
        </div>
    );
};
