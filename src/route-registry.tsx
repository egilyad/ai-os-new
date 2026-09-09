import { CORE_SECTIONS } from './route-registry-core';
import { SYSTEM_SECTIONS } from './route-registry-system';
import { CONTENT_SECTIONS } from './route-registry-content';
import type { RouteMeta, NavSection } from './types/routing';

export type { RouteMeta, NavSection };

export const NAV_SECTIONS: NavSection[] = [
    ...CORE_SECTIONS,
    ...SYSTEM_SECTIONS,
    ...CONTENT_SECTIONS,
];

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
