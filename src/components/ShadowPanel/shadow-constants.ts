import type React from 'react';

export const CARD: React.CSSProperties = {
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 12,
    padding: '1rem',
    backdropFilter: 'blur(12px)',
};

export const BADGE: React.CSSProperties = {
    padding: '0.15rem 0.4rem',
    borderRadius: 4,
    fontSize: '0.6rem',
    fontWeight: 600,
};

export const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
    critical: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
    high: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
    medium: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
    low: { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
};
