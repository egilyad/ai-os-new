import React, { useState } from 'react';
import { Puzzle, Power, PowerOff, Trash2, Download } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { pluginSdkService } from '../kernel/instances';
import type { PluginInstance, PluginManifest, PluginType } from '../kernel/contracts/plugin-sdk';

const TYPE_COLORS: Record<PluginType, string> = {
    tool: '#3b82f6',
    provider: '#10b981',
    decorator: '#a855f7',
    adapter: '#f59e0b',
    theme: '#ec4899',
    panel: '#8b5cf6',
};

const PluginSdkPanelContent: React.FC = () => {
    const [installed, setInstalled] = useState(() => pluginSdkService.getInstalledPlugins());
    const [available, setAvailable] = useState(() => pluginSdkService.getAvailablePlugins());
    const [configId, setConfigId] = useState<string | null>(null);
    const [configEdit, setConfigEdit] = useState('');

    const refresh = () => {
        setInstalled([...pluginSdkService.getInstalledPlugins()]);
        setAvailable([...pluginSdkService.getAvailablePlugins()]);
    };

    const handleInstall = (m: PluginManifest) => {
        pluginSdkService.installPlugin(m);
        refresh();
    };

    const handleUninstall = (id: string) => {
        pluginSdkService.uninstallPlugin(id);
        refresh();
        if (configId === id) setConfigId(null);
    };

    const handleToggle = (p: PluginInstance) => {
        if (p.status === 'enabled') pluginSdkService.disablePlugin(p.manifest.id);
        else pluginSdkService.enablePlugin(p.manifest.id);
        refresh();
    };

    const handleConfigSave = (id: string) => {
        try {
            const parsed = JSON.parse(configEdit);
            pluginSdkService.updatePluginConfig(id, parsed);
            setConfigId(null);
            refresh();
        } catch {
            /* invalid JSON */
        }
    };

    const openConfig = (id: string) => {
        const cfg = pluginSdkService.getPluginConfig(id);
        setConfigEdit(JSON.stringify(cfg, null, 2));
        setConfigId(id);
    };

    const renderPluginCard = (p: PluginInstance, showActions = true) => (
        <div
            key={p.manifest.id}
            style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'var(--slate-900)',
                border: '1px solid rgba(255,255,255,0.04)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {p.status === 'enabled' ? (
                    <Power size={14} color="#10b981" />
                ) : (
                    <PowerOff size={14} color="#64748b" />
                )}
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-200)' }}>
                    {p.manifest.name}
                </span>
                <span
                    style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        background: `${TYPE_COLORS[p.manifest.type]}20`,
                        color: TYPE_COLORS[p.manifest.type],
                        textTransform: 'uppercase',
                    }}
                >
                    {p.manifest.type}
                </span>
                <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>v{p.manifest.version}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--slate-500)', marginBottom: 2 }}>
                {p.manifest.description}
            </div>
            <div
                style={{
                    fontSize: 10,
                    color: 'var(--slate-600)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <span>
                    {p.manifest.author} · {p.manifest.permissions.join(', ')}
                </span>
                <span style={{ fontSize: 10, color: 'var(--slate-600)' }}>
                    {new Date(p.installedAt).toLocaleDateString()}
                </span>
            </div>
            {showActions && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    <button
                        onClick={() => handleToggle(p)}
                        style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 10,
                            background:
                                p.status === 'enabled'
                                    ? 'rgba(239,68,68,0.15)'
                                    : 'rgba(16,185,129,0.15)',
                            color: p.status === 'enabled' ? '#ef4444' : '#10b981',
                        }}
                    >
                        {p.status === 'enabled' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                        onClick={() => openConfig(p.manifest.id)}
                        style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 10,
                            background: 'rgba(59,130,246,0.15)',
                            color: 'var(--accent)',
                        }}
                    >
                        Config
                    </button>
                    <button
                        onClick={() => handleUninstall(p.manifest.id)}
                        style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 10,
                            background: 'rgba(239,68,68,0.15)',
                            color: 'var(--error)',
                            marginLeft: 'auto',
                        }}
                    >
                        <Trash2 size={10} /> Uninstall
                    </button>
                </div>
            )}
            {configId === p.manifest.id && (
                <div style={{ marginTop: 8 }}>
                    <textarea
                        value={configEdit}
                        onChange={(e) => setConfigEdit(e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: 80,
                            padding: 8,
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'var(--slate-900)',
                            color: 'var(--slate-200)',
                            fontSize: 11,
                            fontFamily: 'monospace',
                            outline: 'none',
                            resize: 'vertical',
                        }}
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <button
                            onClick={() => handleConfigSave(p.manifest.id)}
                            style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 10,
                                background: 'rgba(16,185,129,0.2)',
                                color: 'var(--success)',
                            }}
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setConfigId(null)}
                            style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 10,
                                background: 'rgba(100,116,139,0.2)',
                                color: 'var(--slate-400)',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 16,
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: '0 0 4px',
                            fontSize: 18,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Puzzle size={20} color="#a855f7" /> Plugin SDK
                    </h2>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)' }}>
                        Extend the platform with custom plugins
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                        }}
                    >
                        Installed ({installed.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {installed.map((p) => renderPluginCard(p))}
                        {installed.length === 0 && (
                            <div
                                style={{
                                    padding: 16,
                                    textAlign: 'center',
                                    color: 'var(--slate-600)',
                                    fontSize: 13,
                                }}
                            >
                                No plugins installed
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                        }}
                    >
                        Available ({available.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {available.map((m) => (
                            <div
                                key={m.id}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px dashed rgba(255,255,255,0.08)',
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
                                        {m.name}
                                    </span>
                                    <span
                                        style={{
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            background: `${TYPE_COLORS[m.type]}20`,
                                            color: TYPE_COLORS[m.type],
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {m.type}
                                    </span>
                                    <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>
                                        v{m.version}
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--slate-500)', marginBottom: 2 }}>
                                    {m.description}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--slate-600)' }}>
                                    {m.author} · min v{m.minAppVersion}
                                </div>
                                <button
                                    onClick={() => handleInstall(m)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '3px 8px',
                                        borderRadius: 4,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 10,
                                        background: 'rgba(139,92,246,0.15)',
                                        color: 'var(--purple)',
                                        marginTop: 6,
                                    }}
                                >
                                    <Download size={10} /> Install
                                </button>
                            </div>
                        ))}
                        {available.length === 0 && (
                            <div
                                style={{
                                    padding: 16,
                                    textAlign: 'center',
                                    color: 'var(--slate-600)',
                                    fontSize: 13,
                                }}
                            >
                                All plugins installed
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PluginSdkPanel: React.FC = () => (
    <PanelLoader name="Plugin SDK">
        <PluginSdkPanelContent />
    </PanelLoader>
);

export default PluginSdkPanel;
