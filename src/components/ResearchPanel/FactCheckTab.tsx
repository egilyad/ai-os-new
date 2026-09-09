import React, { useState } from 'react';
import { Shield, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import type {
    IResearchEngine,
    ResearchSession,
    FactCheckReport,
} from '../../kernel/contracts/research-engine';
import { EmptyState, SectionHeader, ActionButton, StatusBadge } from './ResearchSharedComponents';

interface Props {
    engine: IResearchEngine;
    session: ResearchSession;
}

export const FactCheckTab: React.FC<Props> = ({ engine, session }) => {
    const [data, setData] = useState<FactCheckReport | undefined>();
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        try {
            const r = await engine.runFactCheck(session.id);
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
                title="Fact-Checking"
                action={
                    <ActionButton
                        onClick={handleRun}
                        label="Verify Claims"
                        loading={loading}
                        color="#f59e0b"
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
                                Accuracy
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                                {(data.overallAccuracy * 100).toFixed(0)}%
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
                                Verified
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                                {data.verifiedCount}
                            </div>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 8,
                                background: 'var(--error-tint)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Contradicted
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171' }}>
                                {data.contradictedCount}
                            </div>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 8,
                                background: 'var(--warning-tint)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Unverifiable
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>
                                {data.unverifiableCount}
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
                        {data.checks.map((c) => {
                            const sevColor =
                                c.status === 'supported'
                                    ? '#22c55e'
                                    : c.status === 'contradicted'
                                      ? '#ef4444'
                                      : '#f59e0b';
                            return (
                                <div
                                    key={c.id}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        background: `${sevColor}08`,
                                        border: `1px solid ${sevColor}20`,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {c.status === 'supported' ? (
                                            <CheckCircle2 size={14} color={sevColor} />
                                        ) : c.status === 'contradicted' ? (
                                            <AlertCircle size={14} color={sevColor} />
                                        ) : (
                                            <AlertTriangle size={14} color={sevColor} />
                                        )}
                                        <div
                                            style={{
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                                color: 'var(--slate-300)',
                                            }}
                                        >
                                            "{c.claim.slice(0, 80)}
                                            {c.claim.length > 80 ? '...' : ''}"
                                        </div>
                                        <StatusBadge label={c.status} color={sevColor} />
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-400)',
                                            marginTop: 4,
                                        }}
                                    >
                                        {c.explanation}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={<Shield size={32} />}
                    title="No Fact-Check Results"
                    desc="Verify claims against source material"
                />
            )}
        </div>
    );
};
