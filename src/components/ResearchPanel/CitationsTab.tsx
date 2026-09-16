import React, { useState } from 'react';
import { Quote, Copy, Check } from 'lucide-react';
import type {
    IResearchEngine,
    ResearchSession,
    CitationExport,
    CitationFormat,
} from '../../kernel/contracts/research-engine';
import { EmptyState, SectionHeader, ActionButton } from './ResearchSharedComponents';

interface Props {
    engine: IResearchEngine;
    session: ResearchSession;
}

export const CitationsTab: React.FC<Props> = ({ engine, session }) => {
    const [data, setData] = useState<CitationExport | undefined>();
    const [loading, setLoading] = useState(false);
    const [format, setFormat] = useState<CitationFormat>('bibtex');
    const [copied, setCopied] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        try {
            const r = await engine.generateCitations(session.id, format);
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
                title="Citation Generator"
                action={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as CitationFormat)}
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
                            <option value="bibtex">BibTeX</option>
                            <option value="apa">APA</option>
                            <option value="mla">MLA</option>
                            <option value="chicago">Chicago</option>
                        </select>
                        <ActionButton
                            onClick={handleRun}
                            label="Generate"
                            loading={loading}
                            color="#a855f7"
                        />
                    </div>
                }
            />
            {data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                            {data.entries.length} entries
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(data.content);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'transparent',
                                color: copied ? '#22c55e' : '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                            }}
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}{' '}
                            {copied ? 'Copied' : 'Copy All'}
                        </button>
                    </div>
                    <pre
                        style={{
                            padding: '12px',
                            borderRadius: 8,
                            background: 'var(--slate-900)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            fontSize: '0.65rem',
                            color: 'var(--slate-400)',
                            maxHeight: 400,
                            overflow: 'auto',
                            fontFamily: "'JetBrains Mono', monospace",
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {data.content}
                    </pre>
                </div>
            ) : (
                <EmptyState
                    icon={<Quote size={32} />}
                    title="No Citations Generated"
                    desc="Generate BibTeX, APA, MLA, or Chicago citations from sources"
                />
            )}
        </div>
    );
};
