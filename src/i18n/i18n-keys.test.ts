import { describe, it, expect } from 'vitest';
import { en } from './translations/en';
import { ru } from './translations/ru';

/**
 * FX-02 / FL-6 — en/ru translation parity gate.
 *
 * A key present in one locale but missing in the other silently degrades the
 * RU experience (falls back to EN or leaks the raw key). This test fails the
 * build when the two key sets drift, so missing keys are caught in CI rather
 * than discovered by a Russian-speaking user.
 */
describe('i18n en/ru key parity', () => {
    const enKeys = Object.keys(en).sort();
    const ruKeys = Object.keys(ru).sort();

    it('both locales are non-empty', () => {
        expect(enKeys.length).toBeGreaterThan(0);
        expect(ruKeys.length).toBeGreaterThan(0);
    });

    it('every EN key exists in RU', () => {
        const missing = enKeys.filter((k) => !(k in ru));
        expect(missing, `RU missing ${missing.length} keys: ${missing.join(', ')}`).toEqual([]);
    });

    it('every RU key exists in EN', () => {
        const missing = ruKeys.filter((k) => !(k in en));
        expect(missing, `EN missing ${missing.length} keys: ${missing.join(', ')}`).toEqual([]);
    });

    it('key counts match', () => {
        expect(ruKeys.length).toBe(enKeys.length);
    });
});
