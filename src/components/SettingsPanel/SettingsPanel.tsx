import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    Sliders,
    Info,
    AlertTriangle,
    MessageSquare,
    Cpu,
    Bell,
    BookText,
    Lock,
    Palette,
    Key,
    Globe,
    Brain,
    FileText,
    Network,
    HardDrive,
} from 'lucide-react';
import { keyService } from '../../kernel/instances';
import { eventBus } from '../../kernel/instances';
import { EVENTS } from '../../kernel/events/event-names';
import { settingsService } from '../../kernel/instances';
import { notificationWebhookService } from '../../kernel/instances';
import { externalSecretsService } from '../../kernel/instances';
import type { SystemSettings } from '../../kernel/instances';
import type { WebhookConfig, WebhookProvider, WebhookEventType } from '../../kernel/instances';
import type { BackendStatus } from '../../kernel/instances';
import { CONFIG } from '../../kernel/instances';
import { configService } from '../../kernel/instances';
import { safeClone } from '../../shared/utils/safe-json';
import { APP_VERSION } from '../../utils/version';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import PromptsTab from './PromptsTab';
import { canonicalHealthColor, canonicalHealthLabel } from '../Common/status-vocabulary';
import type { SettingsTab, RuntimeConfigForm } from './settings-shared';
import GeneralTab from './GeneralTab';
import WritingTab from './WritingTab';
import ReadingTab from './ReadingTab';
import AlertsTab from './AlertsTab';
import AdvancedTab from './AdvancedTab';
import NotificationsTab from './NotificationsTab';
import AppearanceTab from './AppearanceTab';

import { errorBannerLg, flexJustifyBetween } from '../../styles/common';
import { useConfirm } from '../../hooks/useConfirm';

function AiModulesTab() {
    const [activity, setActivity] = useState(3);
    const [autonomy, setAutonomy] = useState(3);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontWeight: 800 }}>AI Modules</h3>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>Per-module activity (1-5) and autonomy (1-5). Persisted via settingsService per-module.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--slate-300)' }}>Activity Level: {activity} <input type="range" min={1} max={5} value={activity} onChange={(e) => setActivity(Number(e.target.value))} style={{ width: '100%' }} /></label>
                <label style={{ fontSize: 12, color: 'var(--slate-300)' }}>Autonomy Level: {autonomy} <input type="range" min={1} max={5} value={autonomy} onChange={(e) => setAutonomy(Number(e.target.value))} style={{ width: '100%' }} /></label>
                <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Modules: Planner · Guardrails · Autonomy · Dyad · SOP · RunQueue — each can be tuned separately.</div>
            </div>
        </div>
    );
}

