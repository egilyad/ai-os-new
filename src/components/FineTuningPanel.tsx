import React, { useEffect, useState } from 'react';
import {
    Brain,
    Play,
    X,
    Trash2,
    Plus,
    Loader,
    CheckCircle,
    AlertCircle,
    Clock,
    BarChart3,
    Database,
} from 'lucide-react';
import PanelLoader from './PanelLoader';
import { DemoGate } from './Common/DemoGate';
import { usePolling } from './Common/usePolling';
import { fineTuningService } from '../kernel/instances';
import type {
    FineTuningJob,
    FineTuningMethod,
    FineTuningHyperparams,
    FineTuningDataset,
} from '../kernel/contracts/fine-tuning';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
    queued: { color: 'var(--slate-500)', icon: <Clock size={14} /> },
    preparing: { color: 'var(--warning)', icon: <Loader size={14} /> },
    training: { color: 'var(--accent)', icon: <Loader size={14} className="animate-spin" /> },
    evaluating: { color: 'var(--purple)', icon: <BarChart3 size={14} /> },
    completed: { color: 'var(--success)', icon: <CheckCircle size={14} /> },
    failed: { color: 'var(--error)', icon: <AlertCircle size={14} /> },
    cancelled: { color: 'var(--slate-500)', icon: <X size={14} /> },
};

const METHOD_COLORS: Record<FineTuningMethod, string> = {
    full: '#3b82f6',
    lora: '#a855f7',
    qlora: '#f59e0b',
    adapter: '#10b981',
};

