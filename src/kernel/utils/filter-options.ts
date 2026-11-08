export interface FilterOptionScore {
    score: number;
    matchedKey: string | null;
}

const PREFIX_BONUS = 1.2;
const WORD_BONUS = 0.8;
const SUBSTRING_BONUS = 0.4;
const MIN_SCORE = 0.25;

function normalizeQuery(query: string): string {
    return query.trim().toLowerCase();
}

function scoreValue(value: string, query: string): number {
    const haystack = value.toLowerCase();
    if (haystack === query) return 3;
    if (haystack.startsWith(query)) return 2 * PREFIX_BONUS;
    if (haystack.includes(query)) return 2;
    const words = haystack.split(/[^a-zа-яё0-9]+/).filter(Boolean);
    let best = 0;
    for (const w of words) {
        if (w === query) best = Math.max(best, 1.5 * WORD_BONUS);
        else if (w.startsWith(query)) best = Math.max(best, 1);
        else if (w.includes(query)) best = Math.max(best, SUBSTRING_BONUS);
    }
    return best;
}

export function scoreOption<T>(item: T, query: string, keys: Array<keyof T>): FilterOptionScore {
    const q = normalizeQuery(query);
    if (!q) return { score: 0, matchedKey: null };

    let best = 0;
    let matchedKey: keyof T | null = null;
    for (const key of keys) {
        const raw = item[key];
        if (typeof raw !== 'string') continue;
        const s = scoreValue(raw, q);
        if (s > best) {
            best = s;
            matchedKey = key;
        }
    }
    return { score: best, matchedKey: best > 0 ? (matchedKey as string) : null };
}

export function filterOptions<T>(
    items: readonly T[],
    query: string,
    keys: Array<keyof T>,
    limit = 20,
): Array<{ item: T; score: number; matchedKey: string | null }> {
    const q = normalizeQuery(query);
    if (!q) return items.slice(0, limit).map((item) => ({ item, score: 0, matchedKey: null }));

    return items
        .map((item) => {
            const { score, matchedKey } = scoreOption(item, q, keys);
            return { item, score, matchedKey };
        })
        .filter((entry) => entry.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
