import { Shield, Key, Terminal, Settings, Database, Trash2 } from 'lucide-react';
import { externalSecretsService } from '../../kernel/instances';
import type { SystemSettings, BackendStatus } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import { flexBetween, textSecondary } from '../../styles/common';
import { ConfigInput, SettingRow, Toggle } from './settings-shared';
import { Button } from '../Common';
import type { RuntimeConfigForm } from './settings-shared';

interface AdvancedTabProps {
    settings: SystemSettings;
    updateSetting: (key: keyof SystemSettings, val: boolean | string | number) => void;
    configForm: RuntimeConfigForm | null;
    setConfigForm: React.Dispatch<React.SetStateAction<RuntimeConfigForm | null>>;
    onSaveConfig: () => void;
    secretsBackends: BackendStatus[];
    setSecretsBackends: (backends: BackendStatus[]) => void;
    showSecretsDetail: boolean;
    setShowSecretsDetail: React.Dispatch<React.SetStateAction<boolean>>;
    onResetDefaults: () => void;
    onPurgeData: () => void;
}

const AdvancedTab: React.FC<AdvancedTabProps> = ({
    settings,
    updateSetting,
    configForm,
    setConfigForm,
    onSaveConfig,
    secretsBackends,
    setSecretsBackends,
    showSecretsDetail,
    setShowSecretsDetail,
    onResetDefaults,
    onPurgeData,
}) => {
    const { t } = useTranslation();

    return (
        <>
            <div
                style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--slate-50)',
                    marginBottom: '0.5rem',
                }}
            >
                {t('settings.security')}
            </div>

            <details style={{ marginBottom: '1.5rem' }}>
                <summary
                    style={{
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#60a5fa',
                        padding: '0.5rem 0',
                        userSelect: 'none',
                    }}
                >
                    {t('settings.runtime_config')}
                </summary>
                {configForm && (
                    <div
                        style={{
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: 12,
                            marginTop: '0.5rem',
                            fontSize: '0.8rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                        }}
                    >
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--warning)' }}>
                            {t('settings.monitoring')}
                        </div>
                        <ConfigInput
                            label={t('settings.health_stale_interval')}
                            value={configForm.healthCheckStaleIntervalMs}
                            onChange={(v) =>
                                setConfigForm((f) =>
                                    f ? { ...f, healthCheckStaleIntervalMs: v } : f,
                                )
                            }
                            min={1000}
                            max={3600000}
                            defaultValue={30000}
                        />
                        <ConfigInput
                            label={t('settings.latency_penalty_threshold')}
                            value={configForm.latencyPenaltyThresholdMs}
                            onChange={(v) =>
                                setConfigForm((f) =>
                                    f ? { ...f, latencyPenaltyThresholdMs: v } : f,
                                )
                            }
                            min={0}
                            max={60000}
                            defaultValue={1000}
                        />
                        <ConfigInput
                            label={t('settings.error_rate_penalty')}
                            value={configForm.errorRatePenaltyThreshold}
                            onChange={(v) =>
                                setConfigForm((f) =>
                                    f ? { ...f, errorRatePenaltyThreshold: v } : f,
                                )
                            }
                            step="0.01"
                            min={0}
                            max={1}
                            defaultValue={0.1}
                        />
                        <ConfigInput
                            label={t('settings.success_rate_penalty')}
                            value={configForm.successRatePenaltyFloor}
                            onChange={(v) =>
                                setConfigForm((f) => (f ? { ...f, successRatePenaltyFloor: v } : f))
                            }
                            step="0.01"
                            min={0}
                            max={1}
                            defaultValue={0.5}
                        />
                        <ConfigInput
                            label={t('settings.alert_penalty')}
                            value={configForm.alertPenaltyPerAlert}
                            onChange={(v) =>
                                setConfigForm((f) => (f ? { ...f, alertPenaltyPerAlert: v } : f))
                            }
                            min={0}
                            max={100}
                            defaultValue={5}
                        />
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a855f7' }}>
                            {t('settings.metrics')}
                        </div>
                        <ConfigInput
                            label={t('settings.history_limit')}
                            value={configForm.metricsHistoryLimit}
                            onChange={(v) =>
                                setConfigForm((f) => (f ? { ...f, metricsHistoryLimit: v } : f))
                            }
                            min={10}
                            max={100000}
                            defaultValue={100}
                        />
                        <ConfigInput
                            label={t('settings.collection_interval')}
                            value={configForm.metricsInterval}
                            onChange={(v) =>
                                setConfigForm((f) => (f ? { ...f, metricsInterval: v } : f))
                            }
                            min={1000}
                            max={3600000}
                            defaultValue={60000}
                        />
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                            {t('settings.traces_label')}
                        </div>
                        <ConfigInput
                            label={t('settings.max_entries')}
                            value={configForm.tracesMaxEntries}
                            onChange={(v) =>
                                setConfigForm((f) => (f ? { ...f, tracesMaxEntries: v } : f))
                            }
                            min={10}
                            max={100000}
                            defaultValue={1000}
                        />
                        <ConfigInput
                            label={t('settings.db_load_limit')}
                            value={configForm.tracesDbLoadLimit}
                            onChange={(v) =>
                                setConfigForm((f) => (f ? { ...f, tracesDbLoadLimit: v } : f))
                            }
                            min={1}
                            max={10000}
                            defaultValue={100}
                        />
                        <ConfigInput
                            label={t('settings.token_estimate_divisor')}
                            value={configForm.tracesTokenEstimateDivisor}
                            onChange={(v) =>
                                setConfigForm((f) =>
                                    f ? { ...f, tracesTokenEstimateDivisor: v } : f,
                                )
                            }
                            min={1}
                            max={10000}
                            defaultValue={1000}
                        />
                        <button
                            type="button"
                            onClick={onSaveConfig}
                            style={{
                                alignSelf: 'flex-end',
                                padding: '0.6rem 1.5rem',
                                borderRadius: 8,
                                background: 'var(--success)',
                                border: 'none',
                                color: 'white',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                            }}
                        >
                            {t('settings.save_config')}
                        </button>
                    </div>
                )}
            </details>

            <SettingRow
                icon={<Key size={20} aria-hidden="true" />}
                accent="#8b5cf6"
                title={t('settings.secrets_backends')}
                description={t('settings.secrets_backends_desc', {
                    backend:
                        secretsBackends.find((b) => b.active)?.label || t('common.not_available'),
                })}
            >
                <button
                    type="button"
                    onClick={() => setShowSecretsDetail((v) => !v)}
                    style={{
                        color: 'var(--purple)',
                        borderColor: 'rgba(139,92,246,0.3)',
                        padding: '0.4rem 1rem',
                        borderRadius: 8,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: showSecretsDetail
                            ? 'rgba(139,92,246,0.15)'
                            : 'rgba(139,92,246,0.05)',
                        border: '1px solid rgba(139,92,246,0.3)',
                        cursor: 'pointer',
                    }}
                >
                    {showSecretsDetail ? t('settings.hide') : t('settings.manage')}
                </button>
            </SettingRow>
            {showSecretsDetail && (
                <div
                    style={{
                        marginTop: '-0.5rem',
                        marginBottom: '1rem',
                        marginLeft: '3rem',
                        padding: '0.75rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 10,
                        fontSize: '0.78rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                    }}
                >
                    {secretsBackends.length === 0 && (
                        <span style={textSecondary}>{t('settings.no_backends')}</span>
                    )}
                    {secretsBackends.map((b) => (
                        <div key={b.type} style={flexBetween}>
                            <div>
                                <span style={{ fontWeight: 600, color: 'var(--slate-200)' }}>{b.label}</span>
                                <span style={{ marginLeft: '0.5rem', color: 'var(--slate-500)' }}>
                                    ({b.type})
                                </span>
                                <span
                                    style={{
                                        marginLeft: '0.5rem',
                                        color: b.healthy ? '#10b981' : '#ef4444',
                                    }}
                                >
                                    {b.healthy ? '\u2713' : '\u2717'}
                                </span>
                            </div>
                            {!b.active && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await externalSecretsService.activateBackend(b.type, {
                                            type: b.type,
                                            label: b.label,
                                        });
                                        setSecretsBackends(
                                            await externalSecretsService.getStatus(),
                                        );
                                    }}
                                    style={{
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: 6,
                                        background: 'var(--purple)',
                                        border: 'none',
                                        color: 'white',
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                    }}
                                >
                                    {t('settings.activate')}
                                </button>
                            )}
                            {b.active && (
                                <span
                                    style={{
                                        color: 'var(--purple)',
                                        fontWeight: 700,
                                        fontSize: '0.7rem',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {t('common.active')}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <SettingRow
                icon={<Terminal size={20} aria-hidden="true" />}
                accent="#a855f7"
                title={t('settings.debug')}
                description={t('settings.debug_desc')}
            >
                <Toggle
                    checked={settings.debugMode}
                    onChange={(v) => updateSetting('debugMode', v)}
                    accent="#a855f7"
                />
            </SettingRow>
            <SettingRow
                icon={<Shield size={20} aria-hidden="true" />}
                accent="#f59e0b"
                title={t('settings.telemetry_enabled')}
                description={t('settings.telemetry_enabled_desc')}
            >
                <Toggle
                    checked={settings.telemetryEnabled}
                    onChange={(v) => updateSetting('telemetryEnabled', v)}
                    accent="#f59e0b"
                />
            </SettingRow>
            <SettingRow
                icon={<Settings size={20} aria-hidden="true" />}
                accent="#3b82f6"
                title={t('settings.auto_update_check')}
                description={t('settings.auto_update_check_desc')}
            >
                <Toggle
                    checked={settings.autoUpdateCheck}
                    onChange={(v) => updateSetting('autoUpdateCheck', v)}
                    accent="#3b82f6"
                />
            </SettingRow>
            <SettingRow
                icon={<Settings size={20} aria-hidden="true" />}
                accent="#f59e0b"
                title={t('settings.reset_title')}
                description={t('settings.reset_desc')}
            >
                <Button
                    variant="warning"
                    onClick={onResetDefaults}
                    aria-label={t('settings.reset_aria')}
                >
                    {t('settings.reset_button')}
                </Button>
            </SettingRow>
            <SettingRow
                icon={<Database size={20} aria-hidden="true" />}
                accent="#ef4444"
                title={t('settings.factory_reset')}
                description={t('settings.factory_reset_desc')}
            >
                <Button
                    variant="danger"
                    onClick={onPurgeData}
                    aria-label={t('settings.factory_aria')}
                >
                    <Trash2 size={16} aria-hidden="true" /> {t('settings.factory_button')}
                </Button>
            </SettingRow>
        </>
    );
};

export default AdvancedTab;
