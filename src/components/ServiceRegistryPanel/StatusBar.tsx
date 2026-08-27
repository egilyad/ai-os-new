import React from 'react';
import { RefreshCw } from 'lucide-react';
import { styles, type PanelStats } from './service-registry-shared';

interface StatusBarProps {
    status: { phase: string; uptime: number; servicesReady: number; servicesTotal: number };
    now: number;
    lastUpdated: number;
    refresh: () => void;
    stats: PanelStats;
    progress: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
    status,
    now,
    lastUpdated,
    refresh,
    stats,
    progress,
}) => {
    const phaseColor = status.phase === 'ready' ? '#22c55e' : '#eab308';
    return (
        <div style={styles.statusBar}>
            {[
                { label: 'Phase', value: status.phase, color: phaseColor },
                {
                    label: 'Services',
                    value: `${status.servicesReady}/${status.servicesTotal}`,
                    color: '#60a5fa',
                },
                {
                    label: 'Uptime',
                    value: `${Math.floor(status.uptime / 60000)}m`,
                    color: 'var(--purple-muted)',
                },
                { label: 'DI', value: String(stats.di), color: '#34d399' },
                { label: 'Source', value: String(stats.source), color: 'var(--warning)' },
                { label: 'UI Panels', value: String(stats.hasUi), color: '#22d3ee' },
                { label: 'Unmapped', value: String(stats.unmapped), color: 'var(--warning)' },
                { label: 'Dismissed', value: String(stats.dismissed), color: 'var(--slate-500)' },
                {
                    label: 'Progress',
                    value: `${progress}%`,
                    color: progress === '100' ? '#22c55e' : '#a78bfa',
                },
            ].map((s) => (
                <div key={s.label} style={{ ...styles.statBox, borderColor: `${s.color}40` }}>
                    <span style={styles.statLabel}>{s.label}</span>
                    <span style={{ ...styles.statValue, color: s.color }}>{s.value}</span>
                </div>
            ))}
            <div style={styles.statusActions}>
                <button onClick={refresh} style={styles.refreshBtn} title="Refresh">
                    <RefreshCw size={14} />
                </button>
                <span
                    style={{
                        ...styles.timeAgo,
                        color: now - lastUpdated > 60000 ? '#ef4444' : '#64748b',
                    }}
                >
                    {Math.floor((now - lastUpdated) / 1000)}s
                </span>
            </div>
        </div>
    );
};

export default StatusBar;
