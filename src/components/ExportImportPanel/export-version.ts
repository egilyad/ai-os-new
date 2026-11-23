export const EXPORT_VERSION = '1.0.0';

export type VersionCheck = { ok: true } | { ok: false; error: string };

export function validateExportVersion(data: Record<string, unknown>): VersionCheck {
    const version = data['version'];
    if (version === undefined) return { ok: true };
    if (typeof version !== 'string') return { ok: false, error: 'Invalid export version' };
    if (version !== EXPORT_VERSION) {
        return { ok: false, error: `Unsupported export version ${version}` };
    }
    return { ok: true };
}
