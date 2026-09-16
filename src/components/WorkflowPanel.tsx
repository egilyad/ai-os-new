import React, { useState, useEffect, useCallback } from 'react';
import { workflowService } from '../kernel/instances';
import { useTranslation } from '../i18n/useTranslation';
import {
    Play,
    X,
    Plus,
    Trash2,
    Loader2,
    AlertCircle,
    CheckCircle2,
    GitBranch,
    Star,
} from 'lucide-react';
import type { Workflow, WorkflowRun } from '../kernel/contracts/workflow-types';
import { BUILT_IN_WORKFLOWS } from '../kernel/contracts/workflow-types';

const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.08)',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--slate-200)',
    fontSize: '0.85rem',
    outline: 'none',
    fontFamily: 'monospace',
    resize: 'vertical',
};

const WorkflowPanel: React.FC = () => {
    const { t } = useTranslation();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [runs, setRuns] = useState<WorkflowRun[]>([]);
    const [selectedWf, setSelectedWf] = useState<Workflow | null>(null);
    const [input, setInput] = useState('');
    const [running, setRunning] = useState(false);
    const [currentRun, setCurrentRun] = useState<WorkflowRun | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');

    const load = useCallback(async () => {
        const [w, r] = await Promise.all([workflowService.getAll(), workflowService.getRuns()]);
        setWorkflows([...BUILT_IN_WORKFLOWS, ...w]);
        setRuns(r);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleRun = async () => {
        if (!selectedWf || running || !input.trim()) return;
        setRunning(true);
        try {
            await workflowService.runWorkflow(selectedWf.id, input.trim(), (progress) => {
                setCurrentRun({ ...progress });
            });
            setCurrentRun(null);
            load();
        } catch {
            setCurrentRun(null);
        } finally {
            setRunning(false);
        }
    };

    const handleCancel = () => {
        workflowService.cancelRun();
        setRunning(false);
    };

    const handleDelete = async (wf: Workflow) => {
        if (wf.isBuiltIn) return;
        await workflowService.remove(wf.id);
        load();
        if (selectedWf?.id === wf.id) setSelectedWf(null);
    };

    return (
        <div
            style={{
                padding: '2rem',
                maxWidth: 1200,
                margin: '0 auto',
                height: '100%',
                display: 'grid',
                gridTemplateColumns: '320px 1fr',
                gap: 16,
                overflow: 'hidden',
            }}
        >
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <h2
                        style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-200)' }}
                    >
                        {t('workflows.title')}
                    </h2>
                    <button
                        onClick={() => setShowCreate(true)}
                        style={{
                            padding: 6,
                            borderRadius: 8,
                            background: 'rgba(16,185,129,0.15)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            color: '#34d399',
                            cursor: 'pointer',
                            display: 'flex',
                        }}
                    >
                        <Plus size={16} />
                    </button>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                    {t('workflows.subtitle')}
                </p>
                {workflows.map((wf) => (
                    <div
                        key={wf.id}
                        onClick={() => setSelectedWf(wf)}
                        style={{
                            ...card,
                            cursor: 'pointer',
                            borderColor:
                                selectedWf?.id === wf.id
                                    ? 'rgba(59,130,246,0.4)'
                                    : 'rgba(255,255,255,0.08)',
                            background:
                                selectedWf?.id === wf.id
                                    ? 'rgba(59,130,246,0.08)'
                                    : 'rgba(255,255,255,0.04)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <GitBranch size={14} style={{ color: 'var(--accent)' }} />
                                <span
                                    style={{
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        color: 'var(--slate-200)',
                                    }}
                                >
                                    {wf.title}
                                </span>
                                {wf.isBuiltIn && <Star size={10} style={{ color: 'var(--warning)' }} />}
                            </div>
                            {!wf.isBuiltIn && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(wf);
                                    }}
                                    style={{
                                        padding: 2,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--slate-500)',
                                    }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginTop: 4 }}>
                            {wf.description}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--slate-600)', marginTop: 4 }}>
                            {wf.steps.length} steps · used {wf.usageCount} times
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!selectedWf && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--slate-500)' }}>
                        <GitBranch size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                        <p>{t('workflows.select_workflow')}</p>
                    </div>
                )}

                {selectedWf && (
                    <>
                        <div style={card}>
                            <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--slate-200)' }}>
                                {selectedWf.title}
                            </h3>
                            <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                                {selectedWf.description}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selectedWf.steps.map((step, i) => (
                                    <div
                                        key={step.id}
                                        style={{
                                            display: 'flex',
                                            gap: 8,
                                            alignItems: 'flex-start',
                                            padding: '8px 12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 12,
                                                background: 'rgba(59,130,246,0.15)',
                                                color: '#60a5fa',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {i + 1}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: '0.85rem',
                                                    color: 'var(--slate-200)',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {step.label}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '0.72rem',
                                                    color: 'var(--slate-500)',
                                                    marginTop: 2,
                                                }}
                                            >
                                                {step.provider}/{step.model}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '0.7rem',
                                                    color: 'var(--slate-600)',
                                                    marginTop: 4,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {step.promptTemplate}
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                {t('workflows.input_label')}
                            </h3>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={t('workflows.input_placeholder')}
                                rows={3}
                                style={inputStyle}
                            />
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button
                                    onClick={handleRun}
                                    disabled={running || !input.trim()}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '8px 20px',
                                        borderRadius: 8,
                                        background: running
                                            ? 'rgba(255,255,255,0.05)'
                                            : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        border: 'none',
                                        color: running || !input.trim() ? '#64748b' : '#fff',
                                        cursor:
                                            running || !input.trim() ? 'not-allowed' : 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {running ? <Loader2 size={16} /> : <Play size={16} />}
                                    {running ? t('workflows.running') : t('workflows.run')}
                                </button>
                                {running && (
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
                                        <X size={16} /> {t('workflows.cancel')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {currentRun && (
                            <div style={card}>
                                <h3
                                    style={{
                                        margin: '0 0 8px',
                                        fontSize: '0.9rem',
                                        color: 'var(--slate-400)',
                                        fontWeight: 600,
                                    }}
                                >
                                    {t('workflows.progress')}
                                </h3>
                                <div
                                    style={{
                                        height: 4,
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        marginBottom: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${(currentRun.stepResults.length / selectedWf.steps.length) * 100}%`,
                                            background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                                            borderRadius: 2,
                                            transition: 'width 0.3s',
                                        }}
                                    />
                                </div>
                                {currentRun.stepResults.map((sr) => (
                                    <div
                                        key={sr.stepId}
                                        style={{
                                            padding: '8px 12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: 8,
                                            marginBottom: 4,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            {sr.status === 'success' ? (
                                                <CheckCircle2
                                                    size={14}
                                                    style={{ color: 'var(--success)' }}
                                                />
                                            ) : (
                                                <AlertCircle
                                                    size={14}
                                                    style={{ color: 'var(--error)' }}
                                                />
                                            )}
                                            <span
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--slate-200)',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {sr.label}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.7rem',
                                                    color: 'var(--slate-500)',
                                                    marginLeft: 'auto',
                                                }}
                                            >
                                                {sr.latency}ms · {sr.tokens}tokens
                                            </span>
                                        </div>
                                        {sr.error && (
                                            <div
                                                style={{
                                                    fontSize: '0.7rem',
                                                    color: '#f87171',
                                                    marginTop: 4,
                                                }}
                                            >
                                                {sr.error}
                                            </div>
                                        )}
                                        {sr.output && (
                                            <div
                                                style={{
                                                    fontSize: '0.7rem',
                                                    color: 'var(--slate-500)',
                                                    marginTop: 4,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {sr.output}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {runs.length > 0 && !currentRun && (
                            <div style={card}>
                                <h3
                                    style={{
                                        margin: '0 0 8px',
                                        fontSize: '0.9rem',
                                        color: 'var(--slate-400)',
                                        fontWeight: 600,
                                    }}
                                >
                                    {t('workflows.history')}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {runs
                                        .filter((r) => r.workflowId === selectedWf.id)
                                        .slice(0, 5)
                                        .map((r) => (
                                            <div
                                                key={r.id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '6px 8px',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    borderRadius: 6,
                                                    fontSize: '0.78rem',
                                                    color: 'var(--slate-500)',
                                                }}
                                            >
                                                <span>
                                                    {r.status === 'completed' && '✅'}
                                                    {r.status === 'failed' && '❌'}
                                                    {r.status === 'cancelled' && '🚫'}
                                                    {r.status === 'running' && '⏳'}
                                                    {r.workflowTitle}
                                                </span>
                                                <span>
                                                    {
                                                        r.stepResults.filter(
                                                            (s) => s.status === 'success',
                                                        ).length
                                                    }
                                                    /{r.stepResults.length} steps ·{' '}
                                                    {new Date(r.startedAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showCreate && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <div
                        style={{
                            width: 480,
                            maxWidth: '90vw',
                            background: 'var(--slate-800)',
                            borderRadius: 16,
                            padding: 24,
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 16,
                            }}
                        >
                            <h3 style={{ margin: 0, color: 'var(--slate-200)', fontSize: '1.1rem' }}>
                                {t('workflows.create')}
                            </h3>
                            <button
                                onClick={() => setShowCreate(false)}
                                style={{
                                    padding: 4,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--slate-500)',
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginBottom: 16 }}>
                            {t('workflows.create_desc')}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder={t('workflows.form_title')}
                                style={inputStyle}
                            />
                            <textarea
                                value={formDesc}
                                onChange={(e) => setFormDesc(e.target.value)}
                                placeholder={t('workflows.form_description')}
                                rows={3}
                                style={inputStyle}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    justifyContent: 'flex-end',
                                    marginTop: 8,
                                }}
                            >
                                <button
                                    onClick={() => setShowCreate(false)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: 8,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--slate-400)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    {t('workflows.cancel')}
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!formTitle.trim() || !formDesc.trim()) return;
                                        const steps: Array<
                                            Omit<
                                                import('../kernel/contracts/workflow-types').WorkflowStep,
                                                'id'
                                            >
                                        > = [
                                            {
                                                label: 'Step 1',
                                                promptTemplate: '{{INPUT}}',
                                                provider: 'groq',
                                                model: 'llama-3.1-8b-instant',
                                                temperature: 0.7,
                                                inputMapping: { INPUT: 'input' },
                                            },
                                            {
                                                label: 'Step 2',
                                                promptTemplate: 'Refine: {{STEP_0_OUTPUT}}',
                                                provider: 'groq',
                                                model: 'llama-3.1-8b-instant',
                                                temperature: 0.5,
                                                inputMapping: { STEP_0_OUTPUT: 'steps.0.output' },
                                            },
                                        ];
                                        await workflowService.create({
                                            title: formTitle.trim(),
                                            description: formDesc.trim(),
                                            steps,
                                        });
                                        setShowCreate(false);
                                        setFormTitle('');
                                        setFormDesc('');
                                        load();
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: 8,
                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        border: 'none',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        opacity: !formTitle.trim() || !formDesc.trim() ? 0.5 : 1,
                                    }}
                                >
                                    {t('workflows.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowPanel;
