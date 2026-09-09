import { motion } from 'framer-motion';
import { Zap, Hash, Coins, Clock } from 'lucide-react';
import { summaryMetricCard } from '../../styles/common';
import { formatCost } from '../../shared/utils/format-cost';

interface SummaryStatsGridProps {
    totalRequests: number;
    totalTokens: number;
    estimatedCost: number;
    avgLatency: number;
    itemVariants: import('framer-motion').Variants;
    t: (key: string) => string;
}

const SummaryStatsGrid: React.FC<SummaryStatsGridProps> = ({
    totalRequests,
    totalTokens,
    estimatedCost,
    avgLatency,
    itemVariants,
    t,
}) => {
    const items = [
        {
            label: t('analytics.metric.total_invocations'),
            value: totalRequests || 0,
            icon: <Zap size={20} />,
            color: 'var(--accent)',
            trend: '+12.5%',
        },
        {
            label: t('analytics.metric.total_tokens'),
            value: (totalTokens || 0).toLocaleString(),
            icon: <Hash size={20} />,
            color: '#a855f7',
            trend: '+45.2%',
        },
        {
            label: t('analytics.metric.platform_spend'),
            value: formatCost(estimatedCost || 0),
            icon: <Coins size={20} />,
            color: 'var(--success)',
            trend: 'Stable',
        },
        {
            label: t('analytics.metric.fleet_latency'),
            value: `${avgLatency || 0}ms`,
            icon: <Clock size={20} />,
            color: 'var(--warning)',
            trend: '-2.4%',
        },
    ];

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
            }}
        >
            {items.map((s) => (
                <motion.div
                    key={s.label}
                    variants={itemVariants}
                    className="glass-panel"
                    style={summaryMetricCard}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            background: s.color,
                            opacity: 0.05,
                            filter: 'blur(20px)',
                        }}
                        aria-hidden="true"
                    />
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '1rem',
                        }}
                    >
                        <div
                            style={{
                                color: s.color,
                                background: `${s.color}15`,
                                padding: '0.6rem',
                                borderRadius: 12,
                                border: `1px solid ${s.color}30`,
                            }}
                        >
                            {s.icon}
                        </div>
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                color: s.trend.startsWith('+')
                                    ? '#10b981'
                                    : s.trend.startsWith('-')
                                      ? '#3b82f6'
                                      : 'var(--text-muted)',
                                background: 'rgba(0,0,0,0.3)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: 10,
                            }}
                        >
                            {s.trend}
                        </span>
                    </div>
                    <div
                        style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            color: 'var(--slate-50)',
                            letterSpacing: '-0.02em',
                            marginBottom: '0.25rem',
                        }}
                    >
                        {s.value}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', fontWeight: 600 }}>
                        {s.label}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default SummaryStatsGrid;
