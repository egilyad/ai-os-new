import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Clock,
    Play,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Search,
    RotateCcw,
    TerminalSquare,
    X,
    AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cognitiveService } from '../../kernel/instances';
import type { CognitiveTrace } from '../../kernel/instances';
import { eventBus, EVENTS } from '../../kernel/instances';
import ModuleInfo from '../ModuleInfo';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import { getStatusColor } from '../Common/status-vocabulary';
import {
    taskMetaItem,
    textWhiteWeight800Sm,
    errorBannerLg,
    dismissBtnRed,
} from '../../styles/common';

interface Task {
    id: string;
    label: string;
    type: 'autonomous' | 'scheduled' | 'on-demand';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
    progress: number;
    priority: 'low' | 'medium' | 'high';
    createdAt: number;
    agentId?: string;
    steps: { label: string; status: 'done' | 'active' | 'todo'; duration?: string }[];
}

const formatDuration = (ms?: number): string => {
    if (ms == null) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
};

const mapTraceToTask = (trace: CognitiveTrace): Task => {
    const doneSteps = trace.steps.filter((s) => s.status === 'done' || s.status === 'error').length;
    const totalSteps = trace.steps.length || 1;
    const progress =
        trace.status === 'completed' ? 100 : Math.round((doneSteps / totalSteps) * 100);

    let taskStatus: Task['status'] = 'running';
    if (trace.status === 'completed') taskStatus = 'completed';
    else if (trace.status === 'failed') taskStatus = 'failed';
    else if (trace.steps.length === 0) taskStatus = 'pending';

    return {
        id: trace.traceId,
        label: trace.input || trace.traceId,
        type: 'autonomous',
        status: taskStatus,
        progress,
        priority: 'medium',
        createdAt: trace.startTime,
        steps: trace.steps.map((s) => ({
            label: s.label || s.type,
            status: s.status === 'done' ? 'done' : s.status === 'active' ? 'active' : 'todo',
            duration: s.duration ? formatDuration(s.duration) : undefined,
        })),
    };
};

