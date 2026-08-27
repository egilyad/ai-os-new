import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Webhook, Plus, Trash2, Play, AlertTriangle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationWebhookService } from '../kernel/instances';
import type { WebhookConfig, WebhookProvider } from '../kernel/contracts/webhook';
import { useTranslation } from '../i18n/useTranslation';
import { useAutoClearError } from '../hooks/useAutoClearError';
import {
    errorContainer,
    dismissBtnRed,
    textMutedXs,
    textSecondaryXs,
    input,
    selectBase,
} from '../styles/common';
import { Button } from './Common';
import { PanelLoading } from './PanelStates';
import { ConfirmDialog } from './ConfirmDialog';

const WEBHOOK_EVENTS = [
    'system:notification',
    'key:quota:exceeded',
    'policy:violation',
    'key:state:changed',
    'chat:stream:error',
    'key:compromised',
    'key:rotated',
] as const;

const maskWebhookUrl = (url: string): string => {
    try {
        const u = new URL(url);
        if (u.password) {
            u.password = '****';
            return u.toString();
        }
        const pathParts = u.pathname.split('/');
        for (let i = 0; i < pathParts.length; i++) {
            if (pathParts[i]!.startsWith('bot')) pathParts[i] = 'bot****';
        }
        u.pathname = pathParts.join('/');
        return u.toString().replace(/([?&](?:api_key|token|secret)=)[^&]+/gi, '$1***');
    } catch {
        return url.replace(/([?&](?:api_key|token|secret)=)[^&]+/gi, '$1***');
    }
};

