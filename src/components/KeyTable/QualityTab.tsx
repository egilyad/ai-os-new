import { motion } from 'framer-motion';
import { Activity, Zap, Shield, AlertTriangle, TrendingUp, Users, Cpu } from 'lucide-react';
import type { ApiKey } from '../../types/metrics';
import UsageChart from './UsageChart';

interface QualityTabProps {
  stats: ApiKey['stats']['extended'];
}

const QualityTab: React.FC<QualityTabProps> = ({ stats }) => {
  if (!stats) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-500)' }}>
        No usage data available yet
      </motion.div>
    );
  }

  const stateColor: Record<string, string> = { HEALTHY: '#10b981', UNSTABLE: '#f59e0b', DEGRADED: '#ef4444' };

  const getRecommendation = () => {
    if (stats.currentConcurrentRequests > 10) return { text: 'High concurrency — consider adding more keys', icon: '⚠️', color: 'var(--warning)' };
    if (stats.reputationScore < 40) return { text: 'Low reputation — check error rate and latency', icon: '🔴', color: 'var(--error)' };
    if (stats.retryImpactScore > 70) return { text: 'High retry impact — provider may be unstable', icon: '🔄', color: 'var(--warning)' };
    if (stats.stabilityIndex > 0.85 && stats.reputationScore > 80) return { text: 'Stable and reliable — good for production', icon: '✅', color: 'var(--success)' };
    if (stats.rateLimitPressure > 60) return { text: 'Rate limit pressure rising — consider rotation', icon: '⏳', color: 'var(--warning)' };
    return { text: 'Normal operation — no action needed', icon: '✓', color: 'var(--success)' };
  };

  const rec = getRecommendation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        <MetricCard icon={<Activity size={16} />} label="Reputation" value={`${stats.reputationScore ?? 0}/100`} color={stateColor[stats.state ?? 'HEALTHY'] ?? '#10b981'} />
        <MetricCard icon={<Shield size={16} />} label="State" value={stats.state ?? 'N/A'} color={stateColor[stats.state ?? 'HEALTHY'] ?? '#10b981'} />
        <MetricCard icon={<Zap size={16} />} label="Concurrency" value={`${stats.currentConcurrentRequests ?? 0}`} color={stats.currentConcurrentRequests > 10 ? '#f59e0b' : '#3b82f6'} />
        <MetricCard icon={<Cpu size={16} />} label="Stability" value={`${((stats.stabilityIndex ?? 0) * 100).toFixed(0)}%`} color={(stats.stabilityIndex ?? 0) > 0.8 ? '#10b981' : '#f59e0b'} />
        <MetricCard icon={<TrendingUp size={16} />} label="Retry Impact" value={`${(stats.retryImpactScore ?? 0).toFixed(0)}%`} color={(stats.retryImpactScore ?? 0) > 50 ? '#ef4444' : '#10b981'} />
        <MetricCard icon={<AlertTriangle size={16} />} label="Rate Limit" value={`${(stats.rateLimitPressure ?? 0).toFixed(0)}%`} color={(stats.rateLimitPressure ?? 0) > 50 ? '#f59e0b' : '#10b981'} />
        <MetricCard icon={<Users size={16} />} label="Key Age Score" value={`${(stats.keyAgeScore ?? 0).toFixed(0)}%`} color={(stats.keyAgeScore ?? 0) > 50 ? '#10b981' : '#f59e0b'} />
        <MetricCard icon={<Activity size={16} />} label="Forecast" value={stats.stabilityForecast ?? 'stable'} color={stats.stabilityForecast === 'improving' ? '#10b981' : stats.stabilityForecast === 'degrading' ? '#ef4444' : '#3b82f6'} />
      </div>

      {/* Recommendation */}
      <div style={{ padding: '0.75rem 1rem', borderRadius: 10, border: `1px solid ${rec.color}33`, background: `${rec.color}08`, fontSize: '0.85rem', color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.1rem' }}>{rec.icon}</span>
        <span style={{ color: rec.color, fontWeight: 600 }}>Recommendation:</span>
        {rec.text}
      </div>

      {/* Usage Charts */}
      <UsageChart
        hourlyUsage={stats.hourlyUsage}
        usageToday={stats.usageToday}
        usageMonthly={stats.usageMonthly}
        fourSignals={stats.fourSignals}
      />
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.3rem', color: 'var(--slate-500)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}</div>
  </div>
);

export default QualityTab;
