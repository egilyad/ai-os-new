import { textWhiteXs } from '../styles/common';
import type { TonePoint, PersuasionScore } from '../kernel/utils/debate-analysis';
import { FALLACY_LABELS } from '../kernel/utils/debate-analysis';
import { resolveAgentIdentity } from '../kernel/services/agent-identity';
import { AgentAvatar } from './AgentsPanel/AgentAvatar';

export const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
}> = ({ icon, label, value, color }) => (
    <div
        style={{
            padding: '0.9rem 1rem',
            borderRadius: 12,
            border: `1px solid ${color}20`,
            background: `linear-gradient(145deg, ${color}05 0%, rgba(0,0,0,0.2) 100%)`,
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {icon}
            <span
                style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--slate-400)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
                {label}
            </span>
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
    </div>
);

export const FallacyCard: React.FC<{
    type: string;
    count: number;
    severity: string;
    description: string;
    lang: string;
}> = ({ type, count, severity, description, lang }) => {
    const label = FALLACY_LABELS[type]?.[lang === 'ru' ? 'ru' : 'en'] ?? type;
    return (
        <div
            style={{
                padding: '0.6rem 0.8rem',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...textWhiteXs, fontSize: '0.8rem' }}>{label}</span>
                <span
                    style={{
                        padding: '0.1rem 0.4rem',
                        borderRadius: 6,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        background:
                            severity === 'high'
                                ? 'rgba(239,68,68,0.2)'
                                : severity === 'medium'
                                  ? 'rgba(245,158,11,0.2)'
                                  : 'rgba(59,130,246,0.2)',
                        color:
                            severity === 'high'
                                ? '#fca5a5'
                                : severity === 'medium'
                                  ? '#fbbf24'
                                  : '#93c5fd',
                    }}
                >
                    {severity}
                </span>
            </div>
            <div style={{ color: 'var(--slate-400)', fontSize: '0.75rem', marginTop: 2 }}>{description}</div>
            <div style={{ marginTop: 4, color: 'var(--slate-400)', fontSize: '0.7rem' }}>count: {count}</div>
        </div>
    );
};

export const PersuasionCard: React.FC<{ p: PersuasionScore }> = ({ p }) => {
    const arrow = p.delta > 0.01 ? '↗' : p.delta < -0.01 ? '↘' : '→';
    const color = p.delta > 0.01 ? '#10b981' : p.delta < -0.01 ? '#ef4444' : '#94a3b8';
    const identity = resolveAgentIdentity(p.agentId);
    return (
        <div
            style={{
                padding: '0.6rem 0.8rem',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AgentAvatar
                    agentId={p.agentId}
                    name={identity.displayName}
                    size={20}
                    emoji={identity.avatar.emoji}
                    color={identity.avatar.color}
                    url={identity.avatar.url}
                />
                <span style={{ ...textWhiteXs, fontSize: '0.8rem' }}>{identity.displayName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color }}>
                    {arrow} {(p.delta * 100).toFixed(0)}%
                </span>
                <span style={{ color: 'var(--slate-400)', fontSize: '0.7rem' }}>
                    {p.initialConfidence.toFixed(2)} → {p.finalConfidence.toFixed(2)}
                </span>
            </div>
            <div style={{ color: 'var(--slate-400)', fontSize: '0.7rem' }}>
                rounds: {p.roundsParticipated}
            </div>
        </div>
    );
};

export const ToneChart: React.FC<{ points: TonePoint[] }> = ({ points }) => {
    if (points.length === 0) return null;
    const w = 100;
    const h = 30;
    const path = points
        .map((p, i) => {
            const x = (i / Math.max(1, points.length - 1)) * w;
            const y = h / 2 - (p.sentiment * h) / 2;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <svg
                viewBox={`0 0 ${w} ${h}`}
                preserveAspectRatio="none"
                style={{
                    width: '100%',
                    height: 80,
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 6,
                }}
            >
                <line
                    x1="0"
                    y1={h / 2}
                    x2={w}
                    y2={h / 2}
                    stroke="rgba(255,255,255,0.1)"
                    strokeDasharray="2 2"
                />
                <path d={path} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                {points.map((p, i) => {
                    const x = (i / Math.max(1, points.length - 1)) * w;
                    const y = h / 2 - (p.sentiment * h) / 2;
                    const color =
                        p.sentiment > 0.1 ? '#10b981' : p.sentiment < -0.1 ? '#ef4444' : '#94a3b8';
                    return <circle key={`pt-${i}`} cx={x} cy={y} r="1.2" fill={color} />;
                })}
            </svg>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'var(--slate-400)',
                    fontSize: '0.7rem',
                }}
            >
                <span>R{points[0]!.round}</span>
                <span>R{points[points.length - 1]!.round}</span>
            </div>
        </div>
    );
};
