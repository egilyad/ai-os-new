import type React from 'react';

export const CARD: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
};

export const PILL: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.15rem 0.4rem',
    borderRadius: 4,
    fontSize: '0.6rem',
    fontWeight: 600,
};

export const INPUT_STYLE: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.5rem 0.5rem 2rem',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--slate-200)',
    fontSize: '0.8rem',
    outline: 'none',
    boxSizing: 'border-box',
};

export const SMALL_BUTTON: React.CSSProperties = {
    fontSize: '0.65rem',
    padding: '0.2rem 0.5rem',
    borderRadius: 4,
    cursor: 'pointer',
};
