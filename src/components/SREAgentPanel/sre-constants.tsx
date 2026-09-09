import { AlertTriangle, Zap, Activity } from 'lucide-react';

export type SREAlert = {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: number;
};

export const SEVERITY_CONFIG: Record<
    string,
    { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
    critical: {
        icon: <AlertTriangle size={16} />,
        color: 'var(--error)',
        bg: 'rgba(239,68,68,0.1)',
        border: 'rgba(239,68,68,0.3)',
    },
    warning: {
        icon: <Zap size={16} />,
        color: 'var(--warning)',
        bg: 'rgba(245,158,11,0.1)',
        border: 'rgba(245,158,11,0.3)',
    },
    info: {
        icon: <Activity size={16} />,
        color: 'var(--accent)',
        bg: 'rgba(59,130,246,0.1)',
        border: 'rgba(59,130,246,0.3)',
    },
};

export const IMPACT_COLORS: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6',
};
