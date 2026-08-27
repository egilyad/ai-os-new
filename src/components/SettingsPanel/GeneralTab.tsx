import {
    Moon,
    Globe,
    Bell,
    Activity,
    HardDrive,
    Zap,
    MessageSquare,
    Sliders,
    Waves,
    Shield,
    RefreshCw,
    Database,
    Circle,
    FlaskConical,
} from 'lucide-react';
import { CONFIG } from '../../kernel/instances';
import { setFeatureFlag } from '../../kernel/services/config-mutations';
import { settingsService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('GeneralTab');
import type { SystemSettings } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import { safeClone } from '../../shared/utils/safe-json';
import {
    detailsContainer,
    detailsSummary,
    sectionTitleLarge,
    settingSelect,
} from '../../styles/common';
import { SettingRow, Toggle } from './settings-shared';

interface GeneralTabProps {
    settings: SystemSettings;
    featureFlags: Record<string, boolean>;
    updateSetting: (key: keyof SystemSettings, val: boolean | string | number) => void;
    setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
    setFeatureFlags: (flags: Record<string, boolean>) => void;
}

const GeneralTab: React.FC<GeneralTabProps> = ({
    settings,
    featureFlags,
    updateSetting,
    setSettings,
    setFeatureFlags,
}) => {
    const { t } = useTranslation();

    return (
        <>
            <div style={sectionTitleLarge}>{t('settings.general')}</div>
            <SettingRow
                icon={<Moon size={20} aria-hidden="true" />}
                title={t('settings.interface_theme')}
                description={t('settings.theme_desc')}
            >
                <select
                    value={settings.theme}
                    onChange={(e) => updateSetting('theme', e.target.value)}
                    style={settingSelect}
                    aria-label={t('settings.interface_theme')}
                >
                    <option value="dark">{t('settings.theme_dark')}</option>
                    <option value="light">{t('settings.theme_light')}</option>
                    <option value="cyberpunk">{t('settings.theme_cyberpunk')}</option>
                    <option value="nature">{t('settings.theme_nature')}</option>
                    <option value="ocean">{t('settings.theme_ocean')}</option>
                    <option value="sunset">{t('settings.theme_sunset')}</option>
                    <option value="high-contrast">{t('settings.theme_high-contrast')}</option>
                </select>
            </SettingRow>
            <SettingRow
                icon={<Activity size={20} aria-hidden="true" />}
                title={t('settings.high_contrast')}
                description={t('settings.high_contrast_desc')}
            >
                <Toggle
                    checked={settings.themeConfig?.highContrast ?? false}
                    onChange={(v) => {
                        try {
                            const next = { ...settings.themeConfig, highContrast: v };
                            setSettings((prev) => ({ ...prev, themeConfig: next }));
                            settingsService.updateSettings({ themeConfig: next });
                        } catch (e) {
                            LOGGER.warn('Failed to update highContrast', e as string);
                        }
                    }}
                    accent="#f97316"
                />
            </SettingRow>
            <SettingRow
                icon={<Globe size={20} aria-hidden="true" />}
                title={t('settings.language')}
                description={t('settings.language_desc')}
            >
                <select
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value)}
                    style={settingSelect}
                    aria-label={t('settings.language')}
                >
                    <option value="en">{t('settings.lang_en')}</option>
                    <option value="ru">{t('settings.lang_ru')}</option>
                </select>
            </SettingRow>
            <SettingRow
                icon={<Bell size={20} aria-hidden="true" />}
                title={t('settings.notifications')}
                description={t('settings.notifications_desc')}
            >
                <Toggle
                    checked={settings.notifications}
                    onChange={(v) => updateSetting('notifications', v)}
                />
            </SettingRow>
            <SettingRow
                icon={<Shield size={20} aria-hidden="true" />}
                title={t('settings.telemetry_enabled')}
                description={t('settings.telemetry_enabled_desc')}
            >
                <Toggle
                    checked={settings.telemetryEnabled}
                    onChange={(v) => updateSetting('telemetryEnabled', v)}
                />
            </SettingRow>
            <SettingRow
                icon={<RefreshCw size={20} aria-hidden="true" />}
                title={t('settings.auto_update_check')}
                description={t('settings.auto_update_check_desc')}
            >
                <Toggle
                    checked={settings.autoUpdateCheck}
                    onChange={(v) => updateSetting('autoUpdateCheck', v)}
                />
            </SettingRow>
            <details style={{ ...detailsContainer, marginTop: '0.5rem' }}>
                <summary style={detailsSummary}>
                    <Database size={16} color="#3b82f6" /> {t('settings.data_management')}
                </summary>
                <div
                    style={{
                        padding: '0 1.5rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                    }}
                >
                    <SettingRow
                        icon={<Circle size={16} fill="#3b82f6" color="#3b82f6" />}
                        title={t('settings.auto_save_interval')}
                        description={t('settings.auto_save_interval_desc')}
                    >
                        <select
                            value={settings.dataManagement.autoSaveInterval}
                            onChange={(e) => {
                                try {
                                    const next = {
                                        ...settings.dataManagement,
                                        autoSaveInterval: Number(e.target.value),
                                    };
                                    setSettings((prev) => ({
                                        ...prev,
                                        dataManagement: next,
                                    }));
                                    settingsService.updateSettings({ dataManagement: next });
                                } catch (e) {
                                    LOGGER.warn('Failed to update autoSaveInterval', e as string);
                                }
                            }}
                            style={settingSelect}
                            aria-label={t('settings.auto_save_interval')}
                        >
                            <option value={5000}>5s</option>
                            <option value={15000}>15s</option>
                            <option value={30000}>30s</option>
                            <option value={60000}>60s</option>
                        </select>
                    </SettingRow>
                    <SettingRow
                        icon={<Circle size={16} fill="#3b82f6" color="#3b82f6" />}
                        title={t('settings.max_history_entries')}
                        description={t('settings.max_history_entries_desc')}
                    >
                        <select
                            value={settings.dataManagement.maxHistoryEntries}
                            onChange={(e) => {
                                try {
                                    const next = {
                                        ...settings.dataManagement,
                                        maxHistoryEntries: Number(e.target.value),
                                    };
                                    setSettings((prev) => ({
                                        ...prev,
                                        dataManagement: next,
                                    }));
                                    settingsService.updateSettings({ dataManagement: next });
                                } catch (e) {
                                    LOGGER.warn('Failed to update maxHistoryEntries', e as string);
                                }
                            }}
                            style={settingSelect}
                            aria-label={t('settings.max_history_entries')}
                        >
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                            <option value={5000}>5000</option>
                        </select>
                    </SettingRow>
                    <SettingRow
                        icon={<Circle size={16} fill="#3b82f6" color="#3b82f6" />}
                        title={t('settings.max_trace_entries')}
                        description={t('settings.max_trace_entries_desc')}
                    >
                        <select
                            value={settings.dataManagement.maxTraceEntries}
                            onChange={(e) => {
                                try {
                                    const next = {
                                        ...settings.dataManagement,
                                        maxTraceEntries: Number(e.target.value),
                                    };
                                    setSettings((prev) => ({
                                        ...prev,
                                        dataManagement: next,
                                    }));
                                    settingsService.updateSettings({ dataManagement: next });
                                } catch (e) {
                                    LOGGER.warn('Failed to update maxTraceEntries', e as string);
                                }
                            }}
                            style={settingSelect}
                            aria-label={t('settings.max_trace_entries')}
                        >
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                            <option value={5000}>5000</option>
                        </select>
                    </SettingRow>
                    <SettingRow
                        icon={<Circle size={16} fill="#3b82f6" color="#3b82f6" />}
                        title={t('settings.prune_memories_days')}
                        description={t('settings.prune_memories_days_desc')}
                    >
                        <select
                            value={settings.dataManagement.pruneMemoriesAfterDays}
                            onChange={(e) => {
                                try {
                                    const next = {
                                        ...settings.dataManagement,
                                        pruneMemoriesAfterDays: Number(e.target.value),
                                    };
                                    setSettings((prev) => ({
                                        ...prev,
                                        dataManagement: next,
                                    }));
                                    settingsService.updateSettings({ dataManagement: next });
                                } catch (e) {
                                    LOGGER.warn(
                                        'Failed to update pruneMemoriesAfterDays',
                                        e as string,
                                    );
                                }
                            }}
                            style={settingSelect}
                            aria-label={t('settings.prune_memories_days')}
                        >
                            <option value={7}>7</option>
                            <option value={14}>14</option>
                            <option value={30}>30</option>
                            <option value={60}>60</option>
                            <option value={90}>90</option>
                        </select>
                    </SettingRow>
                    <SettingRow
                        icon={<Circle size={16} fill="#3b82f6" color="#3b82f6" />}
                        title={t('settings.export_on_shutdown')}
                        description={t('settings.export_on_shutdown_desc')}
                    >
                        <Toggle
                            checked={settings.dataManagement.exportOnShutdown}
                            onChange={(v) => {
                                try {
                                    const next = {
                                        ...settings.dataManagement,
                                        exportOnShutdown: v,
                                    };
                                    setSettings((prev) => ({
                                        ...prev,
                                        dataManagement: next,
                                    }));
                                    settingsService.updateSettings({ dataManagement: next });
                                } catch (e) {
                                    LOGGER.warn('Failed to update exportOnShutdown', e as string);
                                }
                            }}
                            accent="#3b82f6"
                        />
                    </SettingRow>
                </div>
            </details>

            <details style={detailsContainer}>
                <summary style={detailsSummary}>
                    <Sliders size={16} color="#10b981" /> {t('settings.feature_flags')}
                </summary>
                <div
                    style={{
                        padding: '0 1.5rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                    }}
                >
                    <SettingRow
                        icon={<HardDrive size={20} aria-hidden="true" />}
                        title={t('settings.memory_system')}
                        description={t('settings.memory_system_desc')}
                    >
                        <Toggle
                            checked={featureFlags['memory.enabled'] ?? true}
                            onChange={(v) => {
                                setFeatureFlag('memory.enabled', v);
                                setFeatureFlags(
                                    safeClone(CONFIG.featureFlags) as unknown as Record<
                                        string,
                                        boolean
                                    >,
                                );
                            }}
                            accent="#10b981"
                        />
                    </SettingRow>
                    <SettingRow
                        icon={<Activity size={20} aria-hidden="true" />}
                        title={t('settings.semantic_search')}
                        description={t('settings.semantic_search_desc')}
                    >
                        <Toggle
                            checked={featureFlags['memory.semantic'] ?? true}
                            onChange={(v) => {
                                setFeatureFlag('memory.semantic', v);
                                setFeatureFlags(
                                    safeClone(CONFIG.featureFlags) as unknown as Record<
                                        string,
                                        boolean
                                    >,
                                );
                            }}
                            accent="#8b5cf6"
                        />
                    </SettingRow>
                    <SettingRow
                        icon={<Zap size={20} aria-hidden="true" />}
                        title={t('settings.rag_on_chat')}
                        description={t('settings.rag_on_chat_desc')}
                    >
                        <Toggle
                            checked={featureFlags['memory.ragOnChat'] ?? true}
                            onChange={(v) => {
                                setFeatureFlag('memory.ragOnChat', v);
                                setFeatureFlags(
                                    safeClone(CONFIG.featureFlags) as unknown as Record<
                                        string,
                                        boolean
                                    >,
                                );
                            }}
                            accent="#f59e0b"
                        />
                    </SettingRow>
                    <SettingRow
                        icon={<MessageSquare size={20} aria-hidden="true" />}
                        title={t('settings.auto_store_memory')}
                        description={t('settings.auto_store_memory_desc')}
                    >
                        <Toggle
                            checked={featureFlags['memory.autoStore'] ?? true}
                            onChange={(v) => {
                                setFeatureFlag('memory.autoStore', v);
                                setFeatureFlags(
                                    safeClone(CONFIG.featureFlags) as unknown as Record<
                                        string,
                                        boolean
                                    >,
                                );
                            }}
                            accent="#3b82f6"
                        />
                    </SettingRow>
                    <SettingRow
                        icon={<Activity size={20} aria-hidden="true" />}
                        title={t('settings.debate_runtime_engine')}
                        description={t('settings.debate_runtime_engine_desc')}
                    >
                        <Toggle
                            checked={featureFlags['debate.runtimeEngine'] ?? false}
                            onChange={(v) => {
                                setFeatureFlag('debate.runtimeEngine', v);
                                setFeatureFlags(
                                    safeClone(CONFIG.featureFlags) as unknown as Record<
                                        string,
                                        boolean
                                    >,
                                );
                            }}
                            accent="#ec4899"
                        />
                    </SettingRow>
                    <SettingRow
                        icon={<Waves size={20} aria-hidden="true" />}
                        title="Experimental visuals"
                        description="Show Aquarium and Hive in the sidebar (same metrics as Health)"
                    >
                        <Toggle
                            checked={featureFlags['ui.experimentalVisuals'] ?? false}
                            onChange={(v) => {
                                setFeatureFlag('ui.experimentalVisuals', v);
                                setFeatureFlags(
                                    safeClone(CONFIG.featureFlags) as unknown as Record<
                                        string,
                                        boolean
                                    >,
                                );
                            }}
                            accent="#06b6d4"
                        />
                    </SettingRow>
                    <SettingRow
                        icon={<FlaskConical size={20} aria-hidden="true" />}
                        title={t('settings.mock_services')}
                        description={t('settings.mock_services_desc')}
                    >
                        <Toggle
                            checked={featureFlags['mockServices.enabled'] ?? true}
                            onChange={(v) => {
                                setFeatureFlag('mockServices.enabled', v);
                                setFeatureFlags(
                                    safeClone(CONFIG.featureFlags) as unknown as Record<
                                        string,
                                        boolean
                                    >,
                                );
                            }}
                            accent="#f59e0b"
                        />
                    </SettingRow>
                </div>
            </details>
        </>
    );
};

export default GeneralTab;
