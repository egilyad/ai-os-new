import React from 'react';
import { Code, HelpCircle, BookMarked } from 'lucide-react';
import { CodeBlock } from './doc-helpers';
import {
    flexCenterGap3,
    docCardTitle,
    docIconContainer,
    docCardDesc,
    glassPanelPad15r,
} from '../../styles/common';

export const StepCard: React.FC<{ title: string; text: string; icon: React.ReactNode }> = ({
    title,
    text,
    icon,
}) => (
    <div
        className="glass-panel"
        style={{
            padding: '1.5rem',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            gap: '1.25rem',
            alignItems: 'flex-start',
        }}
    >
        <div
            style={{
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
            }}
        >
            {icon}
        </div>
        <div>
            <h4
                style={{
                    margin: '0 0 0.5rem',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: 'var(--slate-50)',
                }}
            >
                {title}
            </h4>
            <p style={docCardDesc}>{text}</p>
        </div>
    </div>
);

export const ArchCard: React.FC<{
    title: string;
    text: string;
    icon: React.ReactNode;
    border: string;
    bgRgb: string;
}> = ({ title, text, icon, border, bgRgb }) => (
    <div
        className="glass-panel"
        style={{ padding: '2rem', borderRadius: 16, borderTop: `4px solid ${border}` }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.6rem', background: `rgba(${bgRgb},0.1)`, borderRadius: 10 }}>
                {icon}
            </div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                {title}
            </h4>
        </div>
        <p style={docCardDesc}>{text}</p>
    </div>
);

export const ApiCard: React.FC<{ title: string; desc: string; code: string }> = ({
    title,
    desc,
    code,
}) => (
    <div className="glass-panel" style={glassPanelPad15r}>
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
            }}
        >
            <div style={docIconContainer}>
                <Code size={18} color="#3b82f6" />
            </div>
            <h4 style={docCardTitle}>{title}</h4>
        </div>
        <p
            style={{
                fontSize: '0.9rem',
                color: 'var(--slate-400)',
                lineHeight: 1.6,
                marginBottom: '0.75rem',
            }}
        >
            {desc}
        </p>
        <CodeBlock code={code} />
    </div>
);

export const InvariantCard: React.FC<{ inv: string; desc: string; detail: string }> = ({
    inv,
    desc,
    detail,
}) => (
    <div
        className="glass-panel"
        style={{
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'flex-start',
            padding: '1.5rem',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
        }}
    >
        <div
            style={{
                background: 'var(--error-tint)',
                color: 'var(--error)',
                fontSize: '0.75rem',
                fontWeight: 900,
                padding: '0.4rem 0.8rem',
                borderRadius: 8,
                flexShrink: 0,
                border: '1px solid rgba(239,68,68,0.2)',
            }}
        >
            {inv}
        </div>
        <div>
            <div
                style={{
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    marginBottom: '0.4rem',
                    color: 'var(--slate-50)',
                }}
            >
                {desc}
            </div>
            <p style={docCardDesc}>{detail}</p>
        </div>
    </div>
);

export const FaqCard: React.FC<{ q: string; a: string }> = ({ q, a }) => (
    <div
        className="glass-panel"
        style={{
            padding: '1.5rem',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.2)',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={docIconContainer}>
                <HelpCircle size={20} color="#3b82f6" />
            </div>
            <h4 style={docCardTitle}>{q}</h4>
        </div>
        <p
            style={{
                margin: 0,
                fontSize: '0.95rem',
                color: 'var(--slate-300)',
                lineHeight: 1.6,
                paddingLeft: '3.25rem',
            }}
        >
            {a}
        </p>
    </div>
);

export const ChangelogRelease: React.FC<{ version: string; date: string; changes: string[] }> = ({
    version,
    date,
    changes,
}) => (
    <div className="glass-panel" style={glassPanelPad15r}>
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
            }}
        >
            <div style={flexCenterGap3}>
                <div style={docIconContainer}>
                    <BookMarked size={18} color="#3b82f6" />
                </div>
                <h4 style={docCardTitle}>{version}</h4>
            </div>
            <span style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>{date}</span>
        </div>
        <ul
            style={{
                margin: 0,
                paddingLeft: '1.5rem',
                color: 'var(--slate-400)',
                fontSize: '0.9rem',
                lineHeight: 2,
            }}
        >
            {changes.map((c, j) => (
                <li key={j}>{c}</li>
            ))}
        </ul>
    </div>
);

export const KernelServiceList: React.FC<{
    items: { name: string; text: string }[];
    color: string;
}> = ({ items, color }) => (
    <div>
        {items.map((s) => (
            <React.Fragment key={s.name}>
                <strong style={{ color }}>{s.name}</strong>
                {' — '}
                {s.text}
                <br />
            </React.Fragment>
        ))}
    </div>
);

export const SectionPanel: React.FC<{
    title: string;
    icon: React.ReactNode;
    color: string;
    bgGradient: string;
    border: string;
    children: React.ReactNode;
}> = ({ title, icon, color, bgGradient, border, children }) => (
    <div
        className="glass-panel"
        style={{
            padding: '2rem',
            borderRadius: 16,
            border: `1px solid ${border}`,
            background: bgGradient,
        }}
    >
        <h4
            style={{
                margin: '0 0 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '1.1rem',
                fontWeight: 800,
                color,
            }}
        >
            {icon} {title}
        </h4>
        {children}
    </div>
);
