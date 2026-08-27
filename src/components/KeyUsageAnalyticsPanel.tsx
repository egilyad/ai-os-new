import React, { useEffect, useState } from 'react';
import { BarChart3, DollarSign, Activity, Zap, Clock, Server } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { keyUsageAnalyticsService } from '../kernel/instances';
import type {
    KeyUsageSummary,
    ProviderUsageBreakdown,
    UsageTrend,
} from '../kernel/contracts/key-usage-analytics';

const PROVIDER_COLORS: Record<string, string> = {
    Groq: '#22c55e',
    Gemini: '#3b82f6',
    NVIDIA: '#10b981',
    OpenRouter: '#a855f7',
};

const StatCard: React.FC<{
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}> = ({ label, value, icon, color }) => (
    <div
        style={{
            background: 'var(--slate-800)',
            borderRadius: 10,
            padding: 14,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
        }}
    >
        <div
            style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color,
                flexShrink: 0,
            }}
        >
            {icon}
        </div>
        <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>{label}</div>
        </div>
    </div>
);

const KeyUsageAnalyticsContent: React.FC = () => {
    const [summary, setSummary] = useState<KeyUsageSummary | null>(null);
    const [breakdown, setBreakdown] = useState<ProviderUsageBreakdown[]>([]);
    const [trends, setTrends] = useState<UsageTrend[]>([]);

    useEffect(() => {
        setSummary(keyUsageAnalyticsService.getSummary());
        setBreakdown(keyUsageAnalyticsService.getProviderBreakdown());
        setTrends(keyUsageAnalyticsService.getTrends(7));
    }, []);

    if (!summary) return null;

    const maxCost = Math.max(...breakdown.map((b) => b.cost), 1);

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>
                Key Usage Analytics
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--slate-400)' }}>
                Usage statistics across all providers and keys
            </p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 10,
                    marginBottom: 20,
                }}
            >
                <StatCard
                    label="Total Keys"
                    value={`${summary.totalKeys}`}
                    icon={<KeyIcon />}
                    color="#3b82f6"
                />
                <StatCard
                    label="Active Keys"
                    value={`${summary.activeKeys}`}
                    icon={<Zap size={18} />}
                    color="#22c55e"
                />
                <StatCard
                    label="Total Requests"
                    value={`${(summary.totalRequests / 1000).toFixed(1)}K`}
                    icon={<Activity size={18} />}
                    color="#a855f7"
                />
                <StatCard
                    label="Total Tokens"
                    value={`${(summary.totalTokens / 1000000).toFixed(1)}M`}
                    icon={<BarChart3 size={18} />}
                    color="#f59e0b"
                />
                <StatCard
                    label="Total Cost"
                    value={`$${summary.totalCost.toFixed(2)}`}
                    icon={<DollarSign size={18} />}
                    color="#10b981"
                />
                <StatCard
                    label="Avg Latency"
                    value={`${summary.avgLatency}ms`}
                    icon={<Clock size={18} />}
                    color="#f97316"
                />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--slate-400)' }}>
                Per-Provider Breakdown
            </h3>
            <div style={{ marginBottom: 20 }}>
                {breakdown.map((b) => (
                    <div
                        key={b.provider}
                        style={{
                            background: 'var(--slate-800)',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 6,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 6,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Server
                                    size={14}
                                    style={{ color: PROVIDER_COLORS[b.provider] || '#64748b' }}
                                />
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{b.provider}</span>
                            </div>
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: PROVIDER_COLORS[b.provider] || '#fff',
                                }}
                            >
                                ${b.cost.toFixed(2)}
                            </span>
                        </div>
                        <div
                            style={{
                                height: 6,
                                background: 'var(--slate-900)',
                                borderRadius: 3,
                                overflow: 'hidden',
                                marginBottom: 6,
                            }}
                        >
                            <div
                                style={{
                                    width: `${(b.cost / maxCost) * 100}%`,
                                    height: '100%',
                                    background: PROVIDER_COLORS[b.provider] || '#64748b',
                                    borderRadius: 3,
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--slate-500)' }}>
                            <span>{b.requestCount.toLocaleString()} requests</span>
                            <span>{(b.tokenCount / 1000000).toFixed(1)}M tokens</span>
                            <span>{b.avgLatency}ms avg</span>
                            <span style={{ color: b.errorRate > 3 ? '#ef4444' : '#22c55e' }}>
                                {b.errorRate}% errors
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--slate-400)' }}>
                7-Day Usage Trend
            </h3>
            <div
                style={{
                    display: 'flex',
                    gap: 4,
                    alignItems: 'flex-end',
                    height: 80,
                    padding: '8px 0',
                }}
            >
                {trends.map((t, i) => {
                    const barH = Math.max(8, (t.requests / 4000) * 70);
                    return (
                        <div
                            key={t.date ?? i}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: barH,
                                    background: 'var(--accent)',
                                    borderRadius: '4px 4px 0 0',
                                    opacity: 0.6 + (barH / 70) * 0.4,
                                    minHeight: 8,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 9,
                                    color: 'var(--slate-500)',
                                    transform: 'rotate(-45deg)',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {t.date.slice(5)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const KeyIcon: React.FC = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="9" cy="9" r="7" />
        <path d="M14 14l6 6" />
        <path d="M14 10h4" />
    </svg>
);

const KeyUsageAnalyticsPanel: React.FC = () => (
    <PanelLoader>
        <KeyUsageAnalyticsContent />
    </PanelLoader>
);
export default KeyUsageAnalyticsPanel;
