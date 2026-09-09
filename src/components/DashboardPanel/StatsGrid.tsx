import React from 'react';
import { Activity, DollarSign, MessageCircle, MessageSquare, Server, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n/useTranslation';
import { formatNumber } from './DashboardComponents';

interface StatsGridProps {
    providerCounts: { active: number; error: number; inactive: number };
    keysLength: number;
    todayRequests: number;
    tracesCount: number;
    rps: number;
    activeDebates: number;
    totalTokens: number;
    estimatedCost: number;
}

const StatsGrid: React.FC<StatsGridProps> = ({
    providerCounts,
    keysLength,
    todayRequests,
    tracesCount,
    rps,
    activeDebates,
    totalTokens,
    estimatedCost,
}) => {
    const { t } = useTranslation();

    const stats = [
        {
            label: t('dashboard.active_llms'),
            value: `${providerCounts.active}/${keysLength}`,
            hint: t('dashboard.active_llms_hint', {
                error: providerCounts.error,
                inactive: providerCounts.inactive,
            }),
            icon: <Server size={22} />,
            color: providerCounts.active > 0 ? '#10b981' : '#f59e0b',
        },
        {
            label: t('dashboard.global_throughput'),
            value: todayRequests.toString(),
            hint: t('dashboard.today_sessions', { count: tracesCount }),
            icon: <Activity size={22} />,
            color: 'var(--accent)',
        },
        {
            label: t('dashboard.rps'),
            value: rps.toString(),
            hint: t('dashboard.rps_hint'),
            icon: <Zap size={22} />,
            color: '#06b6d4',
        },
        {
            label: t('dashboard.active_debates'),
            value: activeDebates.toString(),
            hint: t('dashboard.active_debates_hint'),
            icon: <MessageCircle size={22} />,
            color: 'var(--purple)',
        },
        {
            label: t('dashboard.token_burn'),
            value: formatNumber(totalTokens),
            hint: t('dashboard.token_burn_hint'),
            icon: <MessageSquare size={22} />,
            color: '#a855f7',
        },
        {
            label: t('dashboard.calculated_cost'),
            value: `$${estimatedCost.toFixed(4)}`,
            hint: t('dashboard.calculated_cost_hint'),
            icon: <DollarSign size={22} />,
            color: 'var(--warning)',
        },
    ];

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
            }}
        >
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-panel"
                    style={{
                        padding: '1.5rem',
                        borderRadius: 16,
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.05)',
                        background:
                            'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: stat.color,
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
                                color: stat.color,
                                background: `${stat.color}15`,
                                padding: '0.6rem',
                                borderRadius: 12,
                                border: `1px solid ${stat.color}30`,
                            }}
                        >
                            {stat.icon}
                        </div>
                    </div>
                    <div
                        style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            color: 'var(--slate-50)',
                            letterSpacing: '-0.02em',
                            marginBottom: '0.25rem',
                            lineHeight: 1,
                        }}
                    >
                        {stat.value}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-400)' }}>
                        {stat.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.5rem' }}>
                        {stat.hint}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default StatsGrid;
