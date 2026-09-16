import React, { useState } from 'react';
import { Users } from 'lucide-react';
import type {
    IResearchEngine,
    ResearchSession,
    PeerReview,
} from '../../kernel/contracts/research-engine';
import { EmptyState, SectionHeader, ActionButton, StatusBadge } from './ResearchSharedComponents';

interface Props {
    engine: IResearchEngine;
    session: ResearchSession;
}

export const PeerReviewTab: React.FC<Props> = ({ engine, session }) => {
    const [data, setData] = useState<PeerReview | undefined>();
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        try {
            const r = await engine.runPeerReview(session.id);
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
                title="Peer Review Simulation"
                action={
                    <ActionButton
                        onClick={handleRun}
                        label="Run Review"
                        loading={loading}
                        color="#ec4899"
                    />
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
                                background: 'rgba(236,72,153,0.1)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Reviewers
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f472b6' }}>
                                {data.reviewers.length}
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
                                Score
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--purple-muted)' }}>
                                {data.scores.overall}
                                <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>/100</span>
                            </div>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 8,
                                background: 'var(--success-tint)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Decision
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>
                                {data.recommendation.replace(/_/g, ' ')}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {(['originality', 'methodology', 'clarity', 'significance'] as const).map(
                            (key) => (
                                <div
                                    key={key}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: 6,
                                        textAlign: 'center',
                                        background: 'rgba(255,255,255,0.02)',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '0.55rem',
                                            color: 'var(--slate-500)',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {key}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            color: 'var(--slate-300)',
                                        }}
                                    >
                                        {data.scores[key]}
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                    <div
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'var(--slate-300)',
                            marginTop: 4,
                        }}
                    >
                        Comments
                    </div>
                    <div
                        style={{
                            maxHeight: 250,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                        }}
                    >
                        {data.comments.map((c) => (
                            <div
                                key={c.id}
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: 6,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginBottom: 4,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            color: '#f472b6',
                                        }}
                                    >
                                        {data.reviewers.find((r) => r.id === c.reviewerId)?.name ||
                                            'Reviewer'}
                                    </span>
                                    <StatusBadge
                                        label={c.type.replace(/_/g, ' ')}
                                        color={
                                            c.type === 'major_issue'
                                                ? '#ef4444'
                                                : c.type === 'minor_issue'
                                                  ? '#f59e0b'
                                                  : c.type === 'question'
                                                    ? '#3b82f6'
                                                    : c.type === 'suggestion'
                                                      ? '#06b6d4'
                                                      : '#22c55e'
                                        }
                                    />
                                    <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                        {c.section}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-400)',
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {c.comment}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={<Users size={32} />}
                    title="No Peer Reviews"
                    desc="Simulate multi-reviewer peer review on research output"
                />
            )}
        </div>
    );
};
