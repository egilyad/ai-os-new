import React from 'react';
import { Plus, Minus, BarChart3, Layers, Server, Wifi } from 'lucide-react';
import type { DecisionPayload } from '../../kernel/events';
import { providerBadge } from '../../styles/common';

export const providerColor = (provider: string): string => {
    const colors: Record<string, string> = {
        groq: '#10b981',
        gemini: '#8b5cf6',
        openrouter: '#3b82f6',
        nvidia: '#f59e0b',
        openai: '#10b981',
    };
    return colors[provider.toLowerCase()] || '#94a3b8';
};

export const ScoreBar: React.FC<{
    label: string;
    value: number;
    max?: number;
    color?: string;
    invert?: boolean;
}> = ({ label, value, max = 1, color = '#3b82f6', invert }) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const isNegative = invert ? value > 0 : value < 0;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
            <span style={{ width: 90, color: 'var(--slate-400)', flexShrink: 0, textAlign: 'right' }}>
                {label}
            </span>
            <div
                style={{
                    flex: 1,
                    height: 14,
                    borderRadius: 7,
                    background: 'rgba(0,0,0,0.25)',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        width: `${pct}%`,
                        height: '100%',
                        borderRadius: 7,
                        background: isNegative ? '#ef4444' : color,
                        opacity: 0.7,
                        transition: 'width 0.3s',
                    }}
                />
            </div>
            <span
                style={{
                    width: 56,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: isNegative ? '#ef4444' : value > 0.5 ? '#10b981' : '#e2e8f0',
                    textAlign: 'right',
                }}
            >
                {value.toFixed(3)}
            </span>
        </div>
    );
};

export const ClassificationBadge: React.FC<{ cls: DecisionPayload['classification'] }> = ({
    cls,
}) => {
    if (!cls) return null;
    const tags: { label: string; color: string; icon: React.ReactNode }[] = [];
    tags.push({
        label: cls.complexity,
        color:
            cls.complexity === 'complex'
                ? '#f59e0b'
                : cls.complexity === 'medium'
                  ? '#3b82f6'
                  : '#10b981',
        icon: <BarChart3 size={12} />,
    });
    if (cls.isCode) tags.push({ label: 'code', color: 'var(--purple)', icon: <Layers size={12} /> });
    if (cls.isLong) tags.push({ label: 'long', color: '#06b6d4', icon: <Server size={12} /> });
    if (cls.isMultimodal)
        tags.push({ label: 'multimodal', color: '#ec4899', icon: <Wifi size={12} /> });
    return (
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {tags.map((t) => (
                <span
                    key={t.label}
                    style={{ ...providerBadge, background: `${t.color}15`, color: t.color }}
                >
                    {t.icon} {t.label}
                </span>
            ))}
        </div>
    );
};

export const ComponentRow: React.FC<{
    label: string;
    value: number;
    type: 'bonus' | 'penalty' | 'neutral';
}> = ({ label, value, type }) => {
    if (value === 0) return null;
    const color = type === 'bonus' ? '#10b981' : type === 'penalty' ? '#ef4444' : '#94a3b8';
    const icon = type === 'bonus' ? <Plus size={12} /> : <Minus size={12} />;
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.65rem',
                color,
            }}
        >
            {icon}
            <span style={{ color: 'var(--slate-400)' }}>{label}</span>
            <span style={{ fontWeight: 600, marginLeft: 'auto', fontFamily: 'monospace' }}>
                {type === 'bonus' ? '+' : ''}
                {value.toFixed(4)}
            </span>
        </div>
    );
};
