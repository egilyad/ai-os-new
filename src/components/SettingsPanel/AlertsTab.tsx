import { Webhook } from 'lucide-react';
import { notificationWebhookService } from '../../kernel/instances';
import type { WebhookConfig, WebhookProvider, WebhookEventType } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import {
    flexCenterGap2,
    flexColGap3,
    sectionTitleLarge,
    textMutedSm,
    webhookInput,
} from '../../styles/common';
import { SettingRow, Toggle } from './settings-shared';

interface AlertsTabProps {
    webhooks: WebhookConfig[];
    setWebhooks: (webhooks: WebhookConfig[]) => void;
    webhookForm: {
        name: string;
        url: string;
        provider: WebhookProvider;
        events: WebhookEventType[];
    };
    setWebhookForm: React.Dispatch<
        React.SetStateAction<{
            name: string;
            url: string;
            provider: WebhookProvider;
            events: WebhookEventType[];
        }>
    >;
    eventOptions: WebhookEventType[];
    providerOptions: WebhookProvider[];
}

const refreshWebhooks = () => {
    try {
        const wh = notificationWebhookService.getWebhooks();
        if (Array.isArray(wh)) return wh;
    } catch {
        /* not ready */
    }
    return [];
};

const AlertsTab: React.FC<AlertsTabProps> = ({
    webhooks,
    setWebhooks,
    webhookForm,
    setWebhookForm,
    eventOptions,
    providerOptions,
}) => {
    const { t } = useTranslation();
    const list = Array.isArray(webhooks) ? webhooks : [];

    return (
        <>
            <div style={sectionTitleLarge}>{t('settings.webhooks_title')}</div>
            <div style={textMutedSm}>{t('settings.webhooks_desc')}</div>
            {list.map((wh) => (
                <SettingRow
                    key={wh.id}
                    icon={<Webhook size={20} />}
                    title={wh.name}
                    description={`${wh.provider} — ${wh.events.length} event(s)`}
                >
                    <div style={flexCenterGap2}>
                        <Toggle
                            checked={wh.enabled}
                            onChange={(v) => {
                                notificationWebhookService.updateWebhook(wh.id, { enabled: v });
                                setWebhooks(refreshWebhooks());
                            }}
                        />
                        <button
                            type="button"
                            style={{
                                color: 'var(--error)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                padding: '0.4rem 0.75rem',
                                borderRadius: 8,
                                fontSize: '0.75rem',
                                background: 'var(--error-tint)',
                                cursor: 'pointer',
                            }}
                            onClick={() => {
                                notificationWebhookService.removeWebhook(wh.id);
                                setWebhooks(refreshWebhooks());
                            }}
                        >
                            {t('settings.webhooks_remove')}
                        </button>
                    </div>
                </SettingRow>
            ))}
            {list.length === 0 && (
                <div
                    style={{
                        fontSize: '0.85rem',
                        color: 'var(--slate-500)',
                        textAlign: 'center',
                        padding: '2rem',
                        fontStyle: 'italic',
                    }}
                >
                    {t('settings.webhooks_empty')}
                </div>
            )}
            <div
                style={{
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                }}
            >
                <div
                    style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--slate-50)',
                        marginBottom: '1rem',
                    }}
                >
                    {t('settings.webhooks_form_title')}
                </div>
                <div style={flexColGap3}>
                    <input
                        id="wh-name"
                        placeholder={t('settings.webhooks_name_placeholder')}
                        value={webhookForm.name}
                        onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                        style={{
                            ...webhookInput,
                            borderColor: !webhookForm.name
                                ? 'rgba(239,68,68,0.4)'
                                : 'rgba(255,255,255,0.1)',
                        }}
                    />
                    {!webhookForm.name && (
                        <span
                            style={{ fontSize: '0.65rem', color: 'var(--error)', marginTop: '-0.5rem' }}
                        >
                            {t('settings.webhooks_name_required')}
                        </span>
                    )}
                    <input
                        id="wh-url"
                        placeholder={t('settings.webhooks_url_placeholder')}
                        value={webhookForm.url}
                        onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                        style={{
                            ...webhookInput,
                            borderColor: !webhookForm.url
                                ? 'rgba(239,68,68,0.4)'
                                : 'rgba(255,255,255,0.1)',
                        }}
                    />
                    {!webhookForm.url && (
                        <span
                            style={{ fontSize: '0.65rem', color: 'var(--error)', marginTop: '-0.5rem' }}
                        >
                            {t('settings.webhooks_url_required')}
                        </span>
                    )}
                    <select
                        value={webhookForm.provider}
                        onChange={(e) =>
                            setWebhookForm({
                                ...webhookForm,
                                provider: e.target.value as WebhookProvider,
                            })
                        }
                        style={{
                            padding: '0.6rem 1rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            color: 'white',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {providerOptions.map((prov) => (
                            <option key={prov} value={prov}>
                                {prov === 'slack'
                                    ? t('settings.webhooks_type_slack')
                                    : prov === 'telegram'
                                      ? t('settings.webhooks_type_telegram')
                                      : prov}
                            </option>
                        ))}
                    </select>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {eventOptions.map((evt) => (
                            <label
                                key={evt}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    fontSize: '0.75rem',
                                    color: webhookForm.events.includes(evt) ? '#60a5fa' : '#64748b',
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={webhookForm.events.includes(evt)}
                                    onChange={() => {
                                        setWebhookForm({
                                            ...webhookForm,
                                            events: webhookForm.events.includes(evt)
                                                ? webhookForm.events.filter((e) => e !== evt)
                                                : [...webhookForm.events, evt],
                                        });
                                    }}
                                    style={{ accentColor: '#3b82f6' }}
                                />
                                {evt.replace(/:/g, ' ')}
                            </label>
                        ))}
                    </div>
                    <button
                        type="button"
                        style={{
                            alignSelf: 'flex-start',
                            padding: '0.6rem 1.5rem',
                            borderRadius: 8,
                            background: 'var(--accent)',
                            border: 'none',
                            color: 'white',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                        }}
                        onClick={async () => {
                            if (!webhookForm.name || !webhookForm.url) return;
                            try {
                                await notificationWebhookService.addWebhook({
                                    provider: webhookForm.provider,
                                    name: webhookForm.name,
                                    webhookUrl: webhookForm.url,
                                    enabled: true,
                                    events: webhookForm.events,
                                });
                                setWebhookForm({
                                    name: '',
                                    url: '',
                                    provider: (providerOptions[0] || 'slack') as WebhookProvider,
                                    events: [
                                        (eventOptions[0] ||
                                            'system:notification') as WebhookEventType,
                                    ],
                                });
                                setWebhooks(refreshWebhooks());
                            } catch (e) {
                                console.error('Failed to add webhook:', e);
                            }
                        }}
                    >
                        {t('settings.webhooks_add')}
                    </button>
                </div>
            </div>
        </>
    );
};

export default AlertsTab;
