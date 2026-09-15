import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { taskManagerService } from '../../kernel/instances/services-extras';
import type { TaskPriority, TaskRecord, TaskStatus, TaskType } from '../../kernel/types/task-types';
import { Button } from '../Common/Button';
import TaskDetail from './TaskDetail';
import CronBuilder from './CronBuilder';

const COLUMNS: TaskStatus[] = ['pending', 'in_progress', 'in_review', 'completed', 'failed'];

/** Mirrors ALLOWED_TRANSITIONS in task-manager-service (client-side for UX only). */
const NEXT: Record<TaskStatus, TaskStatus[]> = {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['in_review', 'blocked', 'failed', 'cancelled'],
    in_review: ['in_testing', 'in_progress', 'completed', 'failed'],
    in_testing: ['verified', 'in_progress', 'failed'],
    verified: ['completed'],
    awaiting_approval: ['completed', 'in_progress', 'cancelled'],
    completed: [],
    failed: ['pending', 'cancelled'],
    blocked: ['pending', 'cancelled'],
    cancelled: ['pending'],
};

const PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];

const KanbanBoard: React.FC = () => {
    const { t } = useTranslation();
    const [tasks, setTasks] = useState<TaskRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
    const [busy, setBusy] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [newType, setNewType] = useState<TaskType>('one_time');
    const [newCron, setNewCron] = useState<string | undefined>(undefined);

    const load = useCallback(async () => {
        try {
            const all = await taskManagerService.list();
            setTasks(all);
            setError(null);
        } catch (e) {
            console.warn('[KanbanBoard] Failed to load tasks:', e);
            setError(t('tasks.kanban.error_load'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        void load();
    }, [load]);

    const buckets = useMemo(() => {
        const map = new Map<string, TaskRecord[]>();
        for (const c of COLUMNS) map.set(c, []);
        const other: TaskRecord[] = [];
        for (const task of tasks) {
            const bucket = map.get(task.status);
            if (bucket) bucket.push(task);
            else other.push(task);
        }
        return { map, other };
    }, [tasks]);

    const handleCreate = async () => {
        const title = newTitle.trim();
        if (!title || busy) return;
        setBusy(true);
        try {
            await taskManagerService.create({
                title,
                priority: newPriority,
                type: newType,
                cron: newType === 'recurring' ? newCron : undefined,
            });
            setNewTitle('');
            await load();
        } catch (e) {
            console.warn('[KanbanBoard] Failed to create task:', e);
            setError(t('tasks.kanban.error_create'));
        } finally {
            setBusy(false);
        }
    };

    const handleMove = async (id: string, toStatus: TaskStatus) => {
        setBusy(true);
        try {
            await taskManagerService.transition(id, toStatus);
            await load();
        } catch (e) {
            console.warn('[KanbanBoard] Failed to move task:', e);
            setError(t('tasks.kanban.error_move'));
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <div role="status">{t('tasks.loading')}</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <h2 style={{ margin: 0, color: 'var(--slate-50)' }}>{t('tasks.kanban.title')}</h2>
                <p style={{ margin: 0, color: 'var(--slate-400)', fontSize: '0.85rem' }}>
                    {t('tasks.kanban.subtitle')}
                </p>
            </div>

            {error && (
                <div role="alert" style={{ color: 'var(--error)' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={t('tasks.kanban.create_placeholder')}
                    aria-label={t('tasks.kanban.create_placeholder')}
                    style={{
                        flex: 1,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--slate-50)',
                        padding: '0.5rem 0.75rem',
                    }}
                />
                <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    aria-label={t('tasks.priority')}
                    style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--slate-50)',
                        padding: '0.5rem',
                    }}
                >
                    {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                            {t(`tasks.${p}_priority`)}
                        </option>
                    ))}
                </select>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreate}
                    disabled={busy || !newTitle.trim() || (newType === 'recurring' && !newCron)}
                >
                    {t('tasks.kanban.create')}
                </Button>
                <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as TaskType)}
                    aria-label={t('tasks.type')}
                    style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--slate-50)',
                        padding: '0.5rem',
                    }}
                >
                    {(['one_time', 'recurring', 'continuous'] as const).map((tp) => (
                        <option key={tp} value={tp}>
                            {t(`tasks.kanban.type.${tp}`)}
                        </option>
                    ))}
                </select>
            </div>

            {newType === 'recurring' && (
                <CronBuilder value={newCron} onChange={setNewCron} />
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, minmax(180px, 1fr))',
                    gap: '0.75rem',
                    overflowX: 'auto',
                }}
            >
                {COLUMNS.map((col) => {
                    const cards = buckets.map.get(col) ?? [];
                    return (
                        <section
                            key={col}
                            aria-label={t(`tasks.kanban.status.${col}`)}
                            style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                minHeight: 120,
                            }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: '0.8rem',
                                    color: 'var(--slate-200)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {t(`tasks.kanban.status.${col}`)} ({cards.length})
                            </h3>
                            {cards.length === 0 && (
                                <p style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                                    {t('tasks.kanban.empty_column')}
                                </p>
                            )}
                            {cards.map((card) => (
                                <article
                                    key={card.id}
                                    aria-label={card.title}
                                    style={{
                                        background: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.4rem',
                                    }}
                                >
                                    <div style={{ color: 'var(--slate-50)', fontSize: '0.85rem' }}>
                                        {card.title}
                                    </div>
                                    <div style={{ color: 'var(--slate-500)', fontSize: '0.7rem' }}>
                                        {t(`tasks.${card.priority}_priority`)}
                                    </div>
                                    {card.type === 'recurring' && card.cron && (
                                        <div style={{ color: 'var(--slate-500)', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                                            ↻ {card.cron}
                                        </div>
                                    )}
                                    {NEXT[card.status].length > 0 && (
                                        <select
                                            value=""
                                            onChange={(e) => {
                                                if (e.target.value)
                                                    void handleMove(card.id, e.target.value as TaskStatus);
                                            }}
                                            aria-label={`${t('tasks.kanban.move_to')}: ${card.title}`}
                                            disabled={busy}
                                            style={{
                                                background: 'var(--surface)',
                                                border: '1px solid var(--border-default)',
                                                borderRadius: 'var(--radius-md)',
                                                color: 'var(--slate-200)',
                                                padding: '0.25rem',
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            <option value="">{t('tasks.kanban.move_to')}…</option>
                                            {NEXT[card.status].map((s) => (
                                                <option key={s} value={s}>
                                                    {t(`tasks.kanban.status.${s}`)}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setSelectedId(selectedId === card.id ? null : card.id)
                                        }
                                    >
                                        {t('tasks.kanban.details')}
                                    </Button>
                                </article>
                            ))}
                        </section>
                    );
                })}
            </div>

            {selectedId && (
                <TaskDetail taskId={selectedId} onClose={() => setSelectedId(null)} />
            )}

            {buckets.other.length > 0 && (
                <section aria-label={t('tasks.kanban.other')}>
                    <h3 style={{ color: 'var(--slate-200)', fontSize: '0.8rem' }}>
                        {t('tasks.kanban.other')} ({buckets.other.length})
                    </h3>
                    <ul>
                        {buckets.other.map((task) => (
                            <li key={task.id} style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>
                                {task.title} — {t(`tasks.kanban.status.${task.status}`)}
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

export default KanbanBoard;
