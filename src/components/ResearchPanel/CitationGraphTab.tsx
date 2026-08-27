import React, { useState } from 'react';
import { GitBranch } from 'lucide-react';
import type {
    IResearchEngine,
    ResearchSession,
    CitationGraph,
} from '../../kernel/contracts/research-engine';
import { EmptyState, SectionHeader, ActionButton } from './ResearchSharedComponents';

interface Props {
    engine: IResearchEngine;
    session: ResearchSession;
}

export const CitationGraphTab: React.FC<Props> = ({ engine, session }) => {
    const [data, setData] = useState<CitationGraph | undefined>();
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        try {
            const g = await engine.buildCitationGraph(session.id);
            setData(g);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <SectionHeader
                title="Citation Graph"
                action={<ActionButton onClick={handleRun} label="Build Graph" loading={loading} />}
            />
            {data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 8,
                                background: 'var(--accent-tint)',
                                border: '1px solid rgba(59,130,246,0.2)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Papers
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#60a5fa' }}>
                                {data.totalPapers}
                            </div>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 8,
                                background: 'var(--purple-tint)',
                                border: '1px solid rgba(139,92,246,0.2)',
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
                                {data.totalCitations}
                            </div>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 8,
                                background: 'var(--success-tint)',
                                border: '1px solid rgba(16,185,129,0.2)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Avg Influence
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#34d399' }}>
                                {(data.avgInfluence * 100).toFixed(0)}%
                            </div>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 8,
                                background: 'var(--warning-tint)',
                                border: '1px solid rgba(245,158,11,0.2)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                H-Index
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>
                                {data.hIndex}
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                        {data.links.length} citation links between {data.nodes.length} papers
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={<GitBranch size={32} />}
                    title="No Citation Graph"
                    desc="Run analysis to build citation graph from sources"
                />
            )}
        </div>
    );
};
