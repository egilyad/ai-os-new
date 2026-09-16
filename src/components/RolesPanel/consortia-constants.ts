import React from 'react';

export const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
    color: active ? '#a78bfa' : '#94a3b8',
    border: `1px solid ${active ? 'rgba(139,92,246,0.3)' : 'transparent'}`,
    transition: 'all 0.15s',
});

export const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 14,
    border: '1px solid rgba(255,255,255,0.08)',
};

export const chip = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: '0.7rem',
    fontWeight: 600,
    background: `${color}20`,
    color,
    border: `1px solid ${color}40`,
});

export const CATEGORY_COLORS: Record<string, string> = {
    philosopher: '#a855f7',
    scientist: '#3b82f6',
    politician: '#ef4444',
    artist: '#f59e0b',
    technologist: '#10b981',
    writer: '#06b6d4',
    strategist: '#f97316',
    religious: '#8b5cf6',
    mythical: '#a855f7',
    economist: '#10b981',
    psychologist: '#3b82f6',
    activist: '#ef4444',
    explorer: '#f59e0b',
    modern_thinker: '#8b5cf6',
    fiction_literature: '#06b6d4',
    fiction_film: '#a855f7',
    archetype: '#f59e0b',
    profession: '#64748b',
    cultural: '#3b82f6',
    psychotype: '#a855f7',
    academic: '#8b5cf6',
    media: '#f97316',
    anthropomorphic: '#10b981',
    neural: '#3b82f6',
    stereotype: '#ef4444',
    technical: '#3b82f6',
    analytical: '#8b5cf6',
    creative: '#f59e0b',
    management: '#10b981',
};

export const CONSULIA_COLORS: Record<string, string> = {
    board: '#a855f7',
    council: '#3b82f6',
    studio: '#f59e0b',
    clinic: '#10b981',
    court: '#ef4444',
    parliament: '#8b5cf6',
    lab: '#06b6d4',
    committee: '#f97316',
    squad: '#3b82f6',
    guild: '#10b981',
};

export const STRATEGY_COLORS: Record<string, string> = {
    parallel: '#10b981',
    sequential: '#3b82f6',
    pipeline: '#8b5cf6',
    debate: '#ef4444',
    consensus: '#f59e0b',
    hierarchical: '#f97316',
    swarm: '#ec4899',
    tournament: '#a855f7',
    'round-robin': '#06b6d4',
    review: '#6366f1',
};
