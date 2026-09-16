import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { GenerationJob } from '../../kernel/types/generator-types';

interface GeneratorDashboardProps {
    jobs: GenerationJob[];
    onRefresh: () => void;
    onCancel: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
    queued: '#f59e0b',
    running: '#22c55e',
    completed: '#10b981',
    failed: '#ef4444',
    cancelled: '#64748b',
};

/**
 * GeneratorDashboard — active + recent generation jobs with status, stage,
 * confidence, tokens and cancel action.
 */
const GeneratorDashboard: React.FC<GeneratorDashboardProps> = ({ jobs, onRefresh, onCancel }) => {
    const { t } = useTranslation();

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                }}
            >
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                    {jobs.length} {t('generator.jobs_active')}
                </div>
                <button
                    onClick={onRefresh}
                    style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'transparent',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                    }}
                >
                    {t('generator.refresh')}
                </button>
            </div>

            {jobs.length === 0 && (
                <div
                    style={{
                        fontSize: '0.75rem',
                        color: 'var(--slate-600)',
                        textAlign: 'center',
                        padding: '1.5rem 0',
                    }}
                >
                    {t('generator.no_jobs')}
                </div>
            )}

            {jobs.map((j) => {
                const statusColor = STATUS_COLORS[j.status] ?? '#94a3b8';
                return (
                    <div
                        key={j.id}
                        style={{
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: '#0d1526',
                            borderRadius: 10,
                            padding: '0.7rem 0.9rem',
                            marginBottom: 10,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: 8,
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--slate-200)',
                                        fontWeight: 600,
                                    }}
                                >
                                    {j.topic}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-400)',
                                        marginTop: 4,
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {j.hypothesis || '—'}
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: '0.68rem',
                                    color: statusColor,
                                    border: `1px solid ${statusColor}55`,
                                    borderRadius: 5,
                                    padding: '0.1rem 0.4rem',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {t(`generator.status_${j.status}`)}
                            </span>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: 12,
                                alignItems: 'center',
                                marginTop: 8,
                                fontSize: '0.68rem',
                                color: 'var(--slate-500)',
                                flexWrap: 'wrap',
                            }}
                        >
                            <span>
                                {t('generator.stage_label')}: {t(`generator.stage_${j.stage}`)}
                            </span>
                            <span style={{ color: 'var(--success)' }}>
                                {t('generator.confidence')}: {j.confidence.toFixed(2)}
                            </span>
                            <span>
                                {j.tokensSpent} {t('generator.tokens')}
                            </span>
                            {j.crystalId && (
                                <span style={{ color: 'var(--success)' }}>
                                    ◆ {j.crystalId.slice(0, 18)}
                                </span>
                            )}
                            {j.error && <span style={{ color: 'var(--error)' }}>{j.error}</span>}
                            {(j.status === 'queued' || j.status === 'running') && (
                                <button
                                    onClick={() => onCancel(j.id)}
                                    style={{
                                        marginLeft: 'auto',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(239,68,68,0.4)',
                                        background: 'transparent',
                                        color: '#fca5a5',
                                        cursor: 'pointer',
                                        fontSize: '0.68rem',
                                    }}
                                >
                                    {t('generator.cancel')}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default GeneratorDashboard;
