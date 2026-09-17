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
import { agemsTaskService } from '../../kernel/services/agems-task-service';
import { KANBAN_COLUMNS } from '../../kernel/types/agems-task';
import type { AgemsTask, AgemsTaskStatus, CronSchedule } from '../../kernel/types/agems-task';
import { getPresets, formatCronPreview } from '../../kernel/services/cron-builder-service';
import TaskDetailModal from './TaskDetailModal';
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
    const [agemsTasks, setAgemsTasks] = useState<AgemsTask[]>([]);
    const [kanbanView, setKanbanView] = useState<'board' | 'list'>('board');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskCron, setNewTaskCron] = useState<CronSchedule | undefined>(undefined);
    const [showCronPicker, setShowCronPicker] = useState(false);
    const [selectedTask, setSelectedTask] = useState<AgemsTask | null>(null);

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

    // AGEMS 2.1: load agemsTasks
    useEffect(() => {
        void agemsTaskService.list().then(setAgemsTasks).catch(() => {});
    }, []);

    const handleCreateAgemsTask = async () => {
        if (!newTaskTitle.trim()) return;
        const task = await agemsTaskService.create({
            title: newTaskTitle.trim(),
            type: newTaskCron ? 'RECURRING' : 'ONE_TIME',
            status: 'PENDING',
            priority: 'MEDIUM',
            cronSchedule: newTaskCron,
        });
        setAgemsTasks((prev) => [task, ...prev]);
        setNewTaskTitle('');
        setNewTaskCron(undefined);
        setShowCronPicker(false);
    };

    const handleDrop = async (e: React.DragEvent, newStatus: AgemsTaskStatus) => {
        const id = e.dataTransfer.getData('text/plain');
        if (!id) return;
        const updated = await agemsTaskService.updateStatus(id, newStatus);
        if (updated) setAgemsTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    };

    const handleTaskUpdate = (updated: AgemsTask) => {
        setAgemsTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSelectedTask(updated);
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

            {/* AGEMS Kanban — 5 columns, drag between statuses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: 0.5, textTransform: 'uppercase' }}>AGEMS Kanban · {agemsTasks.length} tasks</span>
                    <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                        <button onClick={() => setKanbanView('board')} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: kanbanView === 'board' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)', background: kanbanView === 'board' ? 'rgba(59,130,246,0.12)' : 'transparent', color: kanbanView === 'board' ? '#60a5fa' : 'var(--slate-500)', cursor: 'pointer' }}>Board</button>
                        <button onClick={() => setKanbanView('list')} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: kanbanView === 'list' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)', background: kanbanView === 'list' ? 'rgba(59,130,246,0.12)' : 'transparent', color: kanbanView === 'list' ? '#60a5fa' : 'var(--slate-500)', cursor: 'pointer' }}>List</button>
                    </div>
                </div>
                {kanbanView === 'board' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, minHeight: 180 }}>
                        {KANBAN_COLUMNS.map((col) => {
                            const colTasks = agemsTasks.filter((t) => col.status.includes(t.status));
                            return (
                                <div key={col.title} onDragOver={(e) => e.preventDefault()} onDrop={(e) => void handleDrop(e, col.status[0] as AgemsTaskStatus)} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${col.color}20`, borderTop: `3px solid ${col.color}`, borderRadius: 10, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 160 }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: col.color, letterSpacing: 0.5, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{col.title}</span><span style={{ background: `${col.color}20`, padding: '1px 6px', borderRadius: 6 }}>{colTasks.length}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto' }}>
                                        {colTasks.map((t) => (
                                            <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)} onClick={() => setSelectedTask(t)} style={{ padding: '8px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.25)', border: t.lockedBy && t.lockedUntil && t.lockedUntil > Date.now() ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.06)', cursor: 'grab', fontSize: 11 }}>
                                                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title} {t.lockedBy && t.lockedUntil && t.lockedUntil > Date.now() ? '🔒' : ''}</div>
                                                <div style={{ fontSize: 10, color: 'var(--slate-500)', marginTop: 2 }}>{t.priority} · {t.cronSchedule ? '⏰ ' + (t.cronSchedule.kind === 'preset' ? t.cronSchedule.preset : 'custom') : t.type}</div>
                                                {t.labels && t.labels.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
                                                        {t.labels.map((lbl) => <span key={lbl} style={{ fontSize: 9, padding: '1px 4px', borderRadius: 4, background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>{lbl}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {colTasks.length === 0 && <div style={{ fontSize: 10, color: 'var(--slate-500)', textAlign: 'center', padding: 8, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>Drop here</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {agemsTasks.map((t) => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                                <span style={{ fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title} {t.cronSchedule ? '⏰' : ''}</span>
                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>{t.cronSchedule ? (t.cronSchedule.kind === 'preset' ? t.cronSchedule.preset : 'custom') : t.status}</span>
                                <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>{t.priority}</span>
                            </div>
                        ))}
                        {agemsTasks.length === 0 && <div style={{ fontSize: 11, color: 'var(--slate-500)', textAlign: 'center', padding: 12 }}>No AGEMS tasks — create one below</div>}
                    </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input placeholder="New AGEMS task title…" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newTaskTitle.trim()) void handleCreateAgemsTask(); }} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12 }} />
                    <button onClick={() => setShowCronPicker((p) => !p)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: newTaskCron ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: newTaskCron ? '#60a5fa' : 'var(--slate-400)', fontWeight: 600, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {newTaskCron ? formatCronPreview(newTaskCron) : '⏰ Schedule'}
                    </button>
                    <button onClick={() => void handleCreateAgemsTask()} disabled={!newTaskTitle.trim()} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: newTaskTitle.trim() ? '#3b82f6' : 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 700, fontSize: 12, cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed' }}>Create</button>
                </div>
                {showCronPicker && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 0' }}>
                        {getPresets().map((p) => (
                            <button key={p.key} onClick={() => setNewTaskCron({ kind: 'preset', preset: p.preset })} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: newTaskCron?.kind === 'preset' && newTaskCron.preset === p.preset ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: newTaskCron?.kind === 'preset' && newTaskCron.preset === p.preset ? '#60a5fa' : 'var(--slate-400)', fontSize: 11, cursor: 'pointer' }}>{p.label}</button>
                        ))}
                        {newTaskCron && (
                            <button onClick={() => setNewTaskCron(undefined)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--slate-400)', fontSize: 11, cursor: 'pointer' }}>Clear</button>
                        )}
                    </div>
                )}
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
            {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={handleTaskUpdate} />}
        </div>
    );
};

export default TasksPanel;
