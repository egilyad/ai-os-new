import React from 'react';
import MiniBar from './MiniBar';
import { pLevelColor } from './pressure-map-constants';

export function ProviderListItem({
    provider,
    score,
    level,
}: {
    provider: string;
    score: number;
    level: string;
}) {
    const c = pLevelColor(level);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.text }} />
            <span style={{ flex: 1, color: 'var(--slate-300)' }}>{provider}</span>
            <span style={{ color: c.text, fontWeight: 600 }}>{(score * 100).toFixed(0)}</span>
            <MiniBar pct={score} color={c.text} />
        </div>
    );
}

export function SessionListItem({
    topic,
    sessionId,
    level,
}: {
    topic?: string;
    sessionId: string;
    level: string;
}) {
    const c = pLevelColor(level);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.text }} />
            <span
                style={{
                    flex: 1,
                    color: 'var(--slate-300)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {topic || sessionId.slice(0, 16)}
            </span>
            <span style={{ color: c.text, fontWeight: 600 }}>{level}</span>
        </div>
    );
}

export function BreakdownGrid({ breakdown }: { breakdown: Record<string, number> }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2px 12px',
                fontSize: '0.7rem',
                color: 'var(--slate-400)',
            }}
        >
            {Object.entries(breakdown).map(([k, v]) => (
                <React.Fragment key={k}>
                    <span style={{ color: 'var(--slate-500)' }}>{k}</span>
                    <span>{(v * 100).toFixed(0)}%</span>
                </React.Fragment>
            ))}
        </div>
    );
}
