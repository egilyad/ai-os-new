import type { IVetoGate, VetoGateMatch, VetoSurface } from '../contracts/veto-gate';
import type { ExceptionTemplate } from '../types/exception-template';
import { isReDoSPattern } from '../utils/regex-safe';
import { ssrSafeStorage } from '../utils/ssr-storage';

const STORAGE_KEY = 'exceptions.templates';

export type VetoMatch = VetoGateMatch;

function matchesTemplate(output: string, template: ExceptionTemplate): boolean {
    switch (template.matchMode) {
        case 'contains':
            return output.toLowerCase().includes(template.text.toLowerCase());
        case 'exact':
            return output.trim().toLowerCase() === template.text.trim().toLowerCase();
        case 'regex':
            if (isReDoSPattern(template.text)) return false;
            try {
                return new RegExp(template.text, 'i').test(output);
            } catch {
                return false;
            }
        default:
            return false;
    }
}

export function checkVeto(
    output: string,
    templates: ExceptionTemplate[],
    surface: VetoSurface,
): VetoMatch[] {
    return templates
        .filter(
            (t) => t.enabled && (t.scope === 'all' || t.scope === 'global' || t.scope === surface),
        )
        .filter((t) => matchesTemplate(output, t))
        .map((t) => ({
            templateId: t.id,
            name: t.name,
            text: t.text,
            matchMode: t.matchMode,
        }));
}

export class VetoGateService implements IVetoGate {
    check(output: string, surface: VetoSurface = 'chat'): VetoMatch[] {
        let templates: ExceptionTemplate[] = [];
        try {
            const raw = ssrSafeStorage.getItem(STORAGE_KEY);
            const parsed: unknown = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed)) templates = parsed as ExceptionTemplate[];
        } catch {
            templates = [];
        }
        return checkVeto(output, templates, surface);
    }
}

export const vetoGateService = new VetoGateService();
