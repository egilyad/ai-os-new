import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Users, Zap, Shield, Activity, BarChart3, RefreshCw } from 'lucide-react';
import type { ApiKey } from '../../types/metrics';
import { keyService } from '../../kernel/instances';

interface AnalyticsTabProps {
  apiKey: ApiKey;
}

const MetricCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }> = ({ label, value, icon, color, sub }) => (
  <div style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      <span style={{ color }}>{icon}</span> {label}
    </div>
    <div style={{ fontSize: '1.25rem', fontWeight: 800, color }}>{value}</div>
    {sub && <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{sub}</div>}
  </div>
);

const LatencySparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) {
    return <div style={{ height: 40, fontSize: '0.7rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center' }}>Need more requests</div>;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 200;
  const h = 40;
  const points = data
    .map((v, i) => `${((i / (data.length - 1)) * w).toFixed(0)},${(h - ((v - min) / range) * (h - 4) - 2).toFixed(0)}`)
    .join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth={2} points={points} />
    </svg>
  );
};

/** Key analytics stores reputation on 0–100; older UI assumed 0–1. */
function normalizeReputation(score: number | undefined): number {
  if (score === undefined || Number.isNaN(score)) return 50;
  return score > 1 ? score : score * 100;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ apiKey }) => {
  const [, setTick] = useState(0);
  const stats = apiKey.stats;
  const ext = stats?.extended;
  const learning = ext?.learning;

  const reputationScore = normalizeReputation(ext?.reputationScore);
  const concurrency = ext?.currentConcurrentRequests ?? 0;
  const maxConcurrent = ext?.rules?.maxConcurrentRequests ?? 10;
  const stability = ext?.stabilityIndex ?? 0.5;
  const retryImpact = ext?.retryImpactScore ?? 0;
  const rateLimitPressure = ext?.rateLimitPressure ?? 0;
  const keyAgeScore = ext?.keyAgeScore ?? 0;
  const stabilityForecast = typeof ext?.stabilityForecast === 'number'
    ? ext.stabilityForecast
    : ext?.stabilityForecast === 'stable'
      ? 0.85
      : 0.5;

  const latencySeries = useMemo(
    () => (ext?.throughputHistory || []).map((h) => h.latency).filter((v) => v > 0),
    [ext?.throughputHistory],
  );

  const taskRecommendations = useMemo(() => {
    const insights = learning?.advisorInsights;
    if (insights?.recommendedFor?.length) return insights.recommendedFor;
    const ranked = Object.entries(learning?.performanceByTask || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([task]) => task);
    return ranked;
  }, [learning]);

  const taskAvoid = useMemo(() => {
    const insights = learning?.advisorInsights;
    if (insights?.avoidFor?.length) return insights.avoidFor;
    const ranked = Object.entries(learning?.performanceByTask || {})
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .map(([task]) => task);
    return ranked;
  }, [learning]);

  const getReputationColor = (score: number) => (score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444');
  const getStabilityColor = (score: number) => (score > 0.7 ? '#10b981' : score > 0.4 ? '#f59e0b' : '#ef4444');

  const handleRecalculate = () => {
    keyService.analyticsService.calculateReputation(apiKey);
    setTick((t) => t + 1);
  };

  const concurrencyPct = maxConcurrent > 0 ? (concurrency / maxConcurrent) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleRecalculate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0.4rem 0.75rem',
            borderRadius: 8,
            border: '1px solid rgba(59,130,246,0.3)',
            background: 'var(--accent-tint)',
            color: '#60a5fa',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} /> Recalculate reputation
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        <MetricCard
          label="Reputation"
          value={`${reputationScore.toFixed(0)}/100`}
          icon={<Shield size={16} />}
          color={getReputationColor(reputationScore)}
          sub={reputationScore > 70 ? 'Trusted key' : reputationScore > 40 ? 'Moderate reliability' : 'Low reputation'}
        />
        <MetricCard
          label="Concurrency"
          value={`${concurrency}/${maxConcurrent}`}
          icon={<Users size={16} />}
          color="#3b82f6"
          sub={concurrencyPct > 80 ? 'Near pool limit' : concurrency > 0 ? 'Active' : 'Idle'}
        />
        <MetricCard
          label="Stability"
          value={`${(stability * 100).toFixed(0)}%`}
          icon={<Activity size={16} />}
          color={getStabilityColor(stability)}
          sub={stability > 0.7 ? 'Stable' : stability > 0.4 ? 'Degraded' : 'Unstable'}
        />
        <MetricCard
          label="Key Age Score"
          value={`${(keyAgeScore * 100).toFixed(0)}%`}
          icon={<BarChart3 size={16} />}
          color="#a855f7"
          sub={keyAgeScore > 0.7 ? 'Recent key' : 'Aged key'}
        />
      </div>

      {latencySeries.length >= 2 && (
        <div style={{ padding: '1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-200)', marginBottom: '0.5rem' }}>Latency trend (last {latencySeries.length} requests)</div>
          <LatencySparkline data={latencySeries} color="#3b82f6" />
        </div>
      )}

      {(taskRecommendations.length > 0 || taskAvoid.length > 0) && (
        <div style={{ padding: '1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-200)', marginBottom: '0.75rem' }}>Routing hints (KeyAnalytics)</div>
          {taskRecommendations.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginBottom: '0.5rem' }}>
              Best for:{' '}
              <span style={{ color: '#6ee7b7', fontWeight: 600 }}>{taskRecommendations.join(', ')}</span>
            </div>
          )}
          {taskAvoid.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>
              Avoid for:{' '}
              <span style={{ color: '#fca5a5', fontWeight: 600 }}>{taskAvoid.join(', ')}</span>
            </div>
          )}
          {learning?.advisorInsights?.confidence !== undefined && learning.advisorInsights.confidence > 0 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.5rem' }}>
              Confidence: {(learning.advisorInsights.confidence * 100).toFixed(0)}%
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        <div style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <TrendingUp size={16} color="#3b82f6" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-200)' }}>Performance Indicators</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-400)' }}>
              <span>Success Rate</span>
              <span style={{ color: getReputationColor(reputationScore), fontWeight: 700 }}>
                {stats ? ((stats.successCount / Math.max(1, stats.successCount + stats.errorCount)) * 100).toFixed(1) : '0'}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-400)' }}>
              <span>Avg Latency</span>
              <span style={{ color: 'var(--slate-200)', fontWeight: 700 }}>{stats?.avgLatency?.toFixed(0) ?? '—'}ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-400)' }}>
              <span>Total Tokens</span>
              <span style={{ color: 'var(--slate-200)', fontWeight: 700 }}>{(stats?.totalTokens ?? 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-400)' }}>
              <span>Retry Impact</span>
              <span style={{ color: retryImpact > 0.3 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                {(retryImpact * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-400)' }}>
              <span>Rate Limit Pressure</span>
              <span style={{ color: rateLimitPressure > 0.5 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                {(rateLimitPressure * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Zap size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-200)' }}>Recommendations</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
            {reputationScore < 40 && (
              <div style={{ padding: '0.5rem', borderRadius: 8, background: 'var(--error-tint)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                Low reputation — consider rotating this key
              </div>
            )}
            {rateLimitPressure > 0.5 && (
              <div style={{ padding: '0.5rem', borderRadius: 8, background: 'var(--warning-tint)', border: '1px solid rgba(245,158,11,0.2)', color: '#fcd34d' }}>
                High rate limit pressure — reduce concurrent usage
              </div>
            )}
            {stability < 0.4 && (
              <div style={{ padding: '0.5rem', borderRadius: 8, background: 'var(--warning-tint)', border: '1px solid rgba(245,158,11,0.2)', color: '#fcd34d' }}>
                Unstable key — check provider status
              </div>
            )}
            {retryImpact > 0.3 && (
              <div style={{ padding: '0.5rem', borderRadius: 8, background: 'var(--warning-tint)', border: '1px solid rgba(245,158,11,0.2)', color: '#fcd34d' }}>
                High retry impact — connection issues detected
              </div>
            )}
            {reputationScore >= 70 && stability >= 0.7 && (
              <div style={{ padding: '0.5rem', borderRadius: 8, background: 'var(--success-tint)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
                Key is healthy — ideal for production workloads
              </div>
            )}
            {!ext && (
              <div style={{ padding: '0.5rem', borderRadius: 8, background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', color: 'var(--slate-400)' }}>
                Insufficient data — more requests needed for analysis
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <TrendingDown size={16} color="#a855f7" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-200)' }}>Stability Forecast</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, stabilityForecast * 100)}%`, height: '100%', borderRadius: 4, background: getStabilityColor(stabilityForecast), transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: getStabilityColor(stabilityForecast), minWidth: 40, textAlign: 'right' }}>
            {(stabilityForecast * 100).toFixed(0)}%
          </span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.5rem' }}>
          Projected stability based on recent performance trends and historical patterns
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
