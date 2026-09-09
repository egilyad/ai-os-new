import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Perspective } from '../../kernel/types/synthesis-types';

/**
 * PerspectiveGrid — N×M grid of role × lens perspectives.
 */
const PerspectiveGrid: React.FC<{ perspectives: Perspective[] }> = ({ perspectives }) => {
    const { t } = useTranslation();
    if (perspectives.length === 0) {
        return <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>—</div>;
    }
    const cols = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(perspectives.length))));

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 8,
                marginTop: 8,
            }}
        >
            {perspectives.map((p) => (
                <div
                    key={p.id}
                    style={{
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: '#0b1220',
                        borderRadius: 8,
                        padding: '0.6rem 0.7rem',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4,
                        }}
                    >
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                            {p.roleName}
                        </span>
                        <span style={{ fontSize: '0.66rem', color: 'var(--warning)' }}>
                            {(p.confidence * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--purple)', marginBottom: 4 }}>
                        {p.lensName}
                    </div>
                    <div
                        style={{
                            fontSize: '0.68rem',
                            color: 'var(--slate-400)',
                            lineHeight: 1.35,
                            maxHeight: 96,
                            overflow: 'hidden',
                        }}
                    >
                        {p.argument}
                    </div>
                    {p.concessions.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                            <span style={{ fontSize: '0.62rem', color: 'var(--success)' }}>
                                {t('synthesis.concessions')}: {p.concessions.join('; ')}
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PerspectiveGrid;
