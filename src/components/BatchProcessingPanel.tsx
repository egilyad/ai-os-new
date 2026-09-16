import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { keyService, batchProcessorService } from '../kernel/instances';
import { useTranslation } from '../i18n/useTranslation';
import { Play, X, Download, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { BatchJob, BatchTask } from '../kernel/services/batch-processor-service';

const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.08)',
};

const BatchProcessingPanel: React.FC = () => {
    const { t } = useTranslation();
    const [jobs, setJobs] = useState<BatchJob[]>([]);
    const [prompts, setPrompts] = useState('');
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
    const [selectedModels, setSelectedModels] = useState<Record<string, string[]>>({});
    const [runningJobId, setRunningJobId] = useState<string | null>(null);
    const [jobProgress, setJobProgress] = useState<BatchJob | null>(null);

    const allKeys = useMemo(() => keyService.getKeys(), []);
    const providers = useMemo(() => [...new Set(allKeys.map((k) => k.provider))], [allKeys]);

    const loadJobs = useCallback(async () => {
        const j = await batchProcessorService.getJobs();
        setJobs(j);
    }, []);

    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    const promptList = useMemo(
        () =>
            prompts
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean),
        [prompts],
    );

    const taskList: BatchTask[] = useMemo(() => {
        const tasks: BatchTask[] = [];
        for (const provider of selectedProviders) {
            const models = selectedModels[provider] || [];
            for (const model of models) {
                for (const prompt of promptList) {
                    tasks.push({ prompt, provider, model });
                }
            }
        }
        return tasks;
    }, [promptList, selectedProviders, selectedModels]);

    const toggleProvider = (provider: string) => {
        setSelectedProviders((prev) =>
            prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider],
        );
        if (!selectedModels[provider]) {
            setSelectedModels((prev) => ({ ...prev, [provider]: [] }));
        }
    };

    const toggleModel = (provider: string, model: string) => {
        setSelectedModels((prev) => {
            const models = prev[provider] || [];
            return {
                ...prev,
                [provider]: models.includes(model)
                    ? models.filter((m) => m !== model)
                    : [...models, model],
            };
        });
    };

    const handleRun = async () => {
        if (taskList.length === 0 || runningJobId) return;
        const label = `Batch ${promptList.length} prompts x ${selectedProviders.length} providers`;
        const job = await batchProcessorService.createJob(label, taskList);
        setRunningJobId(job.id);
        if (jobProgress) setJobProgress(job);
        batchProcessorService
            .runJob(job.id, (updated) => setJobProgress({ ...updated }))
            .then(() => {
                setRunningJobId(null);
                setJobProgress(null);
                loadJobs();
            })
            .catch(() => {
                setRunningJobId(null);
                setJobProgress(null);
                loadJobs();
            });
    };

    const handleCancel = () => {
        batchProcessorService.cancelJob();
        setRunningJobId(null);
    };

    const exportCsv = () => {
        const activeJob = jobProgress || jobs[0];
        if (!activeJob) return;
        const headers = 'prompt,provider,model,status,latency,tokens,response,error\n';
        const rows = activeJob.results
            .map(
                (r) =>
                    `"${r.prompt}","${r.provider}","${r.model}","${r.status}",${r.latency},${r.tokens},"${(r.response || '').replace(/"/g, '""')}","${(r.error || '').replace(/"/g, '""')}"`,
            )
            .join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch-results-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const results = jobProgress?.results || [];

    return (
        <div
            style={{
                padding: '2rem',
                maxWidth: 1200,
                margin: '0 auto',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2
                        style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-200)' }}
                    >
                        {t('batch.title')}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                        {t('batch.subtitle')}
                    </p>
                </div>
            </div>

            <div style={card}>
                <h3
                    style={{
                        margin: '0 0 8px',
                        fontSize: '0.9rem',
                        color: 'var(--slate-400)',
                        fontWeight: 600,
                    }}
                >
                    {t('batch.prompts_label')}
                </h3>
                <textarea
                    value={prompts}
                    onChange={(e) => setPrompts(e.target.value)}
                    placeholder={t('batch.prompts_placeholder')}
                    rows={4}
                    style={{
                        width: '100%',
                        padding: 10,
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--slate-200)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        fontFamily: 'monospace',
                        resize: 'vertical',
                    }}
                />
                {promptList.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                        {promptList.length} {t('batch.prompts_count')}
                    </div>
                )}
            </div>

            <div style={card}>
                <h3
                    style={{
                        margin: '0 0 8px',
                        fontSize: '0.9rem',
                        color: 'var(--slate-400)',
                        fontWeight: 600,
                    }}
                >
                    {t('batch.providers_label')}
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {providers.map((p) => {
                        const keys = allKeys.filter((k) => k.provider === p);
                        const models = [...new Set(keys.map((k) => k.model || '').filter(Boolean))];
                        const selected = selectedProviders.includes(p);
                        return (
                            <div
                                key={p}
                                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                            >
                                <button
                                    onClick={() => toggleProvider(p)}
                                    style={{
                                        padding: '4px 12px',
                                        borderRadius: 8,
                                        background: selected
                                            ? 'rgba(16,185,129,0.2)'
                                            : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${selected ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                        color: selected ? '#34d399' : '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {p} ({keys.length})
                                </button>
                                {selected && models.length > 0 && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 2,
                                            marginLeft: 8,
                                        }}
                                    >
                                        {models.map((m) => (
                                            <label
                                                key={m}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    fontSize: '0.75rem',
                                                    color: 'var(--slate-500)',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={(selectedModels[p] || []).includes(m)}
                                                    onChange={() => toggleModel(p, m)}
                                                    style={{ accentColor: '#10b981' }}
                                                />
                                                {m}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {taskList.length > 0 && (
                <div style={card}>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: '0.9rem',
                            color: 'var(--slate-400)',
                            fontWeight: 600,
                        }}
                    >
                        {t('batch.tasks_label')} ({taskList.length})
                    </h3>
                    <div
                        style={{
                            maxHeight: 200,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                        }}
                    >
                        {taskList.slice(0, 50).map((task, i) => (
                            <div
                                key={task.prompt}
                                style={{
                                    fontSize: '0.78rem',
                                    color: 'var(--slate-500)',
                                    display: 'flex',
                                    gap: 8,
                                }}
                            >
                                <span style={{ color: 'var(--slate-400)', minWidth: 24 }}>#{i + 1}</span>
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {task.prompt}
                                </span>
                                <span style={{ color: 'var(--accent)', minWidth: 80 }}>
                                    {task.provider}
                                </span>
                                <span style={{ color: '#a855f7', minWidth: 120 }}>
                                    {task.model}
                                </span>
                            </div>
                        ))}
                        {taskList.length > 50 && (
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-600)',
                                    textAlign: 'center',
                                }}
                            >
                                ...{taskList.length - 50} more
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                    onClick={handleRun}
                    disabled={taskList.length === 0 || !!runningJobId}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 20px',
                        borderRadius: 8,
                        background: runningJobId
                            ? 'rgba(255,255,255,0.05)'
                            : 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        color: runningJobId ? '#64748b' : '#fff',
                        cursor: runningJobId || taskList.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                    }}
                >
                    {runningJobId ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Play size={16} />
                    )}
                    {runningJobId ? t('batch.running') : t('batch.run')}
                </button>
                {runningJobId && (
                    <button
                        onClick={handleCancel}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 8,
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                        }}
                    >
                        <X size={16} /> {t('batch.cancel')}
                    </button>
                )}
                {results.length > 0 && (
                    <button
                        onClick={exportCsv}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            marginLeft: 'auto',
                        }}
                    >
                        <Download size={16} /> CSV
                    </button>
                )}
            </div>

            {jobProgress && (
                <div style={card}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                            fontSize: '0.85rem',
                            color: 'var(--slate-400)',
                        }}
                    >
                        <span>
                            {t('batch.progress')}: {jobProgress.completed + jobProgress.failed}/
                            {jobProgress.total}
                        </span>
                        <span>
                            {jobProgress.failed > 0 && (
                                <span style={{ color: '#f87171', marginRight: 8 }}>
                                    {jobProgress.failed} {t('batch.failed')}
                                </span>
                            )}
                            {Math.round(
                                ((jobProgress.completed + jobProgress.failed) / jobProgress.total) *
                                    100,
                            )}
                            %
                        </span>
                    </div>
                    <div
                        style={{
                            height: 6,
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 3,
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                height: '100%',
                                width: `${((jobProgress.completed + jobProgress.failed) / jobProgress.total) * 100}%`,
                                background: 'linear-gradient(90deg, #10b981, #059669)',
                                borderRadius: 3,
                                transition: 'width 0.3s',
                            }}
                        />
                    </div>
                </div>
            )}

            {results.length > 0 && (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: '0.9rem',
                            color: 'var(--slate-400)',
                            fontWeight: 600,
                        }}
                    >
                        {t('batch.results')} ({results.length})
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1.5fr 80px 80px 80px 1fr',
                            gap: 8,
                            fontSize: '0.78rem',
                            color: 'var(--slate-500)',
                        }}
                    >
                        <div style={{ fontWeight: 600, padding: '4px 8px' }}>
                            {t('batch.col_prompt')}
                        </div>
                        <div style={{ fontWeight: 600, padding: '4px 8px' }}>
                            {t('batch.col_provider')}
                        </div>
                        <div style={{ fontWeight: 600, padding: '4px 8px' }}>
                            {t('batch.col_model')}
                        </div>
                        <div style={{ fontWeight: 600, padding: '4px 8px' }}>
                            {t('batch.col_status')}
                        </div>
                        <div style={{ fontWeight: 600, padding: '4px 8px' }}>
                            {t('batch.col_latency')}
                        </div>
                        <div style={{ fontWeight: 600, padding: '4px 8px' }}>
                            {t('batch.col_tokens')}
                        </div>
                        <div style={{ fontWeight: 600, padding: '4px 8px' }}>
                            {t('batch.col_response')}
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            maxHeight: 400,
                            overflowY: 'auto',
                        }}
                    >
                        {results.map((r, i) => (
                            <div
                                key={r.prompt}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr 1.5fr 80px 80px 80px 1fr',
                                    gap: 8,
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-400)',
                                    padding: '4px 8px',
                                    background:
                                        i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                                    borderRadius: 4,
                                }}
                            >
                                <span
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {r.prompt}
                                </span>
                                <span>{r.provider}</span>
                                <span
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {r.model}
                                </span>
                                <span>
                                    {r.status === 'success' ? (
                                        <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                                    ) : (
                                        <AlertCircle size={14} style={{ color: 'var(--error)' }} />
                                    )}
                                </span>
                                <span>{r.latency}ms</span>
                                <span>{r.tokens}</span>
                                <span
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        color: r.error ? '#f87171' : 'inherit',
                                    }}
                                    title={r.response || r.error}
                                >
                                    {r.response || r.error || ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {jobs.length > 0 && !jobProgress && (
                <div style={card}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: '0.9rem',
                                color: 'var(--slate-400)',
                                fontWeight: 600,
                            }}
                        >
                            {t('batch.history')}
                        </h3>
                        <button
                            onClick={async () => {
                                await batchProcessorService.clearHistory();
                                loadJobs();
                            }}
                            style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: 'var(--error-tint)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: '#f87171',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <Trash2 size={12} /> {t('batch.clear')}
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {jobs.slice(0, 10).map((j) => (
                            <div
                                key={j.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '0.8rem',
                                    color: 'var(--slate-500)',
                                    padding: '6px 8px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: 6,
                                }}
                            >
                                <span>{j.label}</span>
                                <span>
                                    {j.status === 'completed' && (
                                        <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                                    )}
                                    {j.status === 'running' && (
                                        <Loader2 size={14} style={{ color: 'var(--accent)' }} />
                                    )}
                                    {j.status === 'cancelled' && (
                                        <X size={14} style={{ color: 'var(--warning)' }} />
                                    )}
                                    {j.status === 'pending' && (
                                        <span style={{ color: 'var(--slate-500)' }}>⏳</span>
                                    )}
                                    {j.status === 'failed' && (
                                        <AlertCircle size={14} style={{ color: 'var(--error)' }} />
                                    )}
                                    <span style={{ marginLeft: 6 }}>
                                        {j.completed + j.failed}/{j.total}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchProcessingPanel;
