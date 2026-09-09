import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { Database, Plus, Play, Trash2, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import type { EvalDataset, EvalRun } from '../kernel/contracts/eval-dataset';
import { errorBanner, dismissBtn } from '../styles/common';

const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.08)',
};

const btn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--slate-200)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    background: 'rgba(255,255,255,0.05)',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--slate-200)',
    fontSize: '0.85rem',
    outline: 'none',
};

const EvalDatasetPanel: React.FC = () => {
    const { t } = useTranslation();
    const [datasets, setDatasets] = useState<EvalDataset[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [inputText, setInputText] = useState('');
    const [runningId, setRunningId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            const m = await import('../kernel/instances');
            const s = m.evalDatasetService;
            if (s) setDatasets(await s.list());
        } catch (e) {
            setError(
                `Failed to load datasets: ${e instanceof Error ? e.message : 'Unknown error'}`,
            );
        }
    }

    async function handleCreate() {
        if (!name.trim()) return;
        try {
            const m = await import('../kernel/instances');
            const s = m.evalDatasetService;
            if (!s) return;
            const prompts = inputText
                .split('\n')
                .filter(Boolean)
                .map((input) => ({ input }));
            await s.create({ name, description, prompts, tags: [] });
            setName('');
            setDescription('');
            setInputText('');
            setShowCreate(false);
            await load();
        } catch (e) {
            setError(
                `Failed to create dataset: ${e instanceof Error ? e.message : 'Unknown error'}`,
            );
        }
    }

    async function handleDelete(id: string) {
        try {
            const m = await import('../kernel/instances');
            const s = m.evalDatasetService;
            if (s) await s.delete(id);
            await load();
        } catch (e) {
            setError(
                `Failed to delete dataset: ${e instanceof Error ? e.message : 'Unknown error'}`,
            );
        }
    }

    async function handleRun(datasetId: string) {
        setRunningId(datasetId);
        try {
            const m = await import('../kernel/instances');
            const s = m.evalDatasetService;
            const { keyService } = m;
            const keys = keyService?.getKeys() || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const providers = [...new Set(keys.map((k: any) => k.provider))];
            if (providers.length === 0) return;
            await s.runEval(datasetId, providers[0], '');
            await load();
        } catch (e) {
            setError(`Failed to run eval: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
        setRunningId(null);
    }

    return (
        <div style={{ padding: 24, maxWidth: 900 }}>
            {error && (
                <div role="alert" aria-live="polite" style={errorBanner}>
                    {error}
                    <button onClick={() => setError(null)} style={dismissBtn} aria-label="Dismiss">
                        ✕
                    </button>
                </div>
            )}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                }}
            >
                <div>
                    <h2
                        style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--slate-200)' }}
                    >
                        {t('eval.title') || 'Evaluation Datasets'}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                        {t('eval.subtitle') ||
                            'Create and run evaluation datasets against your models'}
                    </p>
                </div>
                <button style={btn} onClick={() => setShowCreate(!showCreate)}>
                    <Plus size={16} /> {t('eval.create') || 'New Dataset'}
                </button>
            </div>

            {showCreate && (
                <div
                    style={{
                        ...card,
                        marginBottom: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    <input
                        style={inputStyle}
                        placeholder={t('eval.form_name') || 'Dataset name'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        style={inputStyle}
                        placeholder={t('eval.form_description') || 'Description'}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <textarea
                        style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                        placeholder={t('eval.form_prompts') || 'One prompt per line'}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            style={{
                                ...btn,
                                background: 'rgba(59,130,246,0.2)',
                                borderColor: 'rgba(59,130,246,0.3)',
                            }}
                            onClick={handleCreate}
                        >
                            {t('eval.save') || 'Create'}
                        </button>
                        <button style={btn} onClick={() => setShowCreate(false)}>
                            {t('eval.cancel') || 'Cancel'}
                        </button>
                    </div>
                </div>
            )}

            {datasets.length === 0 ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: 40,
                        color: 'var(--slate-500)',
                        fontSize: '0.9rem',
                    }}
                >
                    <Database size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <div>{t('eval.empty') || 'No datasets yet. Create your first one!'}</div>
                </div>
            ) : (
                datasets.map((ds) => (
                    <div key={ds.id} style={{ ...card, marginBottom: 12 }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'start',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--slate-200)' }}>{ds.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: 2 }}>
                                    {ds.description || 'No description'} &middot;{' '}
                                    {ds.prompts.length} prompts &middot; {ds.runs.length} runs
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    style={{
                                        ...btn,
                                        background:
                                            runningId === ds.id
                                                ? 'rgba(16,185,129,0.2)'
                                                : 'rgba(16,185,129,0.1)',
                                        borderColor: 'rgba(16,185,129,0.3)',
                                    }}
                                    onClick={() => handleRun(ds.id)}
                                    disabled={runningId === ds.id}
                                >
                                    <Play size={14} /> {runningId === ds.id ? 'Running...' : 'Run'}
                                </button>
                                <button style={btn} onClick={() => handleDelete(ds.id)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        {ds.runs.length > 0 && (
                            <div
                                style={{
                                    marginTop: 12,
                                    display: 'flex',
                                    gap: 16,
                                    flexWrap: 'wrap',
                                }}
                            >
                                {ds.runs
                                    .slice(-3)
                                    .reverse()
                                    .map((run: EvalRun) => (
                                        <div
                                            key={run.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                fontSize: '0.8rem',
                                                color: 'var(--slate-400)',
                                            }}
                                        >
                                            <BarChart3 size={14} style={{ color: 'var(--accent)' }} />
                                            <span>
                                                {run.provider || 'auto'} &middot;{' '}
                                                {run.summary.passed}/{run.summary.total} passed
                                                &middot; {run.summary.avgScore.toFixed(2)} avg
                                            </span>
                                            {run.summary.avgScore >= 0.7 ? (
                                                <CheckCircle
                                                    size={14}
                                                    style={{ color: 'var(--success)' }}
                                                />
                                            ) : (
                                                <XCircle size={14} style={{ color: 'var(--error)' }} />
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default EvalDatasetPanel;
