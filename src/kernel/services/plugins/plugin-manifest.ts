import type { PluginManifest } from '../../contracts/plugin';

const SEMVER_RE = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;
const ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]+$/;

export interface ValidationResult {
    ok: boolean;
    errors: string[];
}

/**
 * Валидатор манифеста плагина (SPEC_06). Без внешних зависимостей.
 */
export function validateManifest(raw: unknown): ValidationResult {
    const errors: string[] = [];
    if (!raw || typeof raw !== 'object') {
        return { ok: false, errors: ['manifest must be an object'] };
    }
    const m = raw as Partial<PluginManifest>;

    if (typeof m.id !== 'string' || !ID_RE.test(m.id)) {
        errors.push('id must be a valid dotted identifier');
    }
    if (typeof m.name !== 'string' || m.name.trim().length === 0) {
        errors.push('name is required');
    }
    if (typeof m.version !== 'string' || !SEMVER_RE.test(m.version)) {
        errors.push('version must be valid semver');
    }
    if (!m.engines || typeof m.engines.os !== 'string' || !SEMVER_RE.test(m.engines.os)) {
        errors.push('engines.os must be a valid semver (minimum kernel version)');
    }
    if (!m.contributes || typeof m.contributes !== 'object') {
        errors.push('contributes is required');
    }
    if (m.permissions && !Array.isArray(m.permissions)) {
        errors.push('permissions must be an array');
    }
    if (m.activationEvents && !Array.isArray(m.activationEvents)) {
        errors.push('activationEvents must be an array');
    }

    return { ok: errors.length === 0, errors };
}

/**
 * Проверка минимальной версии ядра (engines.os) против текущей версии ядра.
 */
export function satisfiesMinKernel(required: string, current: string): boolean {
    const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0);
    const r = parse(required);
    const c = parse(current);
    for (let i = 0; i < 3; i++) {
        if ((c[i] ?? 0) < (r[i] ?? 0)) return false;
        if ((c[i] ?? 0) > (r[i] ?? 0)) return true;
    }
    return true;
}
