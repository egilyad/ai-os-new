import { BarChart } from '../shared/charts/BarChart';
import { RadarChart } from '../shared/charts/RadarChart';
import { motion } from 'framer-motion';
import { formatCost } from '../../shared/utils/format-cost';

interface UsageChartProps {
    hourlyUsage: number[];
    usageToday: { tokens: number; requests: number; estimatedCost: number };
    usageMonthly: { tokens: number; requests: number; estimatedCost: number };
    fourSignals: { latency: number; throughput: number; errorRate?: number; saturation: number };
}

const UsageChart: React.FC<UsageChartProps> = ({
    hourlyUsage,
    usageToday,
    usageMonthly,
    fourSignals,
}) => {
    const hourlyData = hourlyUsage.map((v, i) => ({ hour: `${i}:00`, requests: v }));
    const totalHourlyRequests = hourlyUsage.reduce((s, v) => s + v, 0);

    const signalData = [
        { signal: 'Latency', value: Math.min(1, fourSignals.latency / 5000) },
        { signal: 'Throughput', value: Math.min(1, fourSignals.throughput / 100) },
        { signal: 'Saturation', value: Math.min(1, fourSignals.saturation) },
        { signal: 'Error Rate', value: Math.min(1, fourSignals.errorRate ?? 0) },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
            {totalHourlyRequests > 0 && (
                <div
                    style={{
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                        padding: '1rem',
                        background: 'rgba(0,0,0,0.2)',
                    }}
                >
                    <h4
                        style={{
                            fontSize: '0.75rem',
                            margin: '0 0 0.75rem',
                            color: 'var(--slate-400)',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                        }}
                    >
                        Hourly Requests (today)
                    </h4>
                    <BarChart
                        data={hourlyData}
                        dataKey="requests"
                        xKey="hour"
                        color="#3b82f6"
                        height={180}
                        barRadius={3}
                    />
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div
                    style={{
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                        padding: '1rem',
                        background: 'rgba(0,0,0,0.2)',
                    }}
                >
                    <h4
                        style={{
                            fontSize: '0.75rem',
                            margin: '0 0 0.5rem',
                            color: 'var(--slate-400)',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                        }}
                    >
                        Today
                    </h4>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            fontSize: '0.85rem',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--slate-500)' }}>Requests</span>
                            <span style={{ color: 'var(--slate-200)', fontWeight: 700 }}>
                                {usageToday.requests}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--slate-500)' }}>Tokens</span>
                            <span style={{ color: 'var(--slate-200)', fontWeight: 700 }}>
                                {usageToday.tokens.toLocaleString()}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--slate-500)' }}>Cost</span>
                            <span style={{ color: 'var(--slate-200)', fontWeight: 700 }}>
                                {formatCost(usageToday.estimatedCost)}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                        padding: '1rem',
                        background: 'rgba(0,0,0,0.2)',
                    }}
                >
                    <h4
                        style={{
                            fontSize: '0.75rem',
                            margin: '0 0 0.5rem',
                            color: 'var(--slate-400)',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                        }}
                    >
                        Monthly
                    </h4>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            fontSize: '0.85rem',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--slate-500)' }}>Requests</span>
                            <span style={{ color: 'var(--slate-200)', fontWeight: 700 }}>
                                {usageMonthly.requests}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--slate-500)' }}>Tokens</span>
                            <span style={{ color: 'var(--slate-200)', fontWeight: 700 }}>
                                {usageMonthly.tokens.toLocaleString()}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--slate-500)' }}>Cost</span>
                            <span style={{ color: 'var(--slate-200)', fontWeight: 700 }}>
                                {formatCost(usageMonthly.estimatedCost)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                style={{
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '1rem',
                    background: 'rgba(0,0,0,0.2)',
                }}
            >
                <h4
                    style={{
                        fontSize: '0.75rem',
                        margin: '0 0 0.75rem',
                        color: 'var(--slate-400)',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                    }}
                >
                    Four Signals
                </h4>
                <RadarChart
                    data={signalData}
                    height={200}
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.2}
                    gridColor="rgba(255,255,255,0.1)"
                    tickColor="#94a3b8"
                />
            </div>
        </motion.div>
    );
};

export default UsageChart;
