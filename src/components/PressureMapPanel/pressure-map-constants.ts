import type React from 'react';
import { getPressureLevelColor } from '../Common/status-vocabulary';

export const CARD: React.CSSProperties = {
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 12,
    padding: '1rem',
    backdropFilter: 'blur(12px)',
};

export const TAB_BTN: React.CSSProperties = {
    padding: '0.4rem 0.75rem',
    borderRadius: 8,
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
};

export function pLevelColor(level: string) {
    const t = getPressureLevelColor(level);
    const isLow = level.toLowerCase() === 'low';
    const r = parseInt(t.slice(1, 3), 16);
    const g = parseInt(t.slice(3, 5), 16);
    const b = parseInt(t.slice(5, 7), 16);
    return {
        bg: `rgba(${r},${g},${b},${isLow ? 0.1 : 0.12})`,
        border: `rgba(${r},${g},${b},${isLow ? 0.4 : 0.5})`,
        text: t,
    };
}
