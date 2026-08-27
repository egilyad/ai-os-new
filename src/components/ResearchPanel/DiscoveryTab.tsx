import React, { useState } from 'react';
import { Compass } from 'lucide-react';
import type { IResearchEngine, DiscoveryResult } from '../../kernel/contracts/research-engine';
import { EmptyState, SectionHeader, ActionButton, StatusBadge } from './ResearchSharedComponents';

interface Props {
    engine: IResearchEngine;
}

export const DiscoveryTab: React.FC<Props> = ({ engine }) => {
    const [data, setData] = useState<DiscoveryResult | undefined>();
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        try {
            const r = await engine.runDiscovery();
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
                title="Auto-Discovery"
                action={
                    <ActionButton
                        onClick={handleRun}
                        label="Discover Topics"
                        loading={loading}
                        color="#22c55e"
                    />
                }
            />
            {data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-300)' }}>
                        Topics
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {data.topics.map((t) => (
                            <div
                                key={t.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span
                                            style={{
                                                fontSize: '0.78rem',
                                                fontWeight: 600,
                                                color: 'var(--slate-200)',
                                            }}
                                        >
                                            {t.name}
                                        </span>
                                        <StatusBadge
                                            label={t.trend}
                                            color={
                                                t.trend === 'rising'
                                                    ? '#22c55e'
                                                    : t.trend === 'falling'
                                                      ? '#ef4444'
                                                      : t.trend === 'emerging'
                                                        ? '#a855f7'
                                                        : '#64748b'
                                            }
                                        />
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.65rem',
                                            color: 'var(--slate-500)',
                                            marginTop: 2,
                                        }}
                                    >
                                        {t.description}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div
                                        style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: 'var(--slate-300)',
                                        }}
                                    >
                                        {t.frequency}
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                        mentions
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {data.emergingTopics.length > 0 && (
                        <>
                            <div
                                style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: 'var(--slate-300)',
                                    marginTop: 8,
                                }}
                            >
                                Emerging Topics
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {data.emergingTopics.map((t) => (
                                    <span
                                        key={t.id}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: 6,
                                            fontSize: '0.72rem',
                                            background: 'var(--purple-tint)',
                                            color: '#c4b5fd',
                                            border: '1px solid rgba(168,85,247,0.2)',
                                        }}
                                    >
                                        {t.name}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                    <div
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'var(--slate-300)',
                            marginTop: 4,
                        }}
                    >
                        Recommendations
                    </div>
                    {data.recommendations.map((r) => (
                        <div
                            key={r.topicId}
                            style={{
                                padding: '8px 10px',
                                borderRadius: 6,
                                background: 'rgba(59,130,246,0.05)',
                                border: '1px solid rgba(59,130,246,0.1)',
                                fontSize: '0.72rem',
                                color: 'var(--slate-400)',
                            }}
                        >
                            <span style={{ color: '#60a5fa' }}>⟫</span> {r.reason}
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<Compass size={32} />}
                    title="No Discovery Results"
                    desc="Scan all sessions to find trending and emerging research topics"
                />
            )}
        </div>
    );
};
