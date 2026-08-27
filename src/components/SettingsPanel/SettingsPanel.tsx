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
