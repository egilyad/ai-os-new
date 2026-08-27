import { Bell, Volume2, Activity, Route, Shield, Bot, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { SettingRow, Toggle } from './settings-shared';
import type { SystemSettings } from '../../kernel/instances';
import { sectionTitleLarge } from '../../styles/common';

interface NotificationsTabProps {
    settings: SystemSettings;
    updateSetting: <K extends keyof SystemSettings>(key: K, val: SystemSettings[K]) => void;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ settings, updateSetting }) => {
    const { t } = useTranslation();
    const prefs = settings.notificationPrefs || {
        enabled: true,
        healthAlerts: true,
        routingDecisions: false,
        policyViolations: true,
        agentEvents: false,
        errorsOnly: false,
        soundEnabled: true,
    };

    const updatePrefs = (patch: Partial<typeof prefs>) => {
        updateSetting('notificationPrefs', { ...prefs, ...patch });
    };

    return (
        <>
            <div style={sectionTitleLarge}>{t('settings.notifications')}</div>

            <SettingRow
                icon={<Bell size={20} />}
                title={t('settings.notifications')}
                description={t('settings.notifications_desc')}
                accent="#3b82f6"
            >
                <Toggle
                    checked={prefs.enabled}
                    onChange={(v) => updatePrefs({ enabled: v })}
                    accent="#3b82f6"
                />
            </SettingRow>

            {prefs.enabled && (
                <>
                    <SettingRow
                        icon={<Volume2 size={20} />}
                        title="Sound"
                        description="Play a sound when notifications arrive"
                        accent="#8b5cf6"
                    >
                        <Toggle
                            checked={prefs.soundEnabled}
                            onChange={(v) => updatePrefs({ soundEnabled: v })}
                            accent="#8b5cf6"
                        />
                    </SettingRow>

                    <div style={sectionTitleLarge}>Event Subscriptions</div>

                    <SettingRow
                        icon={<Activity size={20} />}
                        title="Health Alerts"
                        description="Provider health check failures and recovery"
                        accent="#10b981"
                    >
                        <Toggle
                            checked={prefs.healthAlerts}
                            onChange={(v) => updatePrefs({ healthAlerts: v })}
                            accent="#10b981"
                        />
                    </SettingRow>

                    <SettingRow
                        icon={<Route size={20} />}
                        title="Routing Decisions"
                        description="Provider routing changes and fallback activation"
                        accent="#f59e0b"
                    >
                        <Toggle
                            checked={prefs.routingDecisions}
                            onChange={(v) => updatePrefs({ routingDecisions: v })}
                            accent="#f59e0b"
                        />
                    </SettingRow>

                    <SettingRow
                        icon={<Shield size={20} />}
                        title="Policy Violations"
                        description="Security policy breaches and constraint violations"
                        accent="#ef4444"
                    >
                        <Toggle
                            checked={prefs.policyViolations}
                            onChange={(v) => updatePrefs({ policyViolations: v })}
                            accent="#ef4444"
                        />
                    </SettingRow>

                    <SettingRow
                        icon={<Bot size={20} />}
                        title="Agent Events"
                        description="Agent task completions, failures, and lifecycle changes"
                        accent="#8b5cf6"
                    >
                        <Toggle
                            checked={prefs.agentEvents}
                            onChange={(v) => updatePrefs({ agentEvents: v })}
                            accent="#8b5cf6"
                        />
                    </SettingRow>

                    <SettingRow
                        icon={<AlertTriangle size={20} />}
                        title="Errors Only"
                        description="Only show error-level notifications (suppresses info/warn)"
                        accent="#f97316"
                    >
                        <Toggle
                            checked={prefs.errorsOnly}
                            onChange={(v) => updatePrefs({ errorsOnly: v })}
                            accent="#f97316"
                        />
                    </SettingRow>
                </>
            )}
        </>
    );
};

export default NotificationsTab;
