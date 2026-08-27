import { TrendingUp } from 'lucide-react';
import { flexAlignCenterGap2Mb03 } from '../../styles/common';

interface Props {
    scenario: string;
    improvement: string;
    details: string;
    impact: string;
}

const WhatIfCard: React.FC<Props> = ({ scenario, improvement, details, impact }) => (
    <div
        style={{
            padding: '1rem 1.25rem',
            borderRadius: 12,
            background: 'rgba(0,0,0,0.2)',
            border: `1px solid ${impact === 'high' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
            borderLeft: `4px solid ${impact === 'high' ? '#ef4444' : '#f59e0b'}`,
        }}
    >
        <div style={flexAlignCenterGap2Mb03}>
            <TrendingUp size={14} color={impact === 'high' ? '#ef4444' : '#f59e0b'} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                {scenario}
            </span>
            <span
                style={{
                    marginLeft: 'auto',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 4,
                    background:
                        impact === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: impact === 'high' ? '#ef4444' : '#f59e0b',
                }}
            >
                {impact}
            </span>
        </div>
        <div
            style={{
                fontSize: '0.8rem',
                color: 'var(--success)',
                fontWeight: 600,
                marginBottom: '0.25rem',
            }}
        >
            {improvement}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', lineHeight: 1.5 }}>{details}</div>
    </div>
);

export default WhatIfCard;
