import React from 'react';
import PanelLoader from './components/PanelLoader';
import { pluginHost } from './kernel/instances';

export interface PluginPanelRoute {
    path: string;
    id: string;
    titleKey?: string;
}

/** /plugin/<panel-id> — stable deep-link surface for contributed panels. */
export function pluginPanelPath(id: string): string {
    return `/plugin/${id}`;
}

/**
 * Динамические маршруты для `contributes.panels` (SPEC_06 §5).
 * Читаются из PluginHost; без зарегистрированных панелей возвращает [].
 */
export function getPluginPanelRoutes(): PluginPanelRoute[] {
    const panels = pluginHost?.listPanels?.() ?? [];
    return panels.map((p) => ({
        path: pluginPanelPath(p.id),
        id: p.id,
        titleKey: p.titleKey,
    }));
}

const PanelNotFound: React.FC = () => (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-500)' }}>
        Plugin panel not found
    </div>
);

/**
 * Рендерит contributed-панель плагина в sandboxed iframe. Entry — это
 * HTML-точка входа из манифеста плагина (см. PluginPanelContribution.entry).
 */
export const PluginPanelFrame: React.FC<{ panelId: string }> = ({ panelId }) => {
    const panel = React.useMemo(() => pluginHost?.getPanel?.(panelId), [panelId]);
    if (!panel) return <PanelNotFound />;
    return (
        <iframe
            title={panel.titleKey ?? panel.id}
            src={panel.entry}
            sandbox="allow-scripts allow-same-origin"
            style={{
                width: '100%',
                height: 'calc(100vh - 140px)',
                border: 'none',
                borderRadius: '8px',
                background: 'var(--bg-main)',
            }}
        />
    );
};

/** Wrapper для routes.tsx: PanelLoader + фрейм. */
export const PluginPanelRouteElement: React.FC<{ panelId: string }> = ({ panelId }) => (
    <PanelLoader name={`plugin:${panelId}`}>
        <PluginPanelFrame panelId={panelId} />
    </PanelLoader>
);
