import { AlertCircle, AlertTriangle, Info, Layers } from 'lucide-react';
import { typeColor } from './arch-review-utils';

interface StatsDashboardProps {
    errorCount: number;
    warningCount: number;
    infoCount: number;
    categoryCount: number;
}

const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    count: number;
    color: string;
}> = ({ icon, label, count, color }) => (
    <div
        style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: 8,
            background: `${color}08`,
            border: `1px solid ${color}15`,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
        }}
    >
        {icon}
        <div>
            <div
                style={{
                    fontSize: '0.65rem',
                    color: 'var(--slate-500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
                {label}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{count}</div>
        </div>
    </div>
);

const StatsDashboard: React.FC<StatsDashboardProps> = ({
    errorCount,
    warningCount,
    infoCount,
    categoryCount,
}) => (
    <div
        style={{
            padding: '0.75rem 1.25rem',
            display: 'flex',
            gap: 8,
            borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}
    >
        <StatCard
            icon={<AlertCircle size={14} color={typeColor('error')} />}
            label="error"
            count={errorCount}
            color={typeColor('error')}
        />
        <StatCard
            icon={<AlertTriangle size={14} color={typeColor('warning')} />}
            label="warning"
            count={warningCount}
            color={typeColor('warning')}
        />
        <StatCard
            icon={<Info size={14} color={typeColor('info')} />}
            label="info"
            count={infoCount}
            color={typeColor('info')}
        />
        <div
            style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
            }}
        >
            <Layers size={14} color="#a855f7" />
            <div>
                <div
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--slate-500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    Categories
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a855f7' }}>
                    {categoryCount}
                </div>
            </div>
        </div>
    </div>
);

export default StatsDashboard;
