import React, { useState, useCallback } from 'react';
import PanelLoader from './PanelLoader';
import { pluginRegistry, pluginLoader } from '../kernel/instances';
import { PLUGIN_MARKETPLACE_CATALOG } from '../kernel/services/plugins/plugin-marketplace-catalog';

const card: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.6rem 0.8rem',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '0.4rem',
};

const actionButton: React.CSSProperties = {
    padding: '0.3rem 0.8rem',
    borderRadius: 6,
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
};

const PluginMarketplacePanelInner: React.FC = () => {
    const [installed, setInstalled] = useState<Set<string>>(
        () => new Set(pluginRegistry.list().map((p) => p.manifest.id)),
    );
    const [busy, setBusy] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    const refresh = useCallback(() => {
        setInstalled(new Set(pluginRegistry.list().map((p) => p.manifest.id)));
    }, []);

    const install = async (id: string) => {
        setBusy(id);
        setMessage('');
        const entry = PLUGIN_MARKETPLACE_CATALOG.find((e) => e.manifest.id === id);
        if (!entry) {
            setMessage(`Unknown plugin: ${id}`);
            setBusy(null);
            return;
        }
        try {
            const ok = await pluginLoader.load(entry.manifest);
            setMessage(ok ? `OK: ${id} установлен` : `Failed: ${id}`);
            refresh();
        } catch (e) {
            setMessage(`Error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setBusy(null);
        }
    };

    const uninstall = async (id: string) => {
        setBusy(id);
        setMessage('');
        try {
            const ok = await pluginLoader.unload(id);
            setMessage(ok ? `OK: ${id} удалён` : `Failed: ${id}`);
            refresh();
        } catch (e) {
            setMessage(`Error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setBusy(null);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Каталог плагинов</div>
            {PLUGIN_MARKETPLACE_CATALOG.map((entry) => {
                const isInstalled = installed.has(entry.manifest.id);
                return (
                    <div key={entry.manifest.id} style={card}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                {entry.manifest.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {entry.manifest.id} · v{entry.manifest.version} · {entry.category}
                            </div>
                            {entry.blurb && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {entry.blurb}
                                </div>
                            )}
                        </div>
                        {isInstalled ? (
                            <button
                                style={{
                                    ...actionButton,
                                    background: 'rgba(239,68,68,0.15)',
                                    color: '#ef4444',
                                }}
                                disabled={busy !== null}
                                onClick={() => uninstall(entry.manifest.id)}
                            >
                                {busy === entry.manifest.id ? '...' : 'Удалить'}
                            </button>
                        ) : (
                            <button
                                style={{
                                    ...actionButton,
                                    background: 'rgba(34,197,94,0.15)',
                                    color: '#22c55e',
                                }}
                                disabled={busy !== null}
                                onClick={() => install(entry.manifest.id)}
                            >
                                {busy === entry.manifest.id ? '...' : 'Установить'}
                            </button>
                        )}
                    </div>
                );
            })}

            {message && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{message}</div>
            )}
        </div>
    );
};

export default function PluginMarketplacePanel() {
    return (
        <PanelLoader title="Плагины — маркетплейс">
            <PluginMarketplacePanelInner />
        </PanelLoader>
    );
}
