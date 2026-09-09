import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type {
    IResearchEngine,
    ResearchSession,
    AnomalyReport,
} from '../../kernel/contracts/research-engine';
import { EmptyState, SectionHeader, ActionButton, StatusBadge } from './ResearchSharedComponents';

interface Props {
    engine: IResearchEngine;
    session: ResearchSession;
}

export const AnomaliesTab: React.FC<Props> = ({ engine, session }) => {
    const [data, setData] = useState<AnomalyReport | undefined>();
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        try {
            const r = await engine.detectAnomalies(session.id);
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
                title="Anomaly Detection"
                action={
                    <ActionButton
                        onClick={handleRun}
                        label="Scan for Anomalies"
                        loading={loading}
                        color="#ef4444"
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
                                Critical
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>
                                {data.criticalCount}
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
                                Warnings
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>
                                {data.warningCount}
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
                                Info
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#60a5fa' }}>
                                {data.infoCount}
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
                        {data.anomalies.map((a) => {
                            const sevColor =
                                a.severity === 'critical'
                                    ? '#ef4444'
                                    : a.severity === 'warning'
                                      ? '#f59e0b'
                                      : '#3b82f6';
                            return (
                                <div
                                    key={a.id}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        background: `${sevColor}08`,
                                        border: `1px solid ${sevColor}20`,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {a.severity === 'critical' ? (
                                            <AlertCircle size={14} color={sevColor} />
                                        ) : a.severity === 'warning' ? (
                                            <AlertTriangle size={14} color={sevColor} />
                                        ) : (
                                            <Info size={14} color={sevColor} />
                                        )}
                                        <div
                                            style={{
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                                color: 'var(--slate-300)',
                                            }}
                                        >
                                            {a.type.replace(/_/g, ' ')}
                                        </div>
                                        <StatusBadge label={a.severity} color={sevColor} />
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-400)',
                                            marginTop: 4,
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {a.description}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.65rem',
                                            color: '#60a5fa',
                                            marginTop: 2,
                                        }}
                                    >
                                        Recommendation: {a.recommendation}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={<AlertTriangle size={32} />}
                    title="No Anomalies Detected"
                    desc="Scan session data for contradictions, gaps, and inconsistencies"
                />
            )}
        </div>
    );
};
