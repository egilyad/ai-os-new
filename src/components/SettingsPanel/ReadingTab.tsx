import { Cpu, AlertCircle, Activity, Shield, Sliders, AlertTriangle } from 'lucide-react';
import type { SystemSettings } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import {
    detailsContainer,
    detailsSummary,
    sectionTitleLarge,
    textSecondary,
} from '../../styles/common';
import { SettingRow, Toggle } from './settings-shared';

interface ReadingTabProps {
    settings: SystemSettings;
    updateSetting: (key: keyof SystemSettings, val: boolean | string | number) => void;
}

const ReadingTab: React.FC<ReadingTabProps> = ({ settings, updateSetting }) => {
    const { t } = useTranslation();

    return (
        <>
            <div style={sectionTitleLarge}>{t('nav.routing_ai')}</div>
            <SettingRow
                icon={<Cpu size={20} aria-hidden="true" />}
                title={t('settings.router_title')}
                description={t('settings.router_desc')}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        value={Math.round(settings.explorationFactor * 100)}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10) / 100;
                            updateSetting('explorationFactor', val);
                        }}
                        style={{ width: 140, accentColor: '#3b82f6', cursor: 'pointer' }}
                        aria-label={t('settings.exploration_aria')}
                    />
                    <span
                        style={{
                            fontSize: '0.8rem',
                            color: 'var(--accent)',
                            fontWeight: 800,
                            width: 80,
                            textAlign: 'right',
                            textTransform: 'uppercase',
                        }}
                    >
                        {settings.explorationFactor < 0.05
                            ? t('settings.exploration_greedy')
                            : settings.explorationFactor > 0.3
                              ? t('settings.exploration_explore')
                              : t('settings.exploration_balanced')}
                    </span>
                </div>
            </SettingRow>
            <SettingRow
                icon={<AlertCircle size={20} aria-hidden="true" />}
                title={t('settings.fallback')}
                description={t('settings.fallback_desc')}
            >
                <Toggle
                    checked={settings.fallbackEnabled}
                    onChange={(v) => updateSetting('fallbackEnabled', v)}
                />
            </SettingRow>
            <SettingRow
                icon={<Activity size={20} aria-hidden="true" />}
                title={t('settings.auto_health')}
                description={t('settings.auto_health_desc')}
            >
                <Toggle
                    checked={settings.autoHealthCheck}
                    onChange={(v) => updateSetting('autoHealthCheck', v)}
                    accent="#10b981"
                />
            </SettingRow>
            <details style={detailsContainer}>
                <summary style={detailsSummary}>
                    <Shield size={16} color="#3b82f6" /> {t('settings.fallback_chains')}
                </summary>
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    {Object.entries(settings.fallbackChains || {}).map(([strategy, chain]) => (
                        <div
                            key={strategy}
                            style={{
                                marginBottom: '1rem',
                                padding: '0.75rem',
                                borderRadius: 8,
                                background: 'rgba(0,0,0,0.2)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'var(--slate-400)',
                                    marginBottom: '0.5rem',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {strategy}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {(chain as Array<{ provider: string; model?: string }>).map(
                                    (link, i) => (
                                        <span
                                            key={`${link.provider}-${link.model ?? i}`}
                                            style={{
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: 6,
                                                background: 'var(--accent-tint)',
                                                border: '1px solid rgba(59,130,246,0.2)',
                                                color: '#93c5fd',
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            {link.provider}
                                            {link.model ? ` / ${link.model}` : ''}
                                        </span>
                                    ),
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </details>
            <details style={detailsContainer}>
                <summary style={detailsSummary}>
                    <Sliders size={16} color="#a855f7" /> {t('settings.model_downgrade')}
                </summary>
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    {Object.entries(settings.modelDowngradeChains || {}).map(([model, chain]) => (
                        <div
                            key={model}
                            style={{
                                marginBottom: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: 'var(--slate-200)',
                                    minWidth: 120,
                                }}
                            >
                                {model}
                            </span>
                            <span style={textSecondary}>→</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                {(Array.isArray(chain) ? chain : []).map((m, _i) => (
                                    <span
                                        key={m as string}
                                        style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 5,
                                            background: 'var(--purple-tint)',
                                            border: '1px solid rgba(168,85,247,0.2)',
                                            color: '#d8b4fe',
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        {m as string}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </details>
            <div
                style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    borderRadius: 16,
                    border: '1px solid rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.05)',
                }}
            >
                <div
                    style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--error)',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <AlertTriangle size={16} /> {t('settings.system')}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginBottom: '1rem' }}>
                    {t('settings.restart_desc')}
                </div>
                <button
                    type="button"
                    onClick={() => {
                        window.location.hash = '#restart';
                        window.location.reload();
                    }}
                    style={{
                        padding: '0.6rem 1.25rem',
                        borderRadius: 8,
                        border: '1px solid rgba(239,68,68,0.4)',
                        background: 'rgba(239,68,68,0.15)',
                        color: '#fca5a5',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                    }}
                    aria-label={t('settings.restart_aria')}
                >
                    {t('settings.restart_button')}
                </button>
            </div>
        </>
    );
};

export default ReadingTab;
