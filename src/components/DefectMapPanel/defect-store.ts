import type { DefectFinding } from '../../kernel/types/defect-map-types';

const KEY = 'defect-map.findings';

export function loadFindings(): DefectFinding[] {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const v = JSON.parse(raw) as unknown;
        return Array.isArray(v) ? (v as DefectFinding[]) : [];
    } catch {
        return [];
    }
}

export function saveFindings(list: DefectFinding[]): void {
    try {
        localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
        /* storage may be unavailable */
    }
}
