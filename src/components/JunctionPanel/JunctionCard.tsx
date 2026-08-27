import React from 'react';
import type { Junction } from '../../kernel/types/junction-types';

interface Props {
    junction: Junction;
}

const TYPE_COLORS: Record<string, string> = {
    structural_analogy: '#8b5cf6',
    contradiction: '#ef4444',
    abstraction: '#10b981',
    pattern_completion: '#f59e0b',
};

const STATUS_LABELS: Record<string, string> = {
    pending: '⏳',
    validated: '✅',
    rejected: '❌',
    superseded: '↩️',
};

/**
 * JunctionCard — a single cross-domain junction: inputs, synthesis type,
 * confidence, cognitive debt and lifecycle status.
 */
const JunctionCard: React.FC<Props> = ({ junction }) => {
    const color = TYPE_COLORS[junction.synthesisType] ?? '#64748b';

    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${color}33`,
                borderRadius: 10,
                padding: '0.85rem 1rem',
                marginBottom: '0.6rem',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.4rem',
                }}
            >
                <span
                    style={{
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color,
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                    }}
                >
                    {junction.synthesisType.replace('_', ' ')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                        style={{
                            fontSize: '0.72rem',
                            color: 'var(--slate-400)',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '2px 7px',
                            borderRadius: 5,
                        }}
                    >
                        {Math.round(junction.confidence * 100)}%
                    </span>
                    <span style={{ fontSize: '0.85rem' }}>
                        {STATUS_LABELS[junction.status] ?? ''}
                    </span>
                </div>
            </div>

            {/* Inputs bridge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
                {junction.inputs.map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {i > 0 && <span style={{ color, fontSize: '0.8rem' }}>⟷</span>}
                        <span
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--slate-300)',
                                background: 'rgba(139,92,246,0.12)',
                                padding: '2px 8px',
                                borderRadius: 5,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            [{s.domain}] {s.label}
                        </span>
                    </div>
                ))}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--slate-200)', margin: '0 0 0.4rem' }}>
                {junction.content}
            </p>

            <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                <span style={{ color: 'var(--purple)', fontWeight: 700 }}>Cognitive debt:</span>{' '}
                {junction.cognitiveDebt}
            </div>
        </div>
    );
};

export default JunctionCard;
