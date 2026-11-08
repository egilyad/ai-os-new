export interface NavItemRef {
    id: string;
    label: string;
    sectionId: string;
}

export interface CrossPanelLink extends NavItemRef {
    reason: 'related' | 'section';
}

function sectionOf(panelId: string, items: readonly NavItemRef[]): string {
    return items.find((i) => i.id === panelId)?.sectionId ?? '';
}

/**
 * Suggest navigation links from one panel to others (P2-7).
 * Curated `related` pairs win; same-section siblings fill the rest.
 * Only existing ids are returned — unknown curated ids are ignored.
 */
export function getCrossPanelLinks(
    panelId: string,
    items: readonly NavItemRef[],
    curated: Record<string, string[]> = {},
    max = 4,
): CrossPanelLink[] {
    const others = items.filter((i) => i.id !== panelId);
    const curatedIds = new Set(curated[panelId] ?? []);
    const section = sectionOf(panelId, items);

    const related: CrossPanelLink[] = others
        .filter((i) => curatedIds.has(i.id))
        .map((i) => ({ ...i, reason: 'related' as const }));

    const siblings: CrossPanelLink[] = others
        .filter((i) => !curatedIds.has(i.id) && i.sectionId === section)
        .map((i) => ({ ...i, reason: 'section' as const }));

    return [...related, ...siblings].slice(0, max);
}
