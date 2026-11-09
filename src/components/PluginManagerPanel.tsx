import React, { useState, useEffect, useCallback } from 'react';
import PanelLoader from './PanelLoader';
import { pluginRegistry, pluginHost } from '../kernel/instances';

const row: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.5rem 0.75rem',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '0.4rem',
};

const badge: React.CSSProperties = {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '0.1rem 0.45rem',
    borderRadius: 999,
    textTransform: 'uppercase',
};

const PluginManagerPanelInner: React.FC = () => {
    const [plugins, setPlugins] = useState(() => pluginRegistry.list());
    const [busy, setBusy] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    const refresh = useCallback(() => setPlugins(pluginRegistry.list()), []);

    useEffect(() => {
        const id = window.setInterval(refresh, 5000);
        return () => window.clearInterval(id);
    }, [refresh]);

    const toggle = async (id: string, active: boolean) => {
        setBusy(id);
        setMessage('');
        try {
            const ok = active
                ? await pluginRegistry.deactivate(id)
                : await pluginRegistry.activate(id);
            setMessage(ok ? `OK: ${id}` : `Failed: ${id}`);
            refresh();
        } catch (e) {
            setMessage(`Error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setBusy(null);
        }
    };

    const panels = pluginHost.listPanels();
    const tools = pluginHost.listTools();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Установленные плагины</div>
            {plugins.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Нет установленных плагинов.
                </div>
            )}
            {plugins.map((p) => (
                <div key={p.manifest.id} style={row}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {p.manifest.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {p.manifest.id} · v{p.manifest.version}
                        </div>
                    </div>
                    <span
                        style={{
                            ...badge,
                            background:
                                p.status === 'active'
                                    ? 'rgba(34,197,94,0.15)'
                                    : p.status === 'error'
                                      ? 'rgba(239,68,68,0.15)'
                                      : 'rgba(148,163,184,0.15)',
                            color:
                                p.status === 'active'
                                    ? '#22c55e'
                                    : p.status === 'error'
                                      ? '#ef4444'
                                      : '#94a3b8',
                        }}
                    >
                        {p.status}
                    </span>
                    <button
                        disabled={busy !== null}
                        onClick={() => toggle(p.manifest.id, p.status === 'active')}
                        style={{
                            padding: '0.25rem 0.7rem',
                            borderRadius: 6,
                            border: 'none',
                            background:
                                p.status === 'active'
                                    ? 'rgba(239,68,68,0.15)'
                                    : 'rgba(34,197,94,0.15)',
                            color: p.status === 'active' ? '#ef4444' : '#22c55e',
                            cursor: busy !== null ? 'default' : 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                        }}
                    >
                        {busy === p.manifest.id
                            ? '...'
                            : p.status === 'active'
                              ? 'Деактивировать'
                              : 'Активировать'}
                    </button>
                </div>
            ))}

            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Contributed панели</div>
            {panels.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Плагины не объявляли панели.
                </div>
            ) : (
                panels.map((p) => (
                    <div key={p.id} style={row}>
                        <span style={{ flex: 1, fontSize: '0.8rem' }}>
                            {p.titleKey ?? p.id}
                        </span>
                        <a
                            href={`/plugin/${p.id}`}
                            style={{ color: 'var(--accent)', fontSize: '0.75rem' }}
                        >
                            открыть
                        </a>
                    </div>
                ))
            )}

            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Contributed инструменты</div>
            {tools.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Нет плагинных инструментов.
                </div>
            ) : (
                tools.map((t) => (
                    <div key={t.name} style={row}>
                        <span style={{ fontSize: '0.8rem' }}>{t.name}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {t.manifestId}
                        </span>
                    </div>
                ))
            )}

            {message && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{message}</div>
            )}
        </div>
    );
};

export default function PluginManagerPanel() {
    return (
        <PanelLoader title="Плагины">
            <PluginManagerPanelInner />
        </PanelLoader>
    );
}
