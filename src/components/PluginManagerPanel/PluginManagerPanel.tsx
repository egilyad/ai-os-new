import React, { useCallback, useEffect, useState } from 'react';
import { Plugin, Power, PowerOff, Trash2, Plus, RefreshCw } from 'lucide-react';
import { pluginRegistry, pluginLoader } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import type { PluginManifest, RegisteredPlugin } from '../../kernel/contracts/plugin';
import ModuleInfo from '../ModuleInfo';

const STATUS_COLOR: Record<string, string> = {
    active: '#10b981',
    inactive: '#64748b',
    error: '#ef4444',
};

const PluginManagerPanel: React.FC = () => {
    const { t } = useTranslation();
    const [plugins, setPlugins] = useState<RegisteredPlugin[]>([]);
    const [manifestText, setManifestText] = useState('');
    const [manifestOpen, setManifestOpen] = useState(false);
    const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

    const refresh = useCallback(() => {
        setPlugins([...pluginRegistry.list()]);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const run = async (fn: () => Promise<boolean> | boolean, okLabel: string) => {
        try {
            const ok = await fn();
            setMessage({ kind: ok ? 'ok' : 'err', text: ok ? okLabel : t('plugin.op_failed') });
            refresh();
        } catch (e) {
            setMessage({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
            refresh();
        }
    };

    const handleActivate = (id: string) =>
        run(() => pluginRegistry.activate(id), t('plugin.activated'));
    const handleDeactivate = (id: string) =>
        run(() => pluginRegistry.deactivate(id), t('plugin.deactivated'));
    const handleUnregister = (id: string) =>
        run(async () => {
            await pluginLoader.unload(id);
            return true;
        }, t('plugin.removed'));

    const handleLoadManifest = async () => {
        try {
            const manifest = JSON.parse(manifestText) as PluginManifest;
            const ok = await pluginLoader.load(manifest);
            setMessage({
                kind: ok ? 'ok' : 'err',
                text: ok ? t('plugin.loaded') : t('plugin.load_failed'),
            });
            setManifestOpen(false);
            setManifestText('');
            refresh();
        } catch (e) {
            setMessage({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: 900 }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Plugin size={18} color="#a855f7" />
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 700,
                            color: 'var(--slate-100)',
                        }}
                    >
                        {t('plugin.title')}
                    </h2>
                    <ModuleInfo moduleKey="plugins" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={refresh} style={buttonStyle} title={t('plugin.refresh')}>
                        <RefreshCw size={14} />
                    </button>
                    <button onClick={() => setManifestOpen((v) => !v)} style={buttonStyle}>
                        <Plus size={14} /> {t('plugin.load_manifest')}
                    </button>
                </div>
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

            {manifestOpen && (
                <div
                    style={{
                        marginBottom: 16,
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'var(--slate-900)',
                    }}
                >
                    <div style={{ fontSize: 12, color: 'var(--slate-400)', marginBottom: 8 }}>
                        {t('plugin.manifest_hint')}
                    </div>
                    <textarea
                        value={manifestText}
                        onChange={(e) => setManifestText(e.target.value)}
                        rows={6}
                        style={{
                            width: '100%',
                            background: 'var(--slate-950)',
                            color: 'var(--slate-200)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 6,
                            padding: 8,
                            fontFamily: 'monospace',
                            fontSize: 12,
                            resize: 'vertical',
                        }}
                        placeholder='{ "id": "acme.search", "name": "Search", ... }'
                    />
                    <button onClick={handleLoadManifest} style={{ ...primaryStyle, marginTop: 8 }}>
                        {t('plugin.load')}
                    </button>
                </div>
            )}

            {plugins.length === 0 ? (
                <div
                    style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: 'var(--slate-500)',
                        fontSize: 13,
                    }}
                >
                    {t('plugin.empty')}
                </div>
            ) : (
                plugins.map((p) => (
                    <div key={p.manifest.id} style={cardStyle}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 4,
                            }}
                        >
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    background: STATUS_COLOR[p.status],
                                }}
                            />
                            <span
                                style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-200)' }}
                            >
                                {p.manifest.name}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>
                                v{p.manifest.version}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>
                                {p.manifest.id}
                            </span>
                        </div>
                        {p.manifest.description && (
                            <div
                                style={{ fontSize: 11, color: 'var(--slate-500)', marginBottom: 4 }}
                            >
                                {p.manifest.description}
                            </div>
                        )}
                        {p.error && (
                            <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 4 }}>
                                {p.error}
                            </div>
                        )}
                        {(p.manifest.contributes.tools?.length ?? 0) > 0 && (
                            <div
                                style={{ fontSize: 10, color: 'var(--slate-500)', marginBottom: 2 }}
                            >
                                {t('plugin.tools')}:{' '}
                                {p.manifest.contributes.tools!.map((t) => t.name).join(', ')}
                            </div>
                        )}
                        {(p.manifest.contributes.subscriptions?.length ?? 0) > 0 && (
                            <div
                                style={{ fontSize: 10, color: 'var(--slate-500)', marginBottom: 2 }}
                            >
                                {t('plugin.events')}:{' '}
                                {p.manifest.contributes
                                    .subscriptions!.map((s) => s.event)
                                    .join(', ')}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            {p.status === 'error' ? (
                                <button
                                    onClick={() => handleActivate(p.manifest.id)}
                                    style={buttonStyle}
                                >
                                    {t('plugin.retry')}
                                </button>
                            ) : p.status === 'active' ? (
                                <button
                                    onClick={() => handleDeactivate(p.manifest.id)}
                                    style={buttonStyle}
                                >
                                    <PowerOff size={13} /> {t('plugin.deactivate')}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleActivate(p.manifest.id)}
                                    style={buttonStyle}
                                >
                                    <Power size={13} /> {t('plugin.activate')}
                                </button>
                            )}
                            <button
                                onClick={() => handleUnregister(p.manifest.id)}
                                style={{ ...buttonStyle, color: '#ef4444' }}
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                ))
            )}
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

const primaryStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#a855f7',
    color: '#fff',
    border: 'none',
};

const cardStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderRadius: 8,
    marginBottom: 8,
    background: 'var(--slate-900)',
    border: '1px solid rgba(255,255,255,0.04)',
};

export default PluginManagerPanel;