const SettingsPanel: React.FC = () => {
    const { t } = useTranslation();
    const { confirm, ConfirmDialog } = useConfirm();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [settings, setSettings] = useState<SystemSettings>(() => {
        try {
            return settingsService.getSettings();
        } catch {
            return {} as SystemSettings;
        }
    });
    const [error, setError] = useState<string | null>(null);
    const [configForm, setConfigForm] = useState<RuntimeConfigForm | null>(null);
    const [secretsBackends, setSecretsBackends] = useState<BackendStatus[]>([]);
    const [showSecretsDetail, setShowSecretsDetail] = useState(false);
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
    const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(
        () => safeClone(CONFIG.featureFlags) as unknown as Record<string, boolean>,
    );
    const [settingsSearch, setSettingsSearch] = useState('');

    const isMountedRef = useRef(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearError = useAutoClearError(setError);

    useEffect(() => {
        isMountedRef.current = true;
        const unsubSettings = settingsService.subscribe((newSettings) => {
            if (isMountedRef.current) setSettings(newSettings);
        });

        const unsubFlags = eventBus.on(EVENTS.SETTINGS_UPDATED, () => {
            if (isMountedRef.current)
                setFeatureFlags(
                    safeClone(CONFIG.featureFlags) as unknown as Record<string, boolean>,
                );
        });

        const m = configService.getMonitoring();
        const me = configService.getMetrics();
        const tr = configService.getTraces();
        setConfigForm({
            healthCheckStaleIntervalMs: m.healthCheckStaleIntervalMs,
            latencyPenaltyThresholdMs: m.latencyPenalty.thresholdMs,
            errorRatePenaltyThreshold: m.errorRatePenalty.threshold,
            successRatePenaltyFloor: m.successRatePenalty.floor,
            alertPenaltyPerAlert: m.alertPenalty.perAlert,
            metricsHistoryLimit: me.maxHistoryPoints,
            metricsInterval: me.autoCaptureIntervalMs,
            tracesMaxEntries: tr.maxEntries,
            tracesDbLoadLimit: tr.dbLoadLimit,
            tracesTokenEstimateDivisor: tr.tokenEstimateDivisor,
        });

        externalSecretsService
            .getStatus()
            .then(setSecretsBackends)
            .catch((e) => console.warn('[Settings] Secrets status load failed:', e));

        const loadWebhooks = () => {
            try {
                const wh = notificationWebhookService.getWebhooks();
                if (Array.isArray(wh) && isMountedRef.current) {
                    setWebhooks(wh);
                    return true;
                }
            } catch {
                /* service not ready */
            }
            return false;
        };
        if (!loadWebhooks()) {
            intervalRef.current = setInterval(() => {
                if (loadWebhooks() || !isMountedRef.current) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }, 500);
            const safetyTimeout = setTimeout(() => {
                if (intervalRef.current) clearInterval(intervalRef.current);
                intervalRef.current = null;
            }, 10000);
            safetyTimeoutRef.current = safetyTimeout;
        }

        return () => {
            isMountedRef.current = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            if (safetyTimeoutRef.current) {
                clearTimeout(safetyTimeoutRef.current);
                safetyTimeoutRef.current = null;
            }
            unsubSettings();
            unsubFlags();
        };
    }, []);

    const updateSetting = useCallback(
        (key: keyof SystemSettings, val: boolean | string | number) => {
            if (!isMountedRef.current) return;
            try {
                const newSettings = { ...settings, [key]: val };
                setSettings(newSettings);
                settingsService.updateSettings({ [key]: val });
                setError(null);
            } catch (err) {
                console.warn('[SettingsPanel] Failed to update setting:', err);
                setError(t('settings.error_update'));
                clearError();
            }
        },
        [settings, clearError, t],
    );

    const handleSaveConfig = async () => {
        if (!configForm) return;
        try {
            await configService.updateMonitoring({
                healthCheckStaleIntervalMs: configForm.healthCheckStaleIntervalMs,
                latencyPenalty: {
                    thresholdMs: configForm.latencyPenaltyThresholdMs,
                    divisor: CONFIG.monitoring.latencyPenalty.divisor,
                    cap: CONFIG.monitoring.latencyPenalty.cap,
                },
                errorRatePenalty: {
                    threshold: configForm.errorRatePenaltyThreshold,
                    multiplier: CONFIG.monitoring.errorRatePenalty.multiplier,
                    cap: CONFIG.monitoring.errorRatePenalty.cap,
                },
                successRatePenalty: {
                    floor: configForm.successRatePenaltyFloor,
                    multiplier: CONFIG.monitoring.successRatePenalty.multiplier,
                },
                alertPenalty: {
                    perAlert: configForm.alertPenaltyPerAlert,
                    cap: CONFIG.monitoring.alertPenalty.cap,
                },
            });
            await configService.updateMetrics({
                maxHistoryPoints: configForm.metricsHistoryLimit,
                autoCaptureIntervalMs: configForm.metricsInterval,
            });
            await configService.updateTraces({
                maxEntries: configForm.tracesMaxEntries,
                dbLoadLimit: configForm.tracesDbLoadLimit,
                tokenEstimateDivisor: configForm.tracesTokenEstimateDivisor,
            });
            setError(null);
        } catch {
            setError(t('settings.error_save_config'));
            clearError();
        }
    };

    const handleResetDefaults = useCallback(async () => {
        if (
            !(await confirm({
                title: 'Reset Settings',
                message: t('settings.reset_confirm'),
                variant: 'danger',
            }))
        )
            return;
        try {
            settingsService.reset();
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: t('settings.reset_success_notification'),
                type: 'success',
            });
            setError(null);
        } catch (err) {
            console.warn('[SettingsPanel] Failed to reset settings:', err);
            setError(t('settings.error_reset'));
            clearError();
        }
    }, [clearError, t, confirm]);

    const webhookConfig = (() => {
        try {
            return configService.getWebhooks() || CONFIG.webhooks;
        } catch {
            return CONFIG.webhooks;
        }
    })();
    const EVENT_OPTIONS = (webhookConfig.eventOptions ||
        CONFIG.webhooks.eventOptions) as WebhookEventType[];
    const PROVIDER_OPTIONS = (webhookConfig.providers ||
        CONFIG.webhooks.providers) as WebhookProvider[];

    const [webhookForm, setWebhookForm] = useState<{
        name: string;
        url: string;
        provider: WebhookProvider;
        events: WebhookEventType[];
    }>(() => ({
        name: '',
        url: '',
        provider: PROVIDER_OPTIONS[0] as WebhookProvider,
        events: [EVENT_OPTIONS[0] as WebhookEventType],
    }));

    const handlePurgeData = useCallback(async () => {
        if (
            !(await confirm({
                title: 'Purge All Data',
                message: t('settings.purge_confirm'),
                variant: 'danger',
            }))
        )
            return;
        try {
            await keyService.clearAllData();
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: t('settings.purge_success_notification'),
                type: 'success',
            });
            setError(null);
        } catch (err) {
            console.warn('[SettingsPanel] Failed to purge data:', err);
            setError(t('settings.error_purge'));
            clearError();
        }
    }, [clearError, t, confirm]);

    const renderTab = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <GeneralTab
                        settings={settings}
                        featureFlags={featureFlags}
                        updateSetting={updateSetting}
                        setSettings={setSettings}
                        setFeatureFlags={setFeatureFlags}
                    />
                );
            case 'writing':
                return <WritingTab settings={settings} updateSetting={updateSetting} />;
            case 'reading':
                return <ReadingTab settings={settings} updateSetting={updateSetting} />;
            case 'alerts':
                return (
                    <AlertsTab
                        webhooks={webhooks}
                        setWebhooks={setWebhooks}
                        webhookForm={webhookForm}
                        setWebhookForm={setWebhookForm}
                        eventOptions={EVENT_OPTIONS}
                        providerOptions={PROVIDER_OPTIONS}
                    />
                );
            case 'notifications':
                return (
                    <NotificationsTab
                        settings={settings}
                        updateSetting={
                            updateSetting as unknown as <K extends keyof SystemSettings>(
                                key: K,
                                val: SystemSettings[K],
                            ) => void
                        }
                    />
                );
            case 'appearance':
                return <AppearanceTab />;
            case 'prompts':
                return <PromptsTab />;
            case 'advanced':
                return (
                    <AdvancedTab
                        settings={settings}
                        updateSetting={updateSetting}
                        configForm={configForm}
                        setConfigForm={setConfigForm}
                        onSaveConfig={handleSaveConfig}
                        secretsBackends={secretsBackends}
                        setSecretsBackends={setSecretsBackends}
                        showSecretsDetail={showSecretsDetail}
                        setShowSecretsDetail={setShowSecretsDetail}
                        onResetDefaults={handleResetDefaults}
                        onPurgeData={handlePurgeData}
                    />
                );
            case 'llmKeys':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <h3 style={{ margin: 0, fontWeight: 800 }}>LLM Keys</h3>
                        <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>Manage API keys for all providers. Keys are stored encrypted via KeyVault + Dexie apiKeys. Use the Providers panel for health checks and model discovery.</p>
                        <div style={{ display: 'flex', gap: 8 }}><a href="#/providers" style={{ padding: '8px 14px', borderRadius: 8, background: '#3b82f6', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: 12 }}>Open Providers</a></div>
                    </div>
                );
            case 'platform':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <h3 style={{ margin: 0, fontWeight: 800 }}>Platform</h3>
                        <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>Global platform defaults: default model, theme, locale, retention. Persisted in settingsService (KV/Dexie).</p>
                        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>Platform budget via <code>agems-budget-service</code> · org-wide limits hourly/daily/monthly</div>
                    </div>
                );
            case 'aiModules':
                return <AiModulesTab />;
            case 'systemPrompts':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <h3 style={{ margin: 0, fontWeight: 800 }}>System Prompts</h3>
                        <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>Edit global system prompts and per-agent prompts. Stored in ISNode.config.prompt / agentSystemPrompt.</p>
                        <textarea placeholder="Global system prompt…" rows={6} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 12 }} />
                    </div>
                );
            case 'n8n':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <h3 style={{ margin: 0, fontWeight: 800 }}>N8N</h3>
                        <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>N8N API URL + key for workflow triggers. Stored per-agent in RuntimeConfig.n8nApiUrl/n8nApiKey.</p>
                        <div style={{ display: 'flex', gap: 8 }}><input placeholder="https://n8n.example.com/api/v1" style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', fontSize: 12 }} /><input placeholder="API Key" type="password" style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', fontSize: 12 }} /></div>
                    </div>
                );
            case 'system':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <h3 style={{ margin: 0, fontWeight: 800 }}>System</h3>
                        <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>Build: {CONFIG.buildId} · Version v{APP_VERSION} · Kernel ready</p>
                        <div style={{ display: 'flex', gap: 8 }}><button onClick={handleResetDefaults} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Reset Defaults</button><button onClick={handlePurgeData} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#fca5a5', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Purge All Data</button></div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                height: '100%',
                overflowY: 'auto',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
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
                        }}
                    >
                        <Sliders size={28} color="#3b82f6" aria-hidden="true" /> {t('nav.settings')}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                        {t('settings.general')}
                    </p>
                </div>
            </div>

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
                            type="button"
                            onClick={() => setError(null)}
                            style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                color: '#fca5a5',
                                cursor: 'pointer',
                            }}
                            aria-label={t('common.aria.dismiss_error')}
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                style={{
                    display: 'flex',
                    gap: '2rem',
                    height: '100%',
                    minHeight: 0,
                    flexWrap: 'wrap',
                }}
            >
                <div
                    style={{
                        width: 260,
                        maxWidth: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        flexShrink: 0,
                    }}
                    role="tablist"
                    aria-label="Settings categories"
                >
                    <input
                        type="search"
                        placeholder={t('settings.search_placeholder') || 'Search settings...'}
                        value={settingsSearch}
                        onChange={(e) => setSettingsSearch(e.target.value)}
                        style={{
                            padding: '0.6rem 0.75rem',
                            borderRadius: 10,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'var(--slate-200)',
                            fontSize: '0.8rem',
                            outline: 'none',
                            marginBottom: '0.5rem',
                            width: '100%',
                            boxSizing: 'border-box',
                        }}
                        aria-label={t('common.aria.search')}
                    />
                    {(
                        [
                            {
                                id: 'general',
                                label: t('settings.general'),
                                icon: <Settings size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'writing',
                                label: t('settings.interaction'),
                                icon: <MessageSquare size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'reading',
                                label: t('nav.routing_ai'),
                                icon: <Cpu size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'alerts',
                                label: t('settings.tab.alerts'),
                                icon: <Bell size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'notifications',
                                label: t('settings.notifications'),
                                icon: <Bell size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'appearance',
                                label: 'Design Tokens LIVE',
                                icon: <Palette size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'prompts',
                                label: t('settings.tab.prompts'),
                                icon: <BookText size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'advanced',
                                label: t('settings.security'),
                                icon: <Lock size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'llmKeys',
                                label: 'LLM Keys',
                                icon: <Key size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'platform',
                                label: 'Platform',
                                icon: <Globe size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'aiModules',
                                label: 'AI Modules',
                                icon: <Brain size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'systemPrompts',
                                label: 'System Prompts',
                                icon: <FileText size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'n8n',
                                label: 'N8N',
                                icon: <Network size={18} aria-hidden="true" />,
                            },
                            {
                                id: 'system',
                                label: 'System',
                                icon: <HardDrive size={18} aria-hidden="true" />,
                            },
                        ] as const
                    )
                        .filter(
                            (tab) =>
                                !settingsSearch ||
                                tab.label.toLowerCase().includes(settingsSearch.toLowerCase()),
                        )
                        .map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                aria-controls={`settings-tab-${tab.id}`}
                                style={{
                                    background:
                                        activeTab === tab.id
                                            ? 'rgba(59,130,246,0.1)'
                                            : 'transparent',
                                    border: '1px solid',
                                    borderColor:
                                        activeTab === tab.id
                                            ? 'rgba(59,130,246,0.2)'
                                            : 'transparent',
                                    padding: '0.8rem 1rem',
                                    cursor: 'pointer',
                                    borderRadius: 12,
                                    color: activeTab === tab.id ? '#3b82f6' : 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                    fontWeight: activeTab === tab.id ? 700 : 600,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    textAlign: 'left',
                                }}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}

                    <div
                        style={{
                            marginTop: 'auto',
                            padding: '1.5rem',
                            background: 'rgba(59,130,246,0.05)',
                            borderRadius: 16,
                            border: '1px solid rgba(59,130,246,0.1)',
                        }}
                    >
                        <h4
                            style={{
                                margin: '0 0 0.5rem',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'var(--slate-50)',
                            }}
                        >
                            <Info size={16} color="#3b82f6" aria-hidden="true" />{' '}
                            {t('settings.telemetry')}
                        </h4>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.4rem',
                                fontSize: '0.75rem',
                                color: 'var(--slate-400)',
                            }}
                        >
                            <div style={flexJustifyBetween}>
                                <span>{t('settings.version_label')}</span>{' '}
                                <span
                                    style={{
                                        color: 'var(--slate-200)',
                                        fontWeight: 600,
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    v{APP_VERSION}
                                </span>
                            </div>
                            <div style={flexJustifyBetween}>
                                <span>{t('settings.build_id')}</span>{' '}
                                <span
                                    style={{
                                        color: 'var(--slate-200)',
                                        fontWeight: 600,
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {CONFIG.buildId}
                                </span>
                            </div>
                            <div style={flexJustifyBetween}>
                                <span>{t('settings.kernel_label')}</span>{' '}
                                <span
                                    style={{
                                        color: canonicalHealthColor('ready'),
                                        fontWeight: 700,
                                    }}
                                >
                                    {canonicalHealthLabel('ready')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        paddingRight: '1rem',
                        paddingBottom: '2rem',
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            role="tabpanel"
                            id={`settings-tab-${activeTab}`}
                            aria-labelledby={`settings-tab-${activeTab}`}
                        >
                            {renderTab()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            <ModuleInfo moduleKey="settings" />
            <ConfirmDialog />
        </div>
    );
};

export default SettingsPanel;
