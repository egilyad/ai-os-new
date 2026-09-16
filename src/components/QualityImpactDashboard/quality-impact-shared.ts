import type React from 'react';

export type Tab = 'impact' | 'experiments' | 'export';

export type SortKey = 'avgJudgeScoreDelta' | 'totalActivations' | 'confidence' | 'techniqueId';
export type SortDir = 'asc' | 'desc';

export const CONFIDENCE_ORDER: Record<string, number> = {
    very_high: 5,
    high: 4,
    medium: 3,
    low: 2,
    none: 1,
};

export const CONFIDENCE_COLOR: Record<string, string> = {
    very_high: '#22c55e',
    high: '#86efac',
    medium: '#facc15',
    low: '#f97316',
    none: '#6b7280',
};

export const PRETTY_CONFIDENCE: Record<string, string> = {
    very_high: 'Very High',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    none: 'None',
};

export const STATUS_COLOR: Record<string, string> = {
    draft: '#6b7280',
    running: '#22c55e',
    completed: '#3b82f6',
    cancelled: '#f97316',
};

export const containerStyle: React.CSSProperties = {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
};
export const headerStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '8px',
    color: 'var(--slate-100)',
};
export const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'var(--slate-400)',
    marginBottom: '24px',
};

export const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
};

export const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    color: active ? '#60a5fa' : '#94a3b8',
    borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
    transition: 'all 0.15s',
    borderRadius: '8px 8px 0 0',
});

export const statsRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
};

export const statCardStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(148, 163, 184, 0.1)',
};

export const statValueStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--slate-100)',
    marginBottom: '4px',
};
export const statLabelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--slate-400)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};

export const tableContainerStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    overflow: 'hidden',
};

export const tableHeaderStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 60px',
    padding: '12px 20px',
    background: 'rgba(15, 23, 42, 0.5)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--slate-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    userSelect: 'none',
};

export const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 60px',
    padding: '12px 20px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s',
};

export const expandedRowStyle: React.CSSProperties = {
    padding: '16px 20px 16px 40px',
    background: 'rgba(15, 23, 42, 0.3)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
    fontSize: '13px',
    color: 'var(--slate-300)',
    lineHeight: 1.6,
};

export const emptyStyle: React.CSSProperties = {
    padding: '60px 20px',
    textAlign: 'center',
    color: 'var(--slate-500)',
};

export const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    background: `${color}20`,
    color,
});

export const deltaStyle = (value: number): React.CSSProperties => ({
    fontWeight: 600,
    color: value >= 0 ? '#22c55e' : '#ef4444',
});

export const formatPct = (v: number): string => {
    if (v === 0) return '0%';
    const abs = Math.abs(v);
    if (abs < 0.001) return '<0.1%';
    return `${(v * 100).toFixed(1)}%`;
};
