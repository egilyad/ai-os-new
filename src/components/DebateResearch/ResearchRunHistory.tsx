import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../../hooks/useConfirm';
import { ResearchRunService, type ResearchRun } from '../../kernel/services/research-run-service';

interface ResearchRunHistoryProps {
    module: string;
    runService: ResearchRunService;
}

const statusColor = (status: ResearchRun['status']) => {
    switch (status) {
        case 'completed':
            return '#10b981';
        case 'failed':
            return '#ef4444';
        case 'running':
            return '#f59e0b';
        default:
            return '#64748b';
    }
};

const statusIcon = (status: ResearchRun['status']) => {
    switch (status) {
        case 'completed':
            return <CheckCircle2 size={14} />;
        case 'failed':
            return <XCircle size={14} />;
        case 'running':
            return <Clock size={14} />;
        default:
            return <Clock size={14} />;
    }
};

const ResearchRunHistory: React.FC<ResearchRunHistoryProps> = ({ module, runService }) => {
    const { confirm, ConfirmDialog } = useConfirm();
    const [runs, setRuns] = useState<ResearchRun[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        setRuns(runService.getRunsByModule(module));
    }, [module, runService]);

    const handleDelete = async (id: string) => {
        if (
            !(await confirm({
                title: 'Delete Run',
                message: 'Delete this research run?',
                variant: 'danger',
            }))
        )
            return;
        runService.deleteRun(id);
        setRuns(runService.getRunsByModule(module));
    };

    if (runs.length === 0) {
        return (
            <div
                style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: 'var(--slate-500)',
                    fontSize: '0.85rem',
                }}
            >
                No run history yet. Run an analysis to see history here.
                <ConfirmDialog />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div
                style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--slate-400)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem',
                }}
            >
                Run History ({runs.length})
            </div>
            <AnimatePresence>
                {runs.map((run) => (
                    <motion.div
                        key={run.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '0.6rem 0.75rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                            }}
                        >
                            <span style={{ color: statusColor(run.status) }}>
                                {statusIcon(run.status)}
                            </span>
                            <span style={{ color: 'var(--slate-200)', fontWeight: 600, flex: 1 }}>
                                {run.module}
                                {run.summary && (
                                    <span style={{ color: 'var(--slate-500)', fontWeight: 400 }}>
                                        {' '}
                                        — {run.summary.slice(0, 60)}
                                    </span>
                                )}
                            </span>
                            <span style={{ color: 'var(--slate-500)', fontSize: '0.65rem' }}>
                                {new Date(run.startedAt).toLocaleString()}
                            </span>
                            {expandedId === run.id ? (
                                <ChevronUp size={14} color="#64748b" />
                            ) : (
                                <ChevronDown size={14} color="#64748b" />
                            )}
                        </div>
                        <AnimatePresence>
                            {expandedId === run.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{
                                        padding: '0 0.75rem 0.75rem',
                                        borderTop: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-400)',
                                            marginTop: '0.5rem',
                                        }}
                                    >
                                        <div>
                                            <strong>Status:</strong>{' '}
                                            <span style={{ color: statusColor(run.status) }}>
                                                {run.status}
                                            </span>
                                        </div>
                                        {run.completedAt && (
                                            <div>
                                                <strong>Duration:</strong>{' '}
                                                {((run.completedAt - run.startedAt) / 1000).toFixed(
                                                    1,
                                                )}
                                                s
                                            </div>
                                        )}
                                        {run.error && (
                                            <div style={{ color: 'var(--error)' }}>
                                                <strong>Error:</strong> {run.error}
                                            </div>
                                        )}
                                        {run.findings && run.findings.length > 0 && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <strong>Findings:</strong>
                                                <ul
                                                    style={{
                                                        margin: '0.25rem 0 0',
                                                        paddingLeft: '1rem',
                                                    }}
                                                >
                                                    {run.findings.map((f, _i) => (
                                                        <li key={f}>{f}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {run.summary && (
                                            <div style={{ marginTop: '0.25rem' }}>
                                                <strong>Summary:</strong> {run.summary}
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.5rem',
                                            marginTop: '0.5rem',
                                        }}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(run.id);
                                            }}
                                            style={{
                                                fontSize: '0.65rem',
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: 6,
                                                background: 'var(--error-tint)',
                                                border: '1px solid rgba(239,68,68,0.2)',
                                                color: 'var(--error)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <Trash2 size={10} /> Delete
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </AnimatePresence>
            <ConfirmDialog />
        </div>
    );
};

export default ResearchRunHistory;
