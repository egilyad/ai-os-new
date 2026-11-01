import React, { useCallback, useEffect, useState } from 'react';
import { Store, Download, Check } from 'lucide-react';
import { pluginRegistry, pluginLoader } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import { PLUGIN_MARKETPLACE_CATALOG } from '../../kernel/services/plugins/plugin-marketplace-catalog';
import ModuleInfo from '../ModuleInfo';

const PluginMarketplacePanel: React.FC = () => {
    const { t } = useTranslation();
    const [installed, setInstalled] = useState<Set<string>>(new Set());
    const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

    const refresh = useCallback(() => {
        setInstalled(new Set(pluginRegistry.list().map((p) => p.manifest.id)));
    }, []);

    useEffect(() => {
        refresh();
         
    }, [refresh]);

    const install = async (id: string) => {
        const entry = PLUGIN_MARKETPLACE_CATALOG.find((e) => e.manifest.id === id);
        if (!entry) return;
        try {
            const ok = await pluginLoader.load(entry.manifest);
            setMessage({
                kind: ok ? 'ok' : 'err',
                text: ok ? t('plugin.marketplace_installed') : t('plugin.load_failed'),
            });
            refresh();
        } catch (e) {
            setMessage({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
            refresh();
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: 900 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Store size={18} color="#a855f7" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-100)' }}>
                    {t('plugin.marketplace_title')}
                </h2>
                <ModuleInfo moduleKey="plugins" />
            </div>

            {message && (
                <div
                    style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        marginBottom: 12,
                        fontSize: 12,
                        background:
                            message.kind === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: message.kind === 'ok' ? '#10b981' : '#ef4444',
                    }}
                >
                    {message.text}
                </div>
            )}

            {PLUGIN_MARKETPLACE_CATALOG.map((entry) => {
                const isInstalled = installed.has(entry.manifest.id);
                return (
                    <div
                        key={entry.manifest.id}
                        style={{
                            padding: '14px 16px',
                            borderRadius: 8,
                            marginBottom: 8,
                            background: 'var(--slate-900)',
                            border: '1px solid rgba(255,255,255,0.04)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 4,
                            }}
                        >
                            <span
                                style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-200)' }}
                            >
                                {entry.manifest.name}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>
                                v{entry.manifest.version}
                            </span>
                            {entry.category && (
                                <span style={{ fontSize: 10, color: '#a855f7' }}>
                                    {entry.category}
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--slate-500)', marginBottom: 4 }}>
                            {entry.blurb ?? entry.manifest.description}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--slate-600)', marginBottom: 8 }}>
                            {t('plugin.tools')}:{' '}
                            {(entry.manifest.contributes.tools ?? [])
                                .map((x) => x.name)
                                .join(', ') || '—'}
                        </div>
                        {isInstalled ? (
                            <span
                                style={{
                                    fontSize: 11,
                                    color: '#10b981',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <Check size={13} /> {t('plugin.installed')}
                            </span>
                        ) : (
                            <button onClick={() => install(entry.manifest.id)} style={buttonStyle}>
                                <Download size={13} /> {t('plugin.install')}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 6,
    background: 'var(--slate-800)',
    color: 'var(--slate-200)',
    border: '1px solid rgba(255,255,255,0.06)',
    fontSize: 12,
    cursor: 'pointer',
};

export default PluginMarketplacePanel;
