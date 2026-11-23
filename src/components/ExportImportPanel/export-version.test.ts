import { describe, expect, it } from 'vitest';
import { EXPORT_VERSION, validateExportVersion } from './export-version';

describe('validateExportVersion', () => {
    it('принимает текущую версию и старые файлы без версии', () => {
        expect(validateExportVersion({ version: EXPORT_VERSION })).toEqual({ ok: true });
        expect(validateExportVersion({})).toEqual({ ok: true });
    });

    it('отвергает неизвестную и нестроковую версию', () => {
        expect(validateExportVersion({ version: '9.9.9' })).toMatchObject({
            ok: false,
            error: 'Unsupported export version 9.9.9',
        });
        expect(validateExportVersion({ version: 1 })).toMatchObject({
            ok: false,
            error: 'Invalid export version',
        });
    });
});
