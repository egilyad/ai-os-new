import type { ExceptionTemplate } from '../../kernel/types/exception-template';

const KEY = 'exceptions.templates';

export function loadTemplates(): ExceptionTemplate[] {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const v = JSON.parse(raw) as unknown;
        return Array.isArray(v) ? (v as ExceptionTemplate[]) : [];
    } catch {
        return [];
    }
}

export function saveTemplates(list: ExceptionTemplate[]): void {
    try {
        if (list.length) localStorage.setItem(KEY, JSON.stringify(list));
        else localStorage.removeItem(KEY);
    } catch {
        /* storage may be unavailable */
    }
}

/** Enable/disable helper (returns the updated list). */
export function toggleTemplate(list: ExceptionTemplate[], id: string): ExceptionTemplate[] {
    return list.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
}
