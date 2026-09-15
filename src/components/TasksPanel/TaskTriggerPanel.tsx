import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { taskTriggerService } from '../../kernel/instances/services-extras';
import type { TaskTriggerAuthKind, TaskTriggerKind, TaskTriggerRecord } from '../../kernel/types/task-types';
import { Button } from '../Common/Button';

const KINDS: TaskTriggerKind[] = ['webhook', 'gmail', 'n8n'];
const AUTH_KINDS: TaskTriggerAuthKind[] = ['none', 'hmac', 'bearer'];

interface TaskTriggerPanelProps {
    taskId: string;
}

const TaskTriggerPanel: React.FC<TaskTriggerPanelProps> = ({ taskId }) => {
    const { t } = useTranslation();
    const [triggers, setTriggers] = useState<TaskTriggerRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [slug, setSlug] = useState('');
    const [kind, setKind] = useState<TaskTriggerKind>('webhook');
    const [authKind, setAuthKind] = useState<TaskTriggerAuthKind>('none');
    const [authSecret, setAuthSecret] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const list = await taskTriggerService.listByTask(taskId);
            setTriggers(list);
            setError(null);
        } catch (e) {
            console.warn('[TaskTriggerPanel] Failed to load triggers:', e);
            setError(t('tasks.triggers.error_load'));
        } finally {
            setLoading(false);
        }
    }, [taskId, t]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleCreate = async () => {
        const s = slug.trim();
        if (!s || busy) return;
        setBusy(true);
        try {
            await taskTriggerService.create({
                taskId,
                slug: s,
                kind,
                authKind,
                authSecret: authSecret || undefined,
            });
            setSlug('');
            setAuthSecret('');
            await load();
        } catch (e) {
            console.warn('[TaskTriggerPanel] Failed to create trigger:', e);
            setError((e as Error).message || t('tasks.triggers.error_create'));
        } finally {
            setBusy(false);
        }
    };

    const handleToggle = async (id: string, enabled: boolean) => {
        setBusy(true);
        try {
            await taskTriggerService.setEnabled(id, !enabled);
            await load();
        } catch (e) {
            console.warn('[TaskTriggerPanel] Failed to toggle trigger:', e);
            setError(t('tasks.triggers.error_update'));
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (id: string) => {
        setBusy(true);
        try {
            await taskTriggerService.delete(id);
            await load();
        } catch (e) {
            console.warn('[TaskTriggerPanel] Failed to delete trigger:', e);
            setError(t('tasks.triggers.error_delete'));
        } finally {
            setBusy(false);
        }
    };

    const handleFire = async (trigger: TaskTriggerRecord) => {
        setBusy(true);
        try {
            const payload = '{"test":1}';
            let sig: string | undefined;
            let token: string | undefined;
            if (trigger.authKind === 'hmac' && trigger.authSecretEnc) {
                // Use the same helper as service for demo fire
                const { TaskTriggerService } = await import('../../kernel/services/task-trigger-service');
                sig = TaskTriggerService.hmacHex(payload, trigger.authSecretEnc);
            }
            if (trigger.authKind === 'bearer') token = trigger.authSecretEnc || undefined;
            await taskTriggerService.fire(trigger.id, payload, sig, token);
            await load();
        } catch (e) {
            console.warn('[TaskTriggerPanel] Failed to fire trigger:', e);
            setError((e as Error).message || t('tasks.triggers.error_fire'));
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <div role="status">{t('tasks.loading')}</div>;

    return (
        <section aria-label={t('tasks.triggers.title')} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4 style={{ margin: 0, color: 'var(--slate-200)', fontSize: '0.8rem' }}>
                {t('tasks.triggers.title')} ({triggers.length})
            </h4>

            {error && (
                <div role="alert" style={{ color: 'var(--error)', fontSize: '0.8rem' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder={t('tasks.triggers.slug_placeholder')}
                    aria-label={t('tasks.triggers.slug_placeholder')}
                    style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--slate-50)',
                        padding: '0.4rem',
                        minWidth: 120,
                    }}
                />
                <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as TaskTriggerKind)}
                    aria-label={t('tasks.triggers.kind')}
                    style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--slate-50)',
                        padding: '0.4rem',
                    }}
                >
                    {KINDS.map((k) => (
                        <option key={k} value={k}>
                            {t(`tasks.triggers.kind.${k}`)}
                        </option>
                    ))}
                </select>
                <select
                    value={authKind}
                    onChange={(e) => setAuthKind(e.target.value as TaskTriggerAuthKind)}
                    aria-label={t('tasks.triggers.auth')}
                    style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--slate-50)',
                        padding: '0.4rem',
                    }}
                >
                    {AUTH_KINDS.map((a) => (
                        <option key={a} value={a}>
                            {t(`tasks.triggers.auth.${a}`)}
                        </option>
                    ))}
                </select>
                {authKind !== 'none' && (
                    <input
                        type="text"
                        value={authSecret}
                        onChange={(e) => setAuthSecret(e.target.value)}
                        placeholder={t('tasks.triggers.secret_placeholder')}
                        aria-label={t('tasks.triggers.secret_placeholder')}
                        style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--slate-50)',
                            padding: '0.4rem',
                            minWidth: 120,
                        }}
                    />
                )}
                <Button variant="secondary" size="sm" onClick={handleCreate} disabled={busy || !slug.trim()}>
                    {t('tasks.triggers.create')}
                </Button>
            </div>

            {triggers.length === 0 ? (
                <p style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>{t('tasks.triggers.empty')}</p>
            ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {triggers.map((tr) => (
                        <li
                            key={tr.id}
                            style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.5rem',
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            <span style={{ color: 'var(--slate-50)', fontWeight: 600, fontSize: '0.85rem' }}>{tr.slug}</span>
                            <span style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                                {t(`tasks.triggers.kind.${tr.kind}`)} · {t(`tasks.triggers.auth.${tr.authKind}`)}
                            </span>
                            <span style={{ color: tr.enabled ? 'var(--success)' : 'var(--slate-500)', fontSize: '0.75rem' }}>
                                {tr.enabled ? t('tasks.triggers.enabled') : t('tasks.triggers.disabled')}
                            </span>
                            <span style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                                {t('tasks.triggers.firing_count', { count: tr.firingCount })}
                            </span>
                            {tr.lastFiredAt && (
                                <span style={{ color: 'var(--slate-500)', fontSize: '0.7rem' }}>
                                    {new Date(tr.lastFiredAt).toLocaleString()}
                                </span>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => void handleToggle(tr.id, tr.enabled)} disabled={busy}>
                                {tr.enabled ? t('tasks.triggers.disable') : t('tasks.triggers.enable')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => void handleFire(tr)} disabled={busy || !tr.enabled}>
                                {t('tasks.triggers.fire')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => void handleDelete(tr.id)} disabled={busy}>
                                {t('tasks.triggers.delete')}
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default TaskTriggerPanel;
