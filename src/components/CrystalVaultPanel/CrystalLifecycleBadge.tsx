import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { CrystalStatus } from '../../kernel/types/crystal-types';

const STATUS_COLORS: Record<CrystalStatus, string> = {
    semi: '#f59e0b',
    crystal: '#10b981',
    superseded: '#64748b',
    refuted: '#ef4444',
};

const STATUS_LABELS: Record<CrystalStatus, string> = {
    semi: 'lenses_crystal.status_semi',
    crystal: 'lenses_crystal.status_crystal',
    superseded: 'lenses_crystal.status_superseded',
    refuted: 'lenses_crystal.status_refuted',
};

interface CrystalLifecycleBadgeProps {
    status: CrystalStatus;
    confidence: number;
}

const CrystalLifecycleBadge: React.FC<CrystalLifecycleBadgeProps> = ({ status, confidence }) => {
    const { t } = useTranslation();
    const color = STATUS_COLORS[status] ?? '#64748b';
    const pct = Math.round(confidence * 100);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
                style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: 5,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                    background: `${color}18`,
                    color,
                    border: `1px solid ${color}44`,
                }}
            >
                {t(STATUS_LABELS[status])}
            </span>
            <div
                style={{
                    width: 60,
                    height: 5,
                    borderRadius: 3,
                    background: 'var(--border-subtle)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: `${pct}%`,
                        height: '100%',
                        borderRadius: 3,
                        background: color,
                    }}
                />
            </div>
            <span style={{ fontSize: '0.62rem', color: 'var(--slate-500)' }}>{pct}%</span>
        </div>
    );
};

export default CrystalLifecycleBadge;
