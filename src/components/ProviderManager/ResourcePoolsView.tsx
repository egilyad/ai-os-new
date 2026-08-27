import React, { useMemo } from 'react';
import { Box, Server, Zap, Cpu, Activity } from 'lucide-react'
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import UsageHeatmap from '../UsageHeatmap/UsageHeatmap';
import WhatIfPanel from '../WhatIfPanel/WhatIfPanel';
import type { ApiKey } from '../../types/metrics';
import { FREE_TIER_LIMITS } from '../../kernel/instances';
import { canonicalHealthColor, canonicalHealthLabel } from '../Common/status-vocabulary';
import { POOL_DEFS } from '../../constants/pools';

interface ResourcePoolsViewProps {
  keys: ApiKey[];
}

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

const POOLS: PoolConfig[] = POOL_DEFS.map(p => ({
  ...p,
  icon: POOL_ICONS[p.id] || <Box size={20} />,
}));

const ResourcePoolsView: React.FC<ResourcePoolsViewProps> = ({ keys }) => {
  const poolKeys = useMemo(() => {
    const result: Record<string, ApiKey[]> = {};
    for (const pool of POOLS) {
      result[pool.id] = keys.filter(k => pool.providers.includes(k.provider.toLowerCase()));
    }
    return result;
  }, [keys]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '0.5rem' }}>
        Resource pools group providers by capability profile. Keys are hidden inside each pool — routing selects from the pool, not individual keys.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
        {POOLS.map(pool => {
          const kps = poolKeys[pool.id] || [];
          const activeKeys = kps.filter(k => k.status === 'active').length;
          const totalQuota = kps.reduce((s, k) => s + (k.stats?.extended?.usageToday?.requests || 0), 0);
          const maxLimit = kps.reduce((s, k) => s + (FREE_TIER_LIMITS[k.provider]?.requestsPerDay || 0), 0);
          const usagePct = maxLimit > 0 ? Math.min(100, Math.round((totalQuota / maxLimit) * 100)) : 0;
          const avgLatency = kps.filter(k => k.latency).length > 0
            ? Math.round(kps.filter(k => k.latency).reduce((s, k) => s + (k.latency || 0), 0) / kps.filter(k => k.latency).length)
            : 0;

          return (
            <div
              key={pool.id}
              className="glass-panel"
              style={{ padding: '1.5rem', borderRadius: 16, border: `1px solid ${pool.color}20`, background: `linear-gradient(145deg, ${pool.color}08 0%, rgba(0,0,0,0.2) 100%)` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.6rem', borderRadius: 12, background: `${pool.color}15`, border: `1px solid ${pool.color}30`, color: pool.color }}>
                  {pool.icon}
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-50)' }}>{pool.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{pool.description}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1, padding: '0.75rem', borderRadius: 10, background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: activeKeys > 0 ? '#10b981' : '#64748b' }}>{activeKeys}/{kps.length}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</div>
                </div>
                <div style={{ flex: 1, padding: '0.75rem', borderRadius: 10, background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: avgLatency > 0 ? avgLatency < 500 ? '#10b981' : avgLatency < 1500 ? '#f59e0b' : '#ef4444' : '#64748b' }}>{avgLatency > 0 ? `${avgLatency}ms` : '--'}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Latency</div>
                </div>
                <div style={{ flex: 1, padding: '0.75rem', borderRadius: 10, background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-50)' }}>{kps.length}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Keys</div>
                </div>
              </div>

              {(totalQuota > 0 || maxLimit > 0) && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--slate-400)' }}>Quota Burn</span>
                    <span style={{ color: usagePct > 80 ? '#ef4444' : usagePct > 50 ? '#f59e0b' : '#94a3b8' }}>{usagePct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${usagePct}%`, height: '100%', background: usagePct > 80 ? '#ef4444' : usagePct > 50 ? '#f59e0b' : '#3b82f6', borderRadius: 3 }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {kps.slice(0, 4).map(k => (
                  <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: 8, background: 'rgba(0,0,0,0.15)' }}>
                    <ProviderIcon provider={k.provider} size={12} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-300)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={k.label}>
                      {k.label}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: canonicalHealthColor(k.status), fontWeight: 700 }}>{canonicalHealthLabel(k.status)}</span>
                    {k.latency && <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>{k.latency}ms</span>}
                  </div>
                ))}
                {kps.length > 4 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textAlign: 'center', padding: '0.3rem' }}>
                    +{kps.length - 4} more keys hidden inside pool
                  </div>
                )}
                {kps.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textAlign: 'center', padding: '1rem', fontStyle: 'italic' }}>
                    No providers in this pool
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
        <UsageHeatmap keys={keys} />
      </div>

      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
        <WhatIfPanel />
      </div>
    </div>
  );
};

export default ResourcePoolsView;