const TasksPanel: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { t } = useTranslation();
    const isMountedRef = useRef(true);

    const clearError = useAutoClearError(setError);

    const stats = useMemo(() => {
        const active = tasks.filter((t) => t.status === 'running').length;
        const pending = tasks.filter((t) => t.status === 'pending').length;
        const completed = tasks.filter((t) => t.status === 'completed').length;
        const failed = tasks.filter((t) => t.status === 'failed').length;
        return { active, pending, completed, failed };
    }, [tasks]);

    const updateTasksFromTraces = useCallback(() => {
        try {
            const traces = cognitiveService.getTraces();
            const mapped = traces.map(mapTraceToTask);
            if (isMountedRef.current) {
                setTasks(mapped);
                setError(null);
            }
        } catch (e) {
            console.warn('[TasksPanel] Failed to load task traces:', e);
            if (isMountedRef.current) {
                setError(t('tasks.error_load'));
                clearError();
            }
            eventBus.emit(EVENTS.NOTIFICATION, { message: t('tasks.error_load'), type: 'error' });
        }
        if (isMountedRef.current) setLoading(false);
    }, [clearError, t]);

    useEffect(() => {
        isMountedRef.current = true;
        updateTasksFromTraces();

        const unsub = eventBus.on(EVENTS.TRACE_UPDATED, () => {
            if (!isMountedRef.current) return;
            try {
                const traces = cognitiveService.getTraces();
                const mapped = traces.map(mapTraceToTask);
                setTasks(mapped);
                setError(null);
            } catch (e) {
                console.warn('[TasksPanel] Failed to update tasks from trace:', e);
                if (isMountedRef.current) {
                    setError(t('tasks.error_update'));
                    clearError();
                }
            }
        });

        return () => {
            isMountedRef.current = false;
            unsub();
        };
    }, [updateTasksFromTraces, clearError, t]);

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            const traces = cognitiveService.getTraces();
            const mapped = traces.map(mapTraceToTask);
            if (isMountedRef.current) {
                setTasks(mapped);
                setError(null);
            }
        } catch (e) {
            console.warn('[TasksPanel] Failed to refresh tasks:', e);
            if (isMountedRef.current) {
                setError(t('tasks.error_refresh'));
                clearError();
            }
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: t('tasks.error_refresh'),
                type: 'error',
            });
        } finally {
            if (isMountedRef.current) setIsRefreshing(false);
        }
    };

    const filteredTasks = tasks.filter((t) => {
        const matchesSearch =
            t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (filter === 'running') return t.status === 'running' || t.status === 'pending';
        if (filter === 'completed') return t.status === 'completed';
        if (filter === 'failed') return t.status === 'failed';
        return true;
    });

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--slate-400)',
                }}
                role="status"
                aria-label={t('tasks.loading_aria')}
            >
                <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                        <Loader2 size={20} aria-hidden="true" />
                    </motion.div>
                    {t('tasks.loading')}
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '1.5rem',
                }}
            >
                <div>
                    <h2
                        style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            margin: '0 0 0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            color: 'var(--slate-50)',
                        }}
                    >
                        <Play size={28} color="#3b82f6" aria-hidden="true" /> {t('tasks.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('tasks.subtitle')}
                    </p>
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '0.3rem',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                    role="tablist"
                    aria-label="Filter tasks by status"
                >
                    {[
                        { id: 'all', label: t('tasks.all') },
                        { id: 'running', label: t('tasks.active_pipeline') },
                        { id: 'completed', label: t('tasks.succeeded') },
                        { id: 'failed', label: t('tasks.failed') },
                    ].map((f) => (
                        <button
                            key={f.id}
                            role="tab"
                            aria-selected={filter === f.id}
                            aria-controls="tasks-panel"
                            onClick={() =>
                                setFilter(f.id as 'all' | 'running' | 'completed' | 'failed')
                            }
                            style={{
                                padding: '0.6rem 1.25rem',
                                borderRadius: 10,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background:
                                    filter === f.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                                color: filter === f.id ? '#3b82f6' : '#64748b',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={errorBannerLg}
                        role="alert"
                        aria-live="polite"
                    >
                        <AlertTriangle size={18} aria-hidden="true" /> {error}
                        <button
                            onClick={() => setError(null)}
                            style={dismissBtnRed}
                            aria-label={t('common.dismiss_error')}
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats & Search */}
            <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) 2fr', gap: '1rem' }}
            >
                {[
                    {
                        label: t('tasks.active_runners'),
                        value: stats.active,
                        color: 'var(--accent)',
                        icon: <Play size={16} />,
                    },
                    {
                        label: t('tasks.queued'),
                        value: stats.pending,
                        color: 'var(--warning)',
                        icon: <Clock size={16} />,
                    },
                    {
                        label: t('tasks.completed'),
                        value: stats.completed,
                        color: 'var(--success)',
                        icon: <CheckCircle2 size={16} />,
                    },
                    {
                        label: t('tasks.exceptions'),
                        value: stats.failed,
                        color: 'var(--error)',
                        icon: <AlertCircle size={16} />,
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        style={{
                            padding: '1rem 1.25rem',
                            borderRadius: 16,
                            position: 'relative',
                            overflow: 'hidden',
                            border: `1px solid ${stat.color}20`,
                            background: `linear-gradient(145deg, ${stat.color}05 0%, rgba(0,0,0,0.2) 100%)`,
                            backdropFilter: 'blur(10px)',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'var(--slate-400)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {stat.label}
                            </div>
                            <div style={{ color: stat.color }}>{stat.icon}</div>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                            {stat.value}
                        </div>
                    </div>
                ))}

                {/* Search */}
                <div
                    style={{
                        padding: '0 1.25rem',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(255,255,255,0.02)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                    }}
                    role="search"
                >
                    <Search size={18} color="#64748b" aria-hidden="true" />
                    <input
                        type="text"
                        placeholder={t('tasks.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            padding: '0.85rem 0',
                            fontSize: '0.9rem',
                            outline: 'none',
                        }}
                        aria-label={t('common.aria.search')}
                    />
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        style={{
                            padding: '0.6rem',
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-200)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        title="Refresh tasks"
                        aria-label={t('common.aria.refresh')}
                    >
                        {isRefreshing ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            >
                                <RotateCcw size={16} aria-hidden="true" />
                            </motion.div>
                        ) : (
                            <RotateCcw size={16} aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>

            {/* Task List */}
            <div
                style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}
                id="tasks-panel"
                role="tabpanel"
                aria-label="Task list"
            >
                {filteredTasks.length === 0 ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'var(--slate-500)',
                            gap: '1rem',
                            padding: '3rem',
                        }}
                    >
                        <div>
                            <TerminalSquare size={48} opacity={0.2} aria-hidden="true" />
                        </div>
                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                            {searchQuery ? t('tasks.empty_search') : t('tasks.empty_none')}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                            {searchQuery ? 'Try a different search term' : t('tasks.empty_hint')}
                        </p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredTasks.map((task, i) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                                style={{
                                    padding: '1.5rem',
                                    marginBottom: '1rem',
                                    borderRadius: 16,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderLeftWidth: 4,
                                    borderLeftColor: getStatusColor(task.status),
                                    background: 'rgba(255,255,255,0.02)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 280px',
                                    gap: '2rem',
                                    transition: 'all 0.2s',
                                }}
                                whileHover={{
                                    y: -2,
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                                    borderColor: 'rgba(59,130,246,0.4)',
                                }}
                                role="article"
                                aria-label={`Task: ${task.label}`}
                            >
                                {/* Left: Task Info & Progress */}
                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginBottom: '1rem',
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '0.75rem',
                                                    alignItems: 'center',
                                                    marginBottom: '0.5rem',
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        color: 'var(--slate-500)',
                                                        fontFamily: 'monospace',
                                                    }}
                                                >
                                                    ID: {task.id.split('-')[0]}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 700,
                                                        color: getStatusColor(task.status),
                                                        textTransform: 'uppercase',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                    }}
                                                >
                                                    {task.status === 'running' && (
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{
                                                                repeat: Infinity,
                                                                duration: 1,
                                                                ease: 'linear',
                                                            }}
                                                        >
                                                            <Loader2 size={10} aria-hidden="true" />
                                                        </motion.div>
                                                    )}
                                                    {task.status}
                                                </span>
                                            </div>
                                            <h3 style={textWhiteWeight800Sm}>{task.label}</h3>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            flexWrap: 'wrap',
                                            marginBottom: '1rem',
                                        }}
                                    >
                                        <span style={taskMetaItem}>
                                            <Clock size={14} aria-hidden="true" />{' '}
                                            {new Date(task.createdAt).toLocaleTimeString()}
                                        </span>
                                        <span style={taskMetaItem}>
                                            <Clock size={14} aria-hidden="true" /> Priority:{' '}
                                            <strong style={{ color: 'var(--slate-50)' }}>
                                                {task.priority}
                                            </strong>
                                        </span>
                                        <span style={taskMetaItem}>
                                            <Loader2 size={14} aria-hidden="true" /> Steps:{' '}
                                            <strong style={{ color: 'var(--slate-50)' }}>
                                                {task.steps.length}
                                            </strong>
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                        }}
                                    >
                                        <div
                                            style={{
                                                flex: 1,
                                                height: 4,
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                            }}
                                            role="progressbar"
                                            aria-valuenow={Math.round(task.progress)}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-label={`${Math.round(task.progress)}% complete`}
                                        >
                                            <motion.div
                                                animate={{ width: `${task.progress}%` }}
                                                transition={{ duration: 0.3 }}
                                                style={{
                                                    height: '100%',
                                                    background: getStatusColor(task.status),
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </div>
                                        <span
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: getStatusColor(task.status),
                                            }}
                                        >
                                            {Math.round(task.progress)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Pipeline Steps */}
                                <div>
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            color: 'var(--slate-500)',
                                            textTransform: 'uppercase',
                                            marginBottom: '0.75rem',
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        Execution Pipeline
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        {task.steps.map((step, idx) => (
                                            <div
                                                key={`${task.id}-${idx}`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 18,
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    {step.status === 'done' ? (
                                                        <CheckCircle2
                                                            size={14}
                                                            color="#10b981"
                                                            aria-hidden="true"
                                                        />
                                                    ) : step.status === 'active' ? (
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{
                                                                repeat: Infinity,
                                                                duration: 1,
                                                                ease: 'linear',
                                                            }}
                                                        >
                                                            <Loader2
                                                                size={14}
                                                                color="#3b82f6"
                                                                aria-hidden="true"
                                                            />
                                                        </motion.div>
                                                    ) : (
                                                        <div
                                                            style={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: '50%',
                                                                background: 'var(--slate-600)',
                                                            }}
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div
                                                        style={{
                                                            fontSize: '0.8rem',
                                                            fontWeight:
                                                                step.status === 'active'
                                                                    ? 700
                                                                    : 500,
                                                            color:
                                                                step.status === 'done'
                                                                    ? '#10b981'
                                                                    : step.status === 'active'
                                                                      ? '#3b82f6'
                                                                      : '#94a3b8',
                                                        }}
                                                    >
                                                        {step.label}
                                                    </div>
                                                    {step.duration && (
                                                        <div
                                                            style={{
                                                                fontSize: '0.65rem',
                                                                color: 'var(--slate-500)',
                                                            }}
                                                        >
                                                            {step.duration}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {task.steps.length === 0 && (
                                            <div
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--slate-500)',
                                                    fontStyle: 'italic',
                                                    padding: '0.5rem 0',
                                                }}
                                            >
                                                Pipeline initializing...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
                <ModuleInfo moduleKey="tasks" />
            </div>
        </div>
    );
};

export default TasksPanel;
