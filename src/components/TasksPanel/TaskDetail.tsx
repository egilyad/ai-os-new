import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { taskManagerService } from '../../kernel/instances/services-extras';
import type {
    TaskComment,
    TaskLabel,
    TaskRecord,
    TaskWorkProduct,
    WorkProductType,
} from '../../kernel/types/task-types';
import { Button } from '../Common/Button';
import TaskTriggerPanel from './TaskTriggerPanel';

const WP_TYPES: WorkProductType[] = ['artifact', 'document', 'code', 'report', 'file'];

interface TaskDetailProps {
    taskId: string;
    onClose: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, onClose }) => {
    const { t } = useTranslation();
    const [task, setTask] = useState<TaskRecord | null>(null);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [products, setProducts] = useState<TaskWorkProduct[]>([]);
    const [labels, setLabels] = useState<TaskLabel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commentDraft, setCommentDraft] = useState('');
    const [wpTitle, setWpTitle] = useState('');
    const [wpContent, setWpContent] = useState('');
    const [wpType, setWpType] = useState<WorkProductType>('document');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const [found, foundComments, foundProducts, allLabels] = await Promise.all([
                taskManagerService.get(taskId),
                taskManagerService.getComments(taskId),
                taskManagerService.getWorkProducts(taskId),
                taskManagerService.listLabels(),
            ]);
            if (!found) {
                setError(t('tasks.detail.error_load'));
            } else {
                setTask(found);
                setError(null);
            }
            setComments(foundComments);
            setProducts(foundProducts);
            setLabels(allLabels);
        } catch (e) {
            console.warn('[TaskDetail] Failed to load task detail:', e);
            setError(t('tasks.detail.error_load'));
        } finally {
            setLoading(false);
        }
    }, [taskId, t]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleAddComment = async () => {
        const content = commentDraft.trim();
        if (!content || busy) return;
        setBusy(true);
        try {
            await taskManagerService.addComment(taskId, 'human', 'user', content);
            setCommentDraft('');
            setComments(await taskManagerService.getComments(taskId));
        } catch (e) {
            console.warn('[TaskDetail] Failed to add comment:', e);
            setError(t('tasks.detail.error_load'));
        } finally {
            setBusy(false);
        }
    };

    const handleAddProduct = async () => {
        const title = wpTitle.trim();
        if (!title || busy) return;
        setBusy(true);
        try {
            await taskManagerService.addWorkProduct(taskId, title, '', wpType, wpContent, 'user');
            setWpTitle('');
            setWpContent('');
            setProducts(await taskManagerService.getWorkProducts(taskId));
        } catch (e) {
            console.warn('[TaskDetail] Failed to add work product:', e);
            setError(t('tasks.detail.error_load'));
        } finally {
            setBusy(false);
        }
    };

    const handleToggleLabel = async (labelId: string) => {
        if (!task || busy) return;
        setBusy(true);
        try {
            const has = task.labelIds.includes(labelId);
            const labelIds = has
                ? task.labelIds.filter((id) => id !== labelId)
                : [...task.labelIds, labelId];
            const updated = await taskManagerService.update(taskId, { labelIds });
            setTask(updated);
        } catch (e) {
            console.warn('[TaskDetail] Failed to toggle label:', e);
            setError(t('tasks.detail.error_load'));
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <div role="status">{t('tasks.loading')}</div>;
    }

    if (error || !task) {
        return (
            <div role="alert" style={{ color: 'var(--error)' }}>
                {error ?? t('tasks.detail.error_load')}
            </div>
        );
    }

    return (
        <div
            style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--slate-50)' }}>{task.title}</h3>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    {t('tasks.detail.close')}
                </Button>
            </div>

            {task.description && (
                <p style={{ margin: 0, color: 'var(--slate-400)', fontSize: '0.85rem' }}>
                    {task.description}
                </p>
            )}

            <section aria-label={t('tasks.detail.labels')}>
                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--slate-200)', fontSize: '0.8rem' }}>
                    {t('tasks.detail.labels')}
                </h4>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {labels.map((label) => {
                        const active = task.labelIds.includes(label.id);
                        return (
                            <button
                                key={label.id}
                                type="button"
                                onClick={() => void handleToggleLabel(label.id)}
                                aria-pressed={active}
                                style={{
                                    borderRadius: 'var(--radius-full)',
                                    border: `1px solid ${label.color}`,
                                    background: active ? `${label.color}33` : 'transparent',
                                    color: 'var(--slate-200)',
                                    padding: '0.2rem 0.6rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                }}
                            >
                                {label.name}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section aria-label={t('tasks.detail.comments')}>
                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--slate-200)', fontSize: '0.8rem' }}>
                    {t('tasks.detail.comments')} ({comments.length})
                </h4>
                {comments.length === 0 ? (
                    <p style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                        {t('tasks.detail.comments_empty')}
                    </p>
                ) : (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {comments.map((c) => (
                            <li key={c.id} style={{ color: 'var(--slate-300)', fontSize: '0.85rem' }}>
                                <strong>{c.authorId}</strong>: {c.content}
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                        type="text"
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        placeholder={t('tasks.detail.comment_placeholder')}
                        aria-label={t('tasks.detail.comment_placeholder')}
                        style={{
                            flex: 1,
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--slate-50)',
                            padding: '0.4rem 0.6rem',
                        }}
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddComment}
                        disabled={busy || !commentDraft.trim()}
                    >
                        {t('tasks.detail.comment_add')}
                    </Button>
                </div>
            </section>

            <TaskTriggerPanel taskId={taskId} />

            <section aria-label={t('tasks.detail.products')}>
                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--slate-200)', fontSize: '0.8rem' }}>
                    {t('tasks.detail.products')} ({products.length})
                </h4>
                {products.length === 0 ? (
                    <p style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                        {t('tasks.detail.products_empty')}
                    </p>
                ) : (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {products.map((p) => (
                            <li key={p.id} style={{ color: 'var(--slate-300)', fontSize: '0.85rem' }}>
                                <strong>{p.title}</strong> ({t(`tasks.detail.type.${p.type}`)})
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        value={wpTitle}
                        onChange={(e) => setWpTitle(e.target.value)}
                        placeholder={t('tasks.detail.wp_title_placeholder')}
                        aria-label={t('tasks.detail.wp_title_placeholder')}
                        style={{
                            flex: 1,
                            minWidth: 140,
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--slate-50)',
                            padding: '0.4rem 0.6rem',
                        }}
                    />
                    <select
                        value={wpType}
                        onChange={(e) => setWpType(e.target.value as WorkProductType)}
                        aria-label={t('tasks.detail.products')}
                        style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--slate-50)',
                            padding: '0.4rem',
                        }}
                    >
                        {WP_TYPES.map((wt) => (
                            <option key={wt} value={wt}>
                                {t(`tasks.detail.type.${wt}`)}
                            </option>
                        ))}
                    </select>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddProduct}
                        disabled={busy || !wpTitle.trim()}
                    >
                        {t('tasks.detail.wp_add')}
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default TaskDetail;
