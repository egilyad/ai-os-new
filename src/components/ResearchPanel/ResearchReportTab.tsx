import React, { useState } from 'react';
import { Layers, Copy, Check } from 'lucide-react';
import type {
    IResearchEngine,
    ResearchSession,
    ResearchReport,
} from '../../kernel/contracts/research-engine';
import { EmptyState, SectionHeader, ActionButton } from './ResearchSharedComponents';

interface Props {
    engine: IResearchEngine;
    session: ResearchSession;
}

export const ResearchReportTab: React.FC<Props> = ({ engine, session }) => {
    const [data, setData] = useState<ResearchReport | undefined>();
    const [loading, setLoading] = useState(false);
    const [format, setFormat] = useState<'markdown' | 'html' | 'json'>('markdown');
    const [copied, setCopied] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        try {
            const r = await engine.generateResearchReport(session.id, format);
            setData(r);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <SectionHeader
                title="Research Report Generator"
                action={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <select
                            value={format}
                            onChange={(e) =>
                                setFormat(e.target.value as 'markdown' | 'html' | 'json')
                            }
                            style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: '0.72rem',
                                outline: 'none',
                            }}
                        >
                            <option value="markdown">Markdown</option>
                            <option value="html">HTML</option>
                            <option value="json">JSON</option>
                        </select>
                        <ActionButton
                            onClick={handleRun}
                            label="Generate Report"
                            loading={loading}
                            color="#f97316"
                        />
                    </div>
                }
            />
            {data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 8,
                                background: 'rgba(249,115,22,0.1)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Sections
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fb923c' }}>
                                {data.sections.length}
                            </div>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 8,
                                background: 'var(--accent-tint)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Sources
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#60a5fa' }}>
                                {data.sources}
                            </div>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 8,
                                background: 'var(--purple-tint)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Citations
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--purple-muted)' }}>
                                {data.citations.length}
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            maxHeight: 350,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                        }}
                    >
                        {data.sections.map((sec) => (
                            <div
                                key={sec.id}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: 4,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            color: 'var(--slate-200)',
                                        }}
                                    >
                                        {sec.title}
                                    </span>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                        {sec.wordCount} words
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.68rem',
                                        color: 'var(--slate-400)',
                                        lineHeight: 1.5,
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    {sec.content.slice(0, 300)}
                                    {sec.content.length > 300 ? '...' : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                    {data.peerReview && (
                        <div
                            style={{
                                padding: '10px 12px',
                                borderRadius: 8,
                                background: 'rgba(236,72,153,0.05)',
                                border: '1px solid rgba(236,72,153,0.15)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    color: '#f472b6',
                                    marginBottom: 4,
                                }}
                            >
                                Peer Review Summary
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--slate-400)' }}>
                                {data.peerReview.summary}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            const content = data.sections
                                .map((s) => `# ${s.title}\n\n${s.content}`)
                                .join('\n\n---\n\n');
                            navigator.clipboard.writeText(content);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            alignSelf: 'flex-end',
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: copied ? '#22c55e' : '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                        }}
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />}{' '}
                        {copied ? 'Copied' : 'Copy Report'}
                    </button>
                </div>
            ) : (
                <EmptyState
                    icon={<Layers size={32} />}
                    title="No Reports Generated"
                    desc="Generate a comprehensive research report combining all analyses"
                />
            )}
        </div>
    );
};
