import React from 'react';
import PanelLoader from './PanelLoader';
import { pluginRegistry, pluginHost } from '../kernel/instances';

const PluginMarketplacePanelInner: React.FC = () => {
    const plugins = pluginRegistry.list();
    const panels = pluginHost.listPanels();
    const tools = pluginHost.listTools();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Каталог плагинов (установленные)
            </div>
            {plugins.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Пусто. Плагины регистрируются через манифесты (SPEC_06).
                </div>
            )}
            {plugins.map((p) => (
                <div
                    key={p.manifest.id}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        marginBottom: '0.4rem',
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {p.manifest.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {p.manifest.id} · v{p.manifest.version} · {p.status}
                        </div>
                    </div>
                </div>
            ))}

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Панелей: {panels.length} · инструментов: {tools.length}
            </div>
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
