export interface VetoCountPayload {
    templateIds?: string[];
}

export function addVetoCount(
    counts: Record<string, number>,
    payload: unknown,
): Record<string, number> {
    const ids = (payload as VetoCountPayload | undefined)?.templateIds;
    if (!Array.isArray(ids) || ids.length === 0) return counts;
    const next = { ...counts };
    for (const id of ids) {
        if (typeof id !== 'string') continue;
        next[id] = (next[id] ?? 0) + 1;
    }
    return next;
}