const FineTuningPanel: React.FC = () => {
    const [tab, setTab] = useState<'jobs' | 'datasets'>('jobs');
    const [jobs, setJobs] = useState<FineTuningJob[]>([]);
    const [datasets, setDatasets] = useState<FineTuningDataset[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [jobName, setJobName] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<FineTuningMethod>('lora');
    const [selectedDataset, setSelectedDataset] = useState('');
    const [hyperparams, setHyperparams] = useState<FineTuningHyperparams>(
        fineTuningService.getDefaultHyperparams('lora'),
    );
    const [showDatasetForm, setShowDatasetForm] = useState(false);
    const [dsName, setDsName] = useState('');
    const [dsDesc, setDsDesc] = useState('');
    const [dsSamples, setDsSamples] = useState('1000');
    const [expandedJob, setExpandedJob] = useState<string | null>(null);

    const refresh = () => {
        setJobs(fineTuningService.getJobs());
        setDatasets(fineTuningService.getDatasets());
    };

    useEffect(() => {
        refresh();
    }, []);

    usePolling(refresh, 3000);

    const handleMethodChange = (method: FineTuningMethod) => {
        setSelectedMethod(method);
        setHyperparams(fineTuningService.getDefaultHyperparams(method));
    };

    const handleCreate = () => {
        if (!jobName.trim() || !selectedModel || !selectedDataset) return;
        fineTuningService.createJob(
            jobName.trim(),
            selectedModel,
            selectedMethod,
            selectedDataset,
            hyperparams,
        );
        setJobName('');
        setShowCreate(false);
        refresh();
    };

    const handleAddDataset = () => {
        if (!dsName.trim()) return;
        fineTuningService.addDataset({
            name: dsName.trim(),
            description: dsDesc.trim(),
            sampleCount: parseInt(dsSamples) || 1000,
            category: 'custom',
            format: 'jsonl',
        });
        setDsName('');
        setDsDesc('');
        setDsSamples('1000');
        setShowDatasetForm(false);
        refresh();
    };

    const models = fineTuningService.getAvailableBaseModels();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Brain size={20} color="#a855f7" />
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Fine-Tuning Studio</span>
                <div style={{ flex: 1 }} />
                <button
                    onClick={() => setTab('jobs')}
                    style={{
                        padding: '0.3rem 0.8rem',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: tab === 'jobs' ? 'rgba(168,85,247,0.15)' : 'transparent',
                        color: tab === 'jobs' ? '#a855f7' : '#64748b',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                    }}
                >
                    <BarChart3 size={14} /> Jobs
                </button>
                <button
                    onClick={() => setTab('datasets')}
                    style={{
                        padding: '0.3rem 0.8rem',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: tab === 'datasets' ? 'rgba(168,85,247,0.15)' : 'transparent',
                        color: tab === 'datasets' ? '#a855f7' : '#64748b',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                    }}
                >
                    <Database size={14} /> Datasets
                </button>
            </div>

            {tab === 'jobs' && (
                <>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setShowCreate(true)}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: 8,
                                border: '1px dashed rgba(168,85,247,0.3)',
                                background: 'transparent',
                                color: '#a855f7',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Plus size={14} /> New Fine-Tuning Job
                        </button>
                    </div>

                    {showCreate && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                padding: '1rem',
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.75rem',
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-500)',
                                            marginBottom: '0.3rem',
                                        }}
                                    >
                                        Job Name
                                    </div>
                                    <input
                                        value={jobName}
                                        onChange={(e) => setJobName(e.target.value)}
                                        placeholder="My fine-tune job"
                                        style={{
                                            width: '100%',
                                            padding: '0.4rem 0.6rem',
                                            borderRadius: 6,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(0,0,0,0.3)',
                                            color: 'var(--slate-200)',
                                            fontSize: '0.8rem',
                                        }}
                                    />
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-500)',
                                            marginBottom: '0.3rem',
                                        }}
                                    >
                                        Base Model
                                    </div>
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.4rem 0.6rem',
                                            borderRadius: 6,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(0,0,0,0.3)',
                                            color: 'var(--slate-200)',
                                            fontSize: '0.8rem',
                                        }}
                                    >
                                        <option value="">Select model...</option>
                                        {models.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.provider})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-500)',
                                            marginBottom: '0.3rem',
                                        }}
                                    >
                                        Method
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        {(
                                            [
                                                'full',
                                                'lora',
                                                'qlora',
                                                'adapter',
                                            ] as FineTuningMethod[]
                                        ).map((m: FineTuningMethod) => (
                                            <button
                                                key={m}
                                                onClick={() => handleMethodChange(m)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.3rem 0.4rem',
                                                    borderRadius: 6,
                                                    border: `1px solid ${selectedMethod === m ? METHOD_COLORS[m] : 'rgba(255,255,255,0.1)'}`,
                                                    background:
                                                        selectedMethod === m
                                                            ? `${METHOD_COLORS[m]}20`
                                                            : 'transparent',
                                                    color:
                                                        selectedMethod === m
                                                            ? METHOD_COLORS[m]
                                                            : '#94a3b8',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    fontSize: '0.7rem',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-500)',
                                            marginBottom: '0.3rem',
                                        }}
                                    >
                                        Dataset
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <select
                                            value={selectedDataset}
                                            onChange={(e) => setSelectedDataset(e.target.value)}
                                            style={{
                                                flex: 1,
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: 6,
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(0,0,0,0.3)',
                                                color: 'var(--slate-200)',
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            <option value="">Select dataset...</option>
                                            {datasets.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name} ({d.sampleCount} samples)
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => setShowDatasetForm(true)}
                                            style={{
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: 6,
                                                border: '1px dashed rgba(16,185,129,0.3)',
                                                background: 'transparent',
                                                color: 'var(--success)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-500)',
                                        marginBottom: '0.3rem',
                                    }}
                                >
                                    Hyperparameters
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: '0.5rem',
                                    }}
                                >
                                    {[
                                        {
                                            key: 'learningRate',
                                            label: 'Learning Rate',
                                            type: 'number',
                                            step: '1e-6',
                                        },
                                        {
                                            key: 'numEpochs',
                                            label: 'Epochs',
                                            type: 'number',
                                            step: '1',
                                        },
                                        {
                                            key: 'batchSize',
                                            label: 'Batch Size',
                                            type: 'number',
                                            step: '1',
                                        },
                                        {
                                            key: 'warmupSteps',
                                            label: 'Warmup Steps',
                                            type: 'number',
                                            step: '1',
                                        },
                                        {
                                            key: 'weightDecay',
                                            label: 'Weight Decay',
                                            type: 'number',
                                            step: '0.001',
                                        },
                                    ].map((field) => (
                                        <div key={field.key}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                                                {field.label}
                                            </div>
                                            <input
                                                type={field.type}
                                                step={field.step}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                value={(hyperparams as any)[field.key]}
                                                onChange={(e) =>
                                                    setHyperparams({
                                                        ...hyperparams,
                                                        [field.key]:
                                                            parseFloat(e.target.value) || 0,
                                                    })
                                                }
                                                style={{
                                                    width: '100%',
                                                    padding: '0.3rem 0.4rem',
                                                    borderRadius: 4,
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    background: 'rgba(0,0,0,0.3)',
                                                    color: 'var(--slate-200)',
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={handleCreate}
                                    style={{
                                        padding: '0.4rem 1.2rem',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: 'rgba(168,85,247,0.2)',
                                        color: '#a855f7',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    Create Job
                                </button>
                                <button
                                    onClick={() => setShowCreate(false)}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: 'var(--error-tint)',
                                        color: 'var(--error)',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                style={{
                                    borderRadius: 10,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    background: 'rgba(255,255,255,0.02)',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    onClick={() =>
                                        setExpandedJob(expandedJob === job.id ? null : job.id)
                                    }
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.6rem 0.75rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {STATUS_CONFIG[job.status]?.icon}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                            {job.name}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                                            {job.baseModel} · {job.method.toUpperCase()} · Epoch{' '}
                                            {job.currentEpoch}/{job.totalEpochs}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: 120,
                                            height: 6,
                                            borderRadius: 3,
                                            background: 'rgba(255,255,255,0.05)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: '100%',
                                                borderRadius: 3,
                                                width: `${job.progress}%`,
                                                background:
                                                    job.status === 'completed'
                                                        ? '#22c55e'
                                                        : job.status === 'failed'
                                                          ? '#ef4444'
                                                          : '#3b82f6',
                                                transition: 'width 0.5s',
                                            }}
                                        />
                                    </div>
                                    <span
                                        style={{
                                            fontSize: '0.7rem',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: 4,
                                            background: `${STATUS_CONFIG[job.status]?.color}20`,
                                            color: STATUS_CONFIG[job.status]?.color,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {job.status}
                                    </span>
                                    {job.loss !== null && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                            loss: {job.loss.toFixed(4)}
                                        </span>
                                    )}
                                    {(job.status === 'queued' || job.status === 'training') && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fineTuningService.startJob(job.id);
                                            }}
                                            style={{
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: 6,
                                                border: 'none',
                                                background: 'rgba(59,130,246,0.15)',
                                                color: '#60a5fa',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <Play size={12} />
                                        </button>
                                    )}
                                    {job.status === 'training' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fineTuningService.cancelJob(job.id);
                                            }}
                                            style={{
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: 6,
                                                border: 'none',
                                                background: 'var(--error-tint)',
                                                color: 'var(--error)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fineTuningService.removeJob(job.id);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--error)',
                                            cursor: 'pointer',
                                            padding: 2,
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                {expandedJob === job.id && (
                                    <div
                                        style={{
                                            padding: '0.75rem',
                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '0.5rem',
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        <div>
                                            <span style={{ color: 'var(--slate-500)' }}>Created:</span>{' '}
                                            {new Date(job.createdAt).toLocaleString()}
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--slate-500)' }}>Started:</span>{' '}
                                            {job.startedAt
                                                ? new Date(job.startedAt).toLocaleString()
                                                : '—'}
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--slate-500)' }}>Completed:</span>{' '}
                                            {job.completedAt
                                                ? new Date(job.completedAt).toLocaleString()
                                                : '—'}
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--slate-500)' }}>Eval Score:</span>{' '}
                                            {job.evalScore !== null
                                                ? (job.evalScore * 100).toFixed(1) + '%'
                                                : '—'}
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--slate-500)' }}>Output Model:</span>{' '}
                                            {job.outputModelId || '—'}
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--slate-500)' }}>Dataset:</span>{' '}
                                            {job.datasetId.slice(-8)}
                                        </div>
                                        {job.error && (
                                            <div style={{ gridColumn: '1 / -1', color: 'var(--error)' }}>
                                                Error: {job.error}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {jobs.length === 0 && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '2rem',
                                    color: 'var(--slate-500)',
                                    fontSize: '0.8rem',
                                }}
                            >
                                No fine-tuning jobs yet.
                            </div>
                        )}
                    </div>
                </>
            )}

            {tab === 'datasets' && (
                <>
                    <div>
                        <button
                            onClick={() => setShowDatasetForm(true)}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: 8,
                                border: '1px dashed rgba(16,185,129,0.3)',
                                background: 'transparent',
                                color: 'var(--success)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Plus size={14} /> Add Dataset
                        </button>
                    </div>
                    {showDatasetForm && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                padding: '0.75rem',
                                borderRadius: 10,
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <input
                                value={dsName}
                                onChange={(e) => setDsName(e.target.value)}
                                placeholder="Dataset name"
                                style={{
                                    padding: '0.4rem 0.6rem',
                                    borderRadius: 6,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.8rem',
                                }}
                            />
                            <input
                                value={dsDesc}
                                onChange={(e) => setDsDesc(e.target.value)}
                                placeholder="Description"
                                style={{
                                    padding: '0.4rem 0.6rem',
                                    borderRadius: 6,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.8rem',
                                }}
                            />
                            <input
                                type="number"
                                value={dsSamples}
                                onChange={(e) => setDsSamples(e.target.value)}
                                placeholder="Sample count"
                                style={{
                                    padding: '0.4rem 0.6rem',
                                    borderRadius: 6,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.8rem',
                                }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={handleAddDataset}
                                    style={{
                                        padding: '0.3rem 1rem',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: 'rgba(16,185,129,0.15)',
                                        color: 'var(--success)',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                    }}
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => setShowDatasetForm(false)}
                                    style={{
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: 'var(--error-tint)',
                                        color: 'var(--error)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {datasets.map((d) => (
                            <div
                                key={d.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.02)',
                                }}
                            >
                                <Database size={16} color="#10b981" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                        {d.name}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                                        {d.sampleCount.toLocaleString()} samples · {d.format} ·{' '}
                                        {d.category}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        fineTuningService.removeDataset(d.id);
                                        refresh();
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--error)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {datasets.length === 0 && (
                            <div
                                style={{
                                    padding: '1rem',
                                    textAlign: 'center',
                                    color: 'var(--slate-500)',
                                    fontSize: '0.8rem',
                                }}
                            >
                                No datasets yet. Add one to start fine-tuning.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default function FineTuningPanelWrapper() {
    return (
        <PanelLoader title="Fine-Tuning Studio">
            <DemoGate title="Fine-Tuning Studio">
                <FineTuningPanel />
            </DemoGate>
        </PanelLoader>
    );
}
