import React from 'react';
import { ChevronRight, Play, Loader2 } from 'lucide-react';
import type { SystematicReview } from '../../kernel/contracts/research-engine';
import { StatusBadge as CommonStatusBadge } from '../Common/status-vocabulary';

export const StatusBadge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
    <CommonStatusBadge status={label} color={color} label={label} />
);

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({
    icon,
    title,
    desc,
}) => (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)' }}>
        <div style={{ opacity: 0.3, marginBottom: 8 }}>{icon}</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '0.75rem', marginTop: 4 }}>{desc}</div>
    </div>
);

export const SectionHeader: React.FC<{ title: string; action?: React.ReactNode }> = ({
    title,
    action,
}) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
        }}
    >
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-200)' }}>{title}</div>
        {action}
    </div>
);

export const ActionButton: React.FC<{
    onClick: () => void;
    label: string;
    loading?: boolean;
    color?: string;
    disabled?: boolean;
}> = ({ onClick, label, loading, color = '#3b82f6', disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled || loading}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 8,
            border: `1px solid ${color}40`,
            background: `${color}15`,
            color,
            cursor: disabled || loading ? 'default' : 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            opacity: disabled || loading ? 0.5 : 1,
        }}
    >
        {loading ? <Loader2 size={14} /> : <Play size={14} />} {label}
    </button>
);

export const PrismaFlowVisual: React.FC<{ flow: SystematicReview['prismaFlow'] }> = ({ flow }) => {
    const steps = [
        { label: 'Identified', count: flow.identification, color: 'var(--accent)' },
        { label: 'After Dedup', count: flow.afterDedup, color: '#6366f1' },
        { label: 'Screened', count: flow.screened, color: 'var(--purple)' },
        { label: 'Full Text', count: flow.fullTextAssessed, color: '#a855f7' },
        { label: 'Included', count: flow.included, color: 'var(--success)' },
    ];
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {steps.map((s, i) => (
                <React.Fragment key={s.label}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '6px 10px',
                            borderRadius: 8,
                            background: `${s.color}15`,
                            minWidth: 60,
                        }}
                    >
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>
                            {s.count}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--slate-500)', marginTop: 2 }}>
                            {s.label}
                        </div>
                    </div>
                    {i < steps.length - 1 && <ChevronRight size={14} color="#475569" />}
                </React.Fragment>
            ))}
        </div>
    );
};
