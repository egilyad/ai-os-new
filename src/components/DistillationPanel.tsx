import React, { useEffect, useState } from 'react';
import { useVisibilityInterval } from '../utils/visibility-interval';
import {
    FlaskConical,
    Play,
    X,
    Trash2,
    Plus,
    Loader,
    CheckCircle,
    AlertCircle,
    Clock,
    BarChart3,
} from 'lucide-react';
import PanelLoader from './PanelLoader';
import { DemoGate } from './Common/DemoGate';
import { distillationService } from '../kernel/instances';
import type {
    DistillationJob,
    DistillationMethod,
    DistillationConfig,
} from '../kernel/contracts/model-distillation';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
    queued: { color: 'var(--slate-500)', icon: <Clock size={14} /> },
    preparing: { color: 'var(--warning)', icon: <Loader size={14} /> },
    distilling: { color: 'var(--purple)', icon: <Loader size={14} /> },
    validating: { color: 'var(--accent)', icon: <BarChart3 size={14} /> },
    completed: { color: 'var(--success)', icon: <CheckCircle size={14} /> },
    failed: { color: 'var(--error)', icon: <AlertCircle size={14} /> },
    cancelled: { color: 'var(--slate-500)', icon: <X size={14} /> },
};

const DISTILLATION_PANEL: React.FC = () => {
    const [jobs, setJobs] = useState<DistillationJob[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [jobName, setJobName] = useState('');
    const [teacher, setTeacher] = useState('');
    const [student, setStudent] = useState('');
    const [method, setMethod] = useState<DistillationMethod>('knowledge_distillation');
    const [config, setConfig] = useState<DistillationConfig>({
        temperature: 4,
        alpha: 0.5,
        maxSteps: 10000,
        targetSize: '3B',
    });
    const [expandedJob, setExpandedJob] = useState<string | null>(null);

    const refresh = () => setJobs(distillationService.getJobs());
    useEffect(() => {
        refresh();
    }, []);
    useVisibilityInterval(refresh, 3000);

    const handleMethodChange = (m: DistillationMethod) => {
        setMethod(m);
        setConfig(distillationService.getDefaultConfig(m));
    };

    const handleCreate = () => {
        if (!jobName.trim() || !teacher || !student) return;
        distillationService.createJob(jobName.trim(), teacher, student, method, config);
        setJobName('');
        setShowCreate(false);
        refresh();
    };

    const teachers = distillationService.getTeacherModels();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const students = (distillationService as any).getStudentArchitectures();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FlaskConical size={20} color="#8b5cf6" />
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Model Distillation</span>
                <div style={{ flex: 1 }} />
            </div>

            <div>
                <button
                    onClick={() => setShowCreate(true)}
                    style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: 8,
                        border: '1px dashed rgba(139,92,246,0.3)',
                        background: 'transparent',
                        color: 'var(--purple)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <Plus size={14} /> New Distillation
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
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}
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
                                placeholder="Distillation job"
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
                                Method
                            </div>
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                {(
                                    [
                                        'knowledge_distillation',
                                        'pruning',
                                        'quantization',
                                    ] as DistillationMethod[]
                                ).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => handleMethodChange(m)}
                                        style={{
                                            flex: 1,
                                            padding: '0.3rem 0.4rem',
                                            borderRadius: 6,
                                            border: `1px solid ${method === m ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                                            background:
                                                method === m
                                                    ? 'rgba(139,92,246,0.15)'
                                                    : 'transparent',
                                            color: method === m ? '#a855f7' : '#94a3b8',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.65rem',
                                        }}
                                    >
                                        {m === 'knowledge_distillation'
                                            ? 'KD'
                                            : m === 'pruning'
                                              ? 'PRUNE'
                                              : 'QUANT'}
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
                                Teacher Model
                            </div>
                            <select
                                value={teacher}
                                onChange={(e) => setTeacher(e.target.value)}
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
                                <option value="">Select teacher...</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.params})
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
                                Student Architecture
                            </div>
                            <select
                                value={student}
                                onChange={(e) => setStudent(e.target.value)}
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
                                <option value="">Select student...</option>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {students.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.params})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <div
                            style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginBottom: '0.3rem' }}
                        >
                            Config
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '0.5rem',
                            }}
                        >
                            {[
                                { key: 'temperature', label: 'Temperature', step: '0.1' },
                                { key: 'alpha', label: 'Alpha', step: '0.1' },
                                { key: 'maxSteps', label: 'Max Steps', step: '100' },
                                { key: 'targetSize', label: 'Target Size', step: '1' },
                            ].map((f) => (
                                <div key={f.key}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                                        {f.label}
                                    </div>
                                    <input
                                        type="number"
                                        step={f.step}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        value={(config as any)[f.key]}
                                        onChange={(e) =>
                                            setConfig({
                                                ...config,
                                                [f.key]: parseFloat(e.target.value) || 0,
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
                                background: 'rgba(139,92,246,0.2)',
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
                            onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
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
                                    {job.teacherModel} → {job.studentModel} · Step {job.currentStep}
                                    /{job.config.maxSteps}
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
                                            job.status === 'completed' ? '#22c55e' : '#8b5cf6',
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
                            {job.status === 'queued' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        distillationService.startJob(job.id);
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
                            {(job.status === 'distilling' || job.status === 'validating') && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        distillationService.cancelJob(job.id);
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
                                    distillationService.removeJob(job.id);
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
                                    gridTemplateColumns: '1fr 1fr 1fr',
                                    gap: '0.5rem',
                                    fontSize: '0.75rem',
                                }}
                            >
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Teacher:</span>{' '}
                                    {job.teacherModel}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Student:</span>{' '}
                                    {job.studentModel}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Size Reduction:</span>{' '}
                                    {job.sizeReduction ? `${job.sizeReduction.toFixed(1)}x` : '—'}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Speedup:</span>{' '}
                                    {job.speedup ? `${job.speedup.toFixed(1)}x` : '—'}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Teacher Score:</span>{' '}
                                    {job.teacherScore
                                        ? (job.teacherScore * 100).toFixed(1) + '%'
                                        : '—'}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Student Score:</span>{' '}
                                    {job.studentScore
                                        ? (job.studentScore * 100).toFixed(1) + '%'
                                        : '—'}
                                </div>
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
                        No distillation jobs yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default function DistillationPanelWrapper() {
    return (
        <PanelLoader title="Model Distillation">
            <DemoGate title="Model Distillation">
                <DISTILLATION_PANEL />
            </DemoGate>
        </PanelLoader>
    );
}
