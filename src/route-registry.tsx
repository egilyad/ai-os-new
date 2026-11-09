import { CORE_SECTIONS } from './route-registry-core';
import { SYSTEM_SECTIONS } from './route-registry-system';
import { CONTENT_SECTIONS } from './route-registry-content';
import { Puzzle } from 'lucide-react';
import type { RouteMeta, NavSection } from './types/routing';
import { pluginHost } from './kernel/instances';
import { pluginPanelPath } from './plugin-panels';

export type { RouteMeta, NavSection };

export const NAV_SECTIONS: NavSection[] = [
    ...CORE_SECTIONS,
    ...SYSTEM_SECTIONS,
    ...CONTENT_SECTIONS,
];

/**
 * P3-1: динамическая секция навигации для `contributes.panels`.
 * Читается из PluginHost; без зарегистрированных панелей возвращает [].
 */
export function getPluginNavSections(): NavSection[] {
    const panels = pluginHost?.listPanels?.() ?? [];
    if (panels.length === 0) return [];
    const items: RouteMeta[] = panels.map((p) => ({
        id: `plugin:${p.id}`,
        path: pluginPanelPath(p.id),
        labelKey: 'nav.plugin_panel' as RouteMeta['labelKey'],
        label: p.titleKey ?? p.id,
        icon: <Puzzle size={16} />,
        color: 'var(--accent)',
        lazy: true,
        experimental: true,
    }));
    return [
        {
            id: 'section-plugins',
            labelKey: 'nav.section_plugins' as RouteMeta['labelKey'],
            items,
        },
    ];
}

// Guard against duplicate nav ids (FA-01): a duplicate id produces a double
// sidebar entry and a dead duplicate route. Fail fast in dev.
if (import.meta.env?.DEV) {
    const seen = new Map<string, string>();
    for (const section of NAV_SECTIONS) {
        for (const item of section.items) {
            if (seen.has(item.id)) {
                throw new Error(
                    `Duplicate nav id '${item.id}' in section '${section.id}' ` +
                        `(already defined in '${seen.get(item.id)}')`,
                );
            }
            seen.set(item.id, section.id);
        }
    }
}
