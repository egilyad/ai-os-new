import { safeJsonParse } from '../../kernel/utils/safe-json';
import { ssrSafeStorage } from '../../kernel/utils/ssr-storage';

const RECENT_KEY = 'mavis:palette:recent';
const PINNED_KEY = 'mavis:sidebar:pinned';

export function getRecent(): string[] {
    try {
        return (safeJsonParse(ssrSafeStorage.getItem(RECENT_KEY) || '[]') as string[]) ?? [];
    } catch {
        return [];
    }
}

export function getPinned(): string[] {
    try {
        return (safeJsonParse(ssrSafeStorage.getItem(PINNED_KEY) || '[]') as string[]) ?? [];
    } catch {
        return [];
    }
}

export function savePinned(pinned: string[]) {
    try {
        ssrSafeStorage.setItem(PINNED_KEY, JSON.stringify(pinned));
    } catch {
        /* noop */
    }
}

const COLLAPSED_KEY = 'mavis:collapsedSections';

export function getCollapsedSections(): Set<string> {
    try {
        return new Set<string>(
            (safeJsonParse(ssrSafeStorage.getItem(COLLAPSED_KEY) || '[]') as string[]) ?? [],
        );
    } catch {
        return new Set<string>();
    }
}

export function saveCollapsedSections(sections: Set<string>) {
    try {
        ssrSafeStorage.setItem(COLLAPSED_KEY, JSON.stringify([...sections]));
    } catch {
        /* noop */
    }
}
