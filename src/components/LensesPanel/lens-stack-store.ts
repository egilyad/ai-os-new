/**
 * Persisted "active lens stack" — the set of lenses the operator has selected
 * in the /lenses panel. Assistant and Chat read this to actually apply the
 * selected perspectives when composing a turn.
 */
const KEY = 'lenses.activeStack';

export function loadActiveLensIds(): string[] {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const v = JSON.parse(raw) as unknown;
        return Array.isArray(v)
            ? v.filter((x): x is string => typeof x === 'string')
            : [];
    } catch {
        return [];
    }
}

export function saveActiveLensIds(ids: string[]): void {
    try {
        if (ids.length) localStorage.setItem(KEY, JSON.stringify(ids));
        else localStorage.removeItem(KEY);
    } catch {
        /* storage may be unavailable */
    }
}
