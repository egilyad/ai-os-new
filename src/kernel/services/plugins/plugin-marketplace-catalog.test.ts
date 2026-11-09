import { describe, it, expect } from 'vitest';
import { PLUGIN_MARKETPLACE_CATALOG } from './plugin-marketplace-catalog';
import { validateManifest } from './plugin-manifest';

describe('Plugin marketplace catalog (SPEC_06 §8)', () => {
    it('has at least one entry', () => {
        expect(PLUGIN_MARKETPLACE_CATALOG.length).toBeGreaterThan(0);
    });

    it('every manifest is valid and carries permissions', () => {
        const ids = new Set<string>();
        for (const entry of PLUGIN_MARKETPLACE_CATALOG) {
            const validation = validateManifest(entry.manifest);
            expect(validation.ok, `${entry.manifest.id}: ${validation.errors.join('; ')}`).toBe(
                true,
            );
            expect(Array.isArray(entry.manifest.permissions) && entry.manifest.permissions!.length > 0).toBe(
                true,
            );
            expect(ids.has(entry.manifest.id)).toBe(false);
            ids.add(entry.manifest.id);
        }
    });

    it('entry ids are unique and stable', () => {
        const ids = PLUGIN_MARKETPLACE_CATALOG.map((e) => e.manifest.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
