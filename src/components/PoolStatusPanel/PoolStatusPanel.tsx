import React, { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { Layers, Activity, Settings2, Save, Zap, Server, Cpu, Box } from 'lucide-react';
import { usePoolStatus } from '../../hooks/usePoolStatus';
import type { PoolStrategy } from '../../kernel/instances';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import { POOL_DEFS } from '../../constants/pools';
import ModuleInfo from '../ModuleInfo';
import {
    getStatusColor,
    pctColor,
    latencyColor,
    activeToggleStyle,
} from '../Common/status-vocabulary';

const POOL_STRATEGIES: PoolStrategy[] = ['round-robin', 'least-usage', 'random'];

interface PoolConfig {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    providers: string[];
}

const POOL_ICONS: Record<string, React.ReactNode> = {
    fast: <Zap size={20} />,
    balanced: <Server size={20} />,
    free: <Activity size={20} />,
    experimental: <Cpu size={20} />,
};

const POOLS: PoolConfig[] = POOL_DEFS.map((p) => ({
    ...p,
    icon: POOL_ICONS[p.id] || <Box size={20} />,
}));

const PoolStatusPanel: React.FC = () => {
    const { t } = useTranslation();
    const { keys, quotas, actions } = usePoolStatus();
    const [editingProvider, setEditingProvider] = useState<string | null>(null);
    const [editLimit, setEditLimit] = useState({ requestsPerDay: 0, tokensPerDay: 0 });
    const [viewMode, setViewMode] = useState<'pools' | 'providers'>('pools');
    const [, setRefresh] = useState(0);

    const handleSaveQuota = () => {
        if (editingProvider) {
            actions.setFreeTierLimit(editingProvider, editLimit);
            setEditingProvider(null);
        }
    };

    const providers = [...new Set(keys.map((k) => k.provider))].sort();
    const getPoolKeys = (provider: string) => keys.filter((k) => k.provider === provider);
    const getActivePoolKeys = (provider: string) =>
        getPoolKeys(provider).filter((k) => k.status === 'active');

    return (
        <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Layers size={28} style={{ color: 'var(--accent)' }} />
                    <div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                            {t('pool_status.title')}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                            {t('pool_status.subtitle')}
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '0.3rem',
                        borderRadius: 12,
                    }}
                >
                    <button
                        onClick={() => setViewMode('pools')}
                        style={{
                            ...activeToggleStyle(viewMode === 'pools'),
                            padding: '0.5rem 1rem',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Layers size={14} /> {t('pool_status.view.pools')}
                    </button>
                    <button
                        onClick={() => setViewMode('providers')}
                        style={{
                            ...activeToggleStyle(viewMode === 'providers'),
                            padding: '0.5rem 1rem',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Settings2 size={14} /> {t('pool_status.view.providers')}
                    </button>
                </div>
            </div>

            {viewMode === 'pools' ? (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                        gap: '1.25rem',
                    }}
                >
                    {POOLS.map((pool) => {
                        const kps = keys.filter((k) =>
                            pool.providers.includes(k.provider.toLowerCase()),
                        );
                        const activeKeys = kps.filter((k) => k.status === 'active').length;
                        const totalUsage = kps.reduce(
                            (s, k) => s + (k.stats?.extended?.usageToday?.requests || 0),
                            0,
                        );
                        const maxLimit = kps.reduce(
                            (s, k) => s + (quotas[k.provider]?.requestsPerDay || 0),
                            0,
                        );
                        const usagePct =
                            maxLimit > 0
                                ? Math.min(100, Math.round((totalUsage / maxLimit) * 100))
                                : 0;
                        const avgLatency =
                            kps.filter((k) => k.latency).length > 0
                                ? Math.round(
                                      kps
                                          .filter((k) => k.latency)
                                          .reduce((s, k) => s + (k.latency || 0), 0) /
                                          kps.filter((k) => k.latency).length,
                                  )
                                : 0;

                        return (
                            <div
                                key={pool.id}
                                className="glass-panel"
                                style={{
                                    padding: '1.5rem',
                                    borderRadius: 16,
                                    border: `1px solid ${pool.color}20`,
                                    background: `linear-gradient(145deg, ${pool.color}08 0%, rgba(0,0,0,0.2) 100%)`,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '1rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '0.6rem',
                                            borderRadius: 12,
                                            background: `${pool.color}15`,
                                            border: `1px solid ${pool.color}30`,
                                            color: pool.color,
                                        }}
                                    >
                                        {pool.icon}
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                fontSize: '1.1rem',
                                                fontWeight: 800,
                                                color: 'var(--slate-50)',
                                            }}
                                        >
                                            {t(
                                                `pool_status.pool.${pool.id === 'free' ? 'free_name' : pool.id}`,
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                                            {t(
                                                `pool_status.pool.${pool.id === 'free' ? 'free_name' : pool.id}_desc`,
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: 10,
                                            background: 'rgba(0,0,0,0.2)',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '1.2rem',
                                                fontWeight: 800,
                                                color:
                                                    activeKeys > 0
                                                        ? getStatusColor('active')
                                                        : '#64748b',
                                            }}
                                        >
                                            {activeKeys}/{kps.length}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.65rem',
                                                color: 'var(--slate-500)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                            }}
                                        >
                                            {t('pool_status.stat.active')}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: 10,
                                            background: 'rgba(0,0,0,0.2)',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '1.2rem',
                                                fontWeight: 800,
                                                color:
                                                    avgLatency > 0
                                                        ? latencyColor(avgLatency)
                                                        : '#64748b',
                                            }}
                                        >
                                            {avgLatency > 0
                                                ? `${avgLatency}ms`
                                                : t('common.not_available')}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.65rem',
                                                color: 'var(--slate-500)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                            }}
                                        >
                                            {t('pool_status.stat.avg_latency')}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: 10,
                                            background: 'rgba(0,0,0,0.2)',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '1.2rem',
                                                fontWeight: 800,
                                                color: 'var(--slate-50)',
                                            }}
                                        >
                                            {kps.length}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.65rem',
                                                color: 'var(--slate-500)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                            }}
                                        >
                                            {t('pool_status.stat.keys')}
                                        </div>
                                    </div>
                                </div>

                                {(totalUsage > 0 || maxLimit > 0) && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '0.7rem',
                                                marginBottom: '0.25rem',
                                            }}
                                        >
                                            <span style={{ color: 'var(--slate-400)' }}>
                                                {t('pool_status.quota_burn')}
                                            </span>
                                            <span style={{ color: pctColor(usagePct) }}>
                                                {usagePct}%
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                height: 6,
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: 3,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${usagePct}%`,
                                                    height: '100%',
                                                    background: pctColor(usagePct),
                                                    borderRadius: 3,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.4rem',
                                    }}
                                >
                                    {kps.slice(0, 4).map((k) => {
                                        const used = k.stats?.extended?.usageToday?.requests || 0;
                                        const limit =
                                            k.stats?.extended?.rules?.quota?.requestsPerDay || 0;
                                        const pct =
                                            limit > 0
                                                ? Math.min(100, Math.round((used / limit) * 100))
                                                : 0;
                                        return (
                                            <div
                                                key={k.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.4rem 0.6rem',
                                                    borderRadius: 8,
                                                    background: 'rgba(0,0,0,0.15)',
                                                }}
                                            >
                                                <ProviderIcon provider={k.provider} size={12} />
                                                <span
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        color: 'var(--slate-300)',
                                                        flex: 1,
                                                        minWidth: 0,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                    title={k.label}
                                                >
                                                    {k.label}
                                                </span>
                                                {limit > 0 && (
                                                    <div
                                                        style={{
                                                            width: 40,
                                                            height: 4,
                                                            background: 'var(--border-subtle)',
                                                            borderRadius: 2,
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: `${pct}%`,
                                                                height: '100%',
                                                                background: pctColor(pct),
                                                                borderRadius: 2,
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                <span
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        color: getStatusColor(k.status),
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {k.status === 'active'
                                                        ? t('pool_status.status.ok')
                                                        : t('pool_status.status.err')}
                                                </span>
                                                {k.latency && (
                                                    <span
                                                        style={{
                                                            fontSize: '0.65rem',
                                                            color: 'var(--slate-500)',
                                                        }}
                                                    >
                                                        {k.latency}ms
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {kps.length > 4 && (
                                        <div
                                            style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--slate-500)',
                                                textAlign: 'center',
                                                padding: '0.3rem',
                                            }}
                                        >
                                            +{kps.length - 4} more keys
                                        </div>
                                    )}
                                    {kps.length === 0 && (
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--slate-500)',
                                                textAlign: 'center',
                                                padding: '1rem',
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            {t('pool_status.empty_pool')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: 'var(--slate-400)',
                            padding: '0 0.5rem',
                            marginBottom: '0.25rem',
                        }}
                    >
                        <span>{t('pool_status.table.provider')}</span>
                        <span style={{ display: 'flex', gap: '1rem' }}>
                            <span>{t('pool_status.table.strategy')}</span>
                            <span>{t('pool_status.table.active')}</span>
                            <span>{t('pool_status.table.quota_cap')}</span>
                            <span>{t('pool_status.table.actions')}</span>
                        </span>
                    </div>
                    {providers.map((provider) => {
                        const poolKeys = getPoolKeys(provider);
                        const activeCount = getActivePoolKeys(provider).length;
                        const poolQuota = quotas[provider];
                        const providerStrategy = actions.getPoolStrategy(provider);

                        const distribution = actions.getPoolKeyDistribution(provider);

                        return (
                            <div
                                key={provider}
                                className="glass-panel"
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    position: 'relative',
                                }}
                            >
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <ProviderIcon provider={provider} size={16} />
                                    <span
                                        style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: 'var(--slate-50)',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {provider}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={providerStrategy}
                                            onChange={(e) => {
                                                actions.setPoolStrategy(
                                                    provider,
                                                    e.target.value as PoolStrategy,
                                                );
                                                setRefresh((r) => r + 1);
                                            }}
                                            style={{
                                                padding: '0.3rem 0.5rem',
                                                borderRadius: 6,
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: 'var(--slate-300)',
                                                fontSize: '0.7rem',
                                            }}
                                        >
                                            {POOL_STRATEGIES.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            color: activeCount > 0 ? '#10b981' : '#64748b',
                                            minWidth: 40,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {activeCount}/{poolKeys.length}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-500)',
                                            minWidth: 60,
                                            textAlign: 'right',
                                        }}
                                    >
                                        {poolQuota
                                            ? `${poolQuota.requestsPerDay}/d`
                                            : t('common.not_available')}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setEditingProvider(
                                                editingProvider === provider ? null : provider,
                                            );
                                            if (editingProvider !== provider) {
                                                setEditLimit({
                                                    requestsPerDay: poolQuota?.requestsPerDay || 0,
                                                    tokensPerDay: poolQuota?.tokensPerDay || 0,
                                                });
                                            }
                                        }}
                                        style={{
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: 6,
                                            background:
                                                editingProvider === provider
                                                    ? 'rgba(59,130,246,0.2)'
                                                    : 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'var(--slate-300)',
                                            cursor: 'pointer',
                                            fontSize: '0.7rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <Settings2 size={12} /> {t('pool_status.quota_button')}
                                    </button>
                                </div>
                                {editingProvider === provider && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            marginTop: '4rem',
                                            right: '1rem',
                                            padding: '1rem',
                                            borderRadius: 12,
                                            background: 'var(--slate-800)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            zIndex: 10,
                                            minWidth: 220,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                color: 'var(--slate-50)',
                                                marginBottom: '0.75rem',
                                            }}
                                        >
                                            Edit Free Tier Quota
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem',
                                            }}
                                        >
                                            <label style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                                                Requests / Day
                                            </label>
                                            <input
                                                type="number"
                                                value={editLimit.requestsPerDay}
                                                onChange={(e) =>
                                                    setEditLimit((l) => ({
                                                        ...l,
                                                        requestsPerDay: Number(e.target.value),
                                                    }))
                                                }
                                                style={{
                                                    padding: '0.4rem 0.6rem',
                                                    borderRadius: 6,
                                                    background: 'rgba(0,0,0,0.3)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'var(--slate-50)',
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                            <label style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                                                Tokens / Day
                                            </label>
                                            <input
                                                type="number"
                                                value={editLimit.tokensPerDay}
                                                onChange={(e) =>
                                                    setEditLimit((l) => ({
                                                        ...l,
                                                        tokensPerDay: Number(e.target.value),
                                                    }))
                                                }
                                                style={{
                                                    padding: '0.4rem 0.6rem',
                                                    borderRadius: 6,
                                                    background: 'rgba(0,0,0,0.3)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'var(--slate-50)',
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                            <button
                                                onClick={handleSaveQuota}
                                                style={{
                                                    marginTop: '0.5rem',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: 8,
                                                    background: 'var(--accent)',
                                                    border: 'none',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}
                                            >
                                                <Save size={12} /> {t('common.save')}
                                            </button>
                                        </div>
                                        <div
                                            style={{
                                                marginTop: '0.75rem',
                                                fontSize: '0.65rem',
                                                color: 'var(--slate-500)',
                                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                                paddingTop: '0.5rem',
                                            }}
                                        >
                                            {distribution.filter((d) => d.limit > 0).length > 0 && (
                                                <div>
                                                    <div
                                                        style={{
                                                            marginBottom: '0.3rem',
                                                            color: 'var(--slate-400)',
                                                        }}
                                                    >
                                                        {t('pool_status.key_usage')}
                                                    </div>
                                                    {distribution
                                                        .filter((d) => d.limit > 0)
                                                        .map((d) => (
                                                            <div
                                                                key={d.id}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.3rem',
                                                                    marginBottom: '0.2rem',
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        flex: 1,
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    }}
                                                                >
                                                                    {d.label}
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        color: pctColor(d.pct),
                                                                    }}
                                                                >
                                                                    {d.used}/{d.limit}
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <ModuleInfo moduleKey="pool_status" />
        </div>
    );
};

export default PoolStatusPanel;
