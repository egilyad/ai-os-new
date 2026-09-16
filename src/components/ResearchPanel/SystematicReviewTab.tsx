import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import type {
    IResearchEngine,
    ResearchSession,
    SystematicReview,
    SystematicReviewConfig,
} from '../../kernel/contracts/research-engine';
import {
    EmptyState,
    SectionHeader,
    ActionButton,
    PrismaFlowVisual,
} from './ResearchSharedComponents';

interface Props {
    engine: IResearchEngine;
    session: ResearchSession;
}

export const SystematicReviewTab: React.FC<Props> = ({ engine, session }) => {
    const [data, setData] = useState<SystematicReview | undefined>();
    const [loading, setLoading] = useState(false);
    const [reviewConfig] = useState<SystematicReviewConfig>({
        inclusionCriteria: [],
        exclusionCriteria: [{ id: 'exc1', field: 'title', operator: 'contains', value: 'spam' }],
        maxSources: 50,
    });

    const handleRun = async () => {
        setLoading(true);
        try {
            const r = await engine.runSystematicReview(session.id, reviewConfig);
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
                title="Systematic Review (PRISMA)"
                action={
                    <ActionButton
                        onClick={handleRun}
                        label="Run Review"
                        loading={loading}
                        color="#10b981"
                    />
                }
            />
            {data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <PrismaFlowVisual flow={data.prismaFlow} />
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <div
                            style={{
                                flex: 1,
                                padding: '10px',
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
                                Included
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>
                                {data.includedSources.length}
                            </div>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                padding: '10px',
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
                                Excluded
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}>
                                {data.excludedSources.length}
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-300)' }}>
                        Bias Assessment
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {(
                            [
                                'selectionBias',
                                'informationBias',
                                'publicationBias',
                                'overall',
                            ] as const
                        ).map((key) => (
                            <div
                                key={key}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: 6,
                                    textAlign: 'center',
                                    background:
                                        data.biasAssessment[key] === 'low'
                                            ? 'rgba(16,185,129,0.1)'
                                            : data.biasAssessment[key] === 'high'
                                              ? 'rgba(239,68,68,0.1)'
                                              : 'rgba(245,158,11,0.1)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.55rem',
                                        color: 'var(--slate-500)',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {key.replace(/([A-Z])/g, ' $1')}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        marginTop: 2,
                                        color:
                                            data.biasAssessment[key] === 'low'
                                                ? '#34d399'
                                                : data.biasAssessment[key] === 'high'
                                                  ? '#f87171'
                                                  : '#fbbf24',
                                    }}
                                >
                                    {data.biasAssessment[key]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={<BookOpen size={32} />}
                    title="No Systematic Review"
                    desc="Run PRISMA systematic review with inclusion/exclusion criteria"
                />
            )}
        </div>
    );
};