const WebhooksPanel: React.FC = () => {
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<
        Record<string, { ok: boolean; status?: number }>
    >({});
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);
    const { t } = useTranslation();
    const clearError = useAutoClearError(setError);

    const [formName, setFormName] = useState('');
    const [formUrl, setFormUrl] = useState('');
    const [formProvider, setFormProvider] = useState<WebhookProvider>('slack');
    const [formEvents, setFormEvents] = useState<string[]>(['system:notification']);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const loadWebhooks = useCallback(() => {
        try {
            const list = (notificationWebhookService?.getWebhooks ?? (() => []))();
            if (isMountedRef.current) setWebhooks(list);
        } catch {
            if (isMountedRef.current) setError(t('webhooks.error_load'));
        }
        if (isMountedRef.current) setLoading(false);
    }, [t]);

    useEffect(() => {
        isMountedRef.current = true;
        loadWebhooks();
        return () => {
            isMountedRef.current = false;
        };
    }, [loadWebhooks]);

    const handleTest = async (id: string) => {
        setTesting(id);
        try {
            const result = await notificationWebhookService.testWebhook(id);
            if (isMountedRef.current) setTestResults((prev) => ({ ...prev, [id]: result }));
        } catch {
            if (isMountedRef.current) setTestResults((prev) => ({ ...prev, [id]: { ok: false } }));
        } finally {
            if (isMountedRef.current) setTesting(null);
        }
    };

    const handleToggle = (webhook: WebhookConfig) => {
        try {
            notificationWebhookService.updateWebhook(webhook.id, { enabled: !webhook.enabled });
            loadWebhooks();
        } catch {
            setError(t('webhooks.error_toggle'));
        }
    };

    const handleRemove = (id: string) => {
        setDeleteConfirm(id);
    };

    const confirmRemove = () => {
        if (!deleteConfirm) return;
        try {
            notificationWebhookService.removeWebhook(deleteConfirm);
            loadWebhooks();
        } catch {
            setError(t('webhooks.error_remove'));
        }
        setDeleteConfirm(null);
    };

    const handleAdd = async () => {
        if (!formName.trim() || !formUrl.trim()) {
            setError(t('webhooks.error_required'));
            return;
        }
        try {
            await notificationWebhookService.addWebhook({
                provider: formProvider,
                name: formName.trim(),
                webhookUrl: formUrl.trim(),
                enabled: true,
                events: formEvents as WebhookConfig['events'],
            });
            loadWebhooks();
            setShowForm(false);
            setFormName('');
            setFormUrl('');
            setFormProvider('slack');
            setFormEvents(['system:notification']);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : t('webhooks.error_add'));
            clearError();
        }
    };

    const toggleEvent = (evt: string) => {
        setFormEvents((prev) =>
            prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt],
        );
    };

    if (loading) {
        return <PanelLoading />;
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                        <Webhook size={28} color="#a855f7" /> {t('webhooks.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('webhooks.subtitle')}
                    </p>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: showForm ? 'var(--slate-500)' : 'var(--accent)',
                    }}
                >
                    <Plus size={16} /> {showForm ? t('common.cancel') : t('webhooks.add')}
                </Button>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={errorContainer}
                    >
                        <AlertTriangle size={18} /> {error}
                        <button onClick={() => setError(null)} style={dismissBtnRed}>
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {showForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{
                        padding: '1.5rem',
                        borderRadius: 16,
                        border: '1px solid rgba(168,85,247,0.2)',
                        background: 'rgba(168,85,247,0.03)',
                    }}
                >
                    <h3
                        style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--slate-200)',
                            margin: '0 0 1rem',
                        }}
                    >
                        {t('webhooks.form_title')}
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '1rem',
                            marginBottom: '1rem',
                        }}
                    >
                        <div>
                            <div style={textSecondaryXs}>{t('webhooks.form_name')}</div>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder={t('webhooks.name_placeholder')}
                                style={input}
                            />
                        </div>
                        <div>
                            <div style={textSecondaryXs}>{t('webhooks.form_url')}</div>
                            <input
                                type="text"
                                value={formUrl}
                                onChange={(e) => setFormUrl(e.target.value)}
                                placeholder={t('webhooks.url_placeholder')}
                                style={input}
                            />
                        </div>
                        <div>
                            <div style={textSecondaryXs}>{t('webhooks.form_provider')}</div>
                            <select
                                value={formProvider}
                                onChange={(e) => setFormProvider(e.target.value as WebhookProvider)}
                                style={selectBase}
                            >
                                <option value="slack">Slack</option>
                                <option value="telegram">Telegram</option>
                                <option value="discord">Discord</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ ...textSecondaryXs, marginBottom: '0.5rem' }}>
                            {t('webhooks.form_events')}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {WEBHOOK_EVENTS.map((evt) => (
                                <button
                                    key={evt}
                                    onClick={() => toggleEvent(evt)}
                                    style={{
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: formEvents.includes(evt)
                                            ? 'rgba(168,85,247,0.2)'
                                            : 'transparent',
                                        color: formEvents.includes(evt) ? '#c084fc' : '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    {evt}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button
                        onClick={handleAdd}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Plus size={16} /> {t('webhooks.add_webhook')}
                    </Button>
                </motion.div>
            )}

            {(webhooks ?? []).length === 0 ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        color: 'var(--slate-500)',
                        fontSize: '0.9rem',
                        fontStyle: 'italic',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: 16,
                    }}
                >
                    <Webhook size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <div
                        style={{
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                            color: 'var(--slate-400)',
                        }}
                    >
                        {t('webhooks.empty')}
                    </div>
                    <div>{t('webhooks.empty_desc')}</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(webhooks ?? []).map((wh) => {
                        const testResult = testResults[wh.id];
                        return (
                            <div
                                key={wh.id}
                                style={{
                                    padding: '1rem 1.25rem',
                                    borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    background: 'rgba(0,0,0,0.15)',
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
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: 6,
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                background:
                                                    wh.provider === 'slack'
                                                        ? 'rgba(74, 74, 74, 0.2)'
                                                        : wh.provider === 'telegram'
                                                          ? 'rgba(0, 136, 204, 0.15)'
                                                          : 'rgba(114, 137, 218, 0.15)',
                                                color:
                                                    wh.provider === 'slack'
                                                        ? '#9ca3af'
                                                        : wh.provider === 'telegram'
                                                          ? '#60a5fa'
                                                          : '#818cf8',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {wh.provider}
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                color: 'var(--slate-100)',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            {wh.name}
                                        </div>
                                        <div style={textMutedXs}>
                                            {maskWebhookUrl(wh.webhookUrl)}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.4rem',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <button
                                            onClick={() => handleTest(wh.id)}
                                            disabled={testing === wh.id}
                                            style={{
                                                padding: '0.35rem 0.6rem',
                                                borderRadius: 6,
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'transparent',
                                                color: 'var(--slate-400)',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            {testing === wh.id ? (
                                                <Loader2 size={14} />
                                            ) : (
                                                <Play size={14} />
                                            )}
                                            {t('webhooks.test')}
                                        </button>
                                        {testResult && (
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: testResult.ok ? '#10b981' : '#ef4444',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {testResult.ok
                                                    ? `${t('webhooks.ok')}${testResult.status ? ` (${testResult.status})` : ''}`
                                                    : `${t('webhooks.fail')}${testResult.status ? ` (${testResult.status})` : ''}`}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleToggle(wh)}
                                            style={{
                                                padding: '0.35rem 0.6rem',
                                                borderRadius: 6,
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                background: wh.enabled
                                                    ? 'rgba(16,185,129,0.15)'
                                                    : 'rgba(100,116,139,0.15)',
                                                color: wh.enabled ? '#10b981' : '#64748b',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {wh.enabled
                                                ? t('webhooks.enabled')
                                                : t('webhooks.disabled')}
                                        </button>
                                        <button
                                            onClick={() => handleRemove(wh.id)}
                                            style={dismissBtnRed}
                                            title={t('webhooks.remove')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                    {wh.events.map((evt) => (
                                        <span
                                            key={evt}
                                            style={{
                                                padding: '0.15rem 0.4rem',
                                                borderRadius: 4,
                                                fontSize: '0.65rem',
                                                background: 'var(--purple-tint)',
                                                color: 'var(--purple-muted)',
                                            }}
                                        >
                                            {evt}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div
                style={{
                    fontSize: '0.75rem',
                    color: 'var(--slate-500)',
                    padding: '0.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                {t('webhooks.footer', { count: (webhooks ?? []).length })}
            </div>

            <ConfirmDialog
                open={!!deleteConfirm}
                title={t('webhooks.remove_title')}
                message={t('webhooks.remove_confirm')}
                variant="danger"
                confirmLabel={t('webhooks.remove')}
                onConfirm={confirmRemove}
                onCancel={() => setDeleteConfirm(null)}
            />
        </div>
    );
};

export default WebhooksPanel;
