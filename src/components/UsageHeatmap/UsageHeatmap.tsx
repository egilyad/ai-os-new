import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react'
import type { ApiKey } from '../../types/metrics';
import { FREE_TIER_LIMITS } from '../../kernel/instances';

interface UsageHeatmapProps {
  keys: ApiKey[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const UsageHeatmap: React.FC<UsageHeatmapProps> = ({ keys }) => {
  const maxRequests = useMemo(() => {
    return Math.max(1, ...keys.map(k => k.stats?.extended?.usageToday?.requests || 0));
  }, [keys]);

  const getIntensity = (used: number): { color: string; opacity: number } => {
    if (used === 0) return { color: 'var(--slate-800)', opacity: 0.3 };
    const pct = used / maxRequests;
    if (pct > 0.8) return { color: 'var(--error)', opacity: 0.9 };
    if (pct > 0.5) return { color: 'var(--warning)', opacity: 0.8 };
    if (pct > 0.2) return { color: 'var(--accent)', opacity: 0.7 };
    return { color: 'var(--success)', opacity: 0.5 };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <BarChart3 size={18} color="#a855f7" />
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--slate-50)' }}>Usage Pattern Heatmap</h3>
        <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Daily request distribution per key</span>
      </div>

      {keys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)', fontSize: '0.85rem' }}>
          No keys configured. Add API keys to see usage patterns.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {keys.map(key => {
            const used = key.stats?.extended?.usageToday?.requests || 0;
            const limit = FREE_TIER_LIMITS[key.provider]?.requestsPerDay;
            const pct = limit ? Math.round((used / limit) * 100) : 0;
            const intensity = getIntensity(used);

            return (
              <div key={key.id} style={{ padding: '1rem', borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: key.status === 'active' ? '#10b981' : '#ef4444' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-200)' }}>{key.label}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{key.provider}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#94a3b8', fontWeight: 700 }}>
                    {used.toLocaleString()} / {limit ? limit.toLocaleString() : '∞'} ({pct}%)
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: 60, marginBottom: '0.5rem' }}>
                  {HOURS.map(hour => {
                    const hourlyData = key.stats?.extended?.hourlyUsage;
                    const hourUsage = hourlyData ? hourlyData[hour] || 0 : 0;
                    const barHeight = Math.max(2, (hourUsage / Math.max(1, maxRequests)) * 100);
                    return (
                      <div
                        key={hour}
                        title={`${hour}:00 - ${hourUsage} req`}
                        style={{
                          flex: 1,
                          height: `${Math.min(100, barHeight * 55)}%`,
                          background: getIntensity(hourUsage).color,
                          opacity: getIntensity(hourUsage).opacity,
                          borderRadius: '2px 2px 0 0',
                          transition: 'all 0.2s',
                          minHeight: 2,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = String(getIntensity(hourUsage).opacity); }}
                      />
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                  {[0, 6, 12, 18, 23].map(h => <span key={h}>{`${h}:00`}</span>)}
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.75rem' }}>
                  {DAYS.map(day => (
                    <div
                      key={day}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '0.25rem 0',
                        borderRadius: 4,
                        background: intensity.color,
                        opacity: intensity.opacity * 0.7,
                        fontSize: '0.6rem',
                        color: 'white',
                        fontWeight: 700,
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', padding: '0.5rem', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--slate-500)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--success)', opacity: 0.5, display: 'inline-block' }} /> Low</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--accent)', opacity: 0.7, display: 'inline-block' }} /> Medium</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--warning)', opacity: 0.8, display: 'inline-block' }} /> High</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--error)', opacity: 0.9, display: 'inline-block' }} /> Critical</span>
      </div>
    </div>
  );
};

export default UsageHeatmap;
