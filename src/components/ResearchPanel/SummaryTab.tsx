import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import type {
    IResearchEngine,
    ResearchSession,
    SummarizationResult,
    SummaryStyle,
    SummaryLength,
} from '../../kernel/contracts/research-engine';
import { EmptyState, SectionHeader, ActionButton } from './ResearchSharedComponents';

interface Props {
    engine: IResearchEngine;
    session: ResearchSession;
}

export const SummaryTab: React.FC<Props> = ({ engine, session }) => {
    const [data, setData] = useState<SummarizationResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [style, setStyle] = useState<SummaryStyle>('hybrid');
    const [length, setLength] = useState<SummaryLength>('normal');

    const handleRun = async () => {
        setLoading(true);
        try {
            await engine.generateSummary(session.id, style, length);
            setData(engine.getSummaries(session.id));
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <SectionHeader
                title="Multi-Document Summarization"
                action={
                    <ActionButton
                        onClick={handleRun}
                        label="Generate Summary"
                        loading={loading}
                        color="#06b6d4"
                    />
                }
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as SummaryStyle)}
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
                    <option value="extractive">Extractive</option>
                    <option value="abstractive">Abstractive</option>
                    <option value="hybrid">Hybrid</option>
                </select>
                <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as SummaryLength)}
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
                    <option value="short">Short</option>
                    <option value="normal">Normal</option>
                    <option value="detailed">Detailed</option>
                </select>
            </div>
            {data.length > 0 ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        maxHeight: 400,
                        overflowY: 'auto',
                    }}
                >
                    {data.map((s) => (
                        <div
                            key={s.id}
                            style={{
                                padding: '10px 12px',
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.72rem',
                                    color: '#06b6d4',
                                    fontWeight: 600,
                                    marginBottom: 4,
                                    textTransform: 'capitalize',
                                }}
                            >
                                {s.style} · {(s.compressionRatio * 100).toFixed(0)}% compression
                            </div>
                            <div
                                style={{
                                    fontSize: '0.68rem',
                                    color: 'var(--slate-400)',
                                    lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                {s.summary.slice(0, 500)}
                                {s.summary.length > 500 ? '...' : ''}
                            </div>
                            {s.keyPoints.length > 0 && (
                                <div style={{ marginTop: 6 }}>
                                    {s.keyPoints.map((kp) => (
                                        <div
                                            key={kp}
                                            style={{
                                                fontSize: '0.65rem',
                                                color: 'var(--slate-500)',
                                                padding: '2px 0',
                                            }}
                                        >
                                            • {kp}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<FileText size={32} />}
                    title="No Summaries"
                    desc="Generate extractive, abstractive, or hybrid summaries from sources"
                />
            )}
        </div>
    );
};
