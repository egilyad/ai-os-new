import { describe, expect, it } from 'vitest';
import { LIBRARY_ROLES, getLibraryRolesByCategory } from '../../data/role-library';
import type { LibraryRole } from '../../data/role-library';

describe('role-library export (kernel barrel)', () => {
    it('LIBRARY_ROLES не пуст', () => {
        expect(LIBRARY_ROLES.length).toBeGreaterThan(0);
    });

    it('getLibraryRolesByCategory по категории', () => {
        expect(getLibraryRolesByCategory('analysis').length).toBeGreaterThan(0);
    });

    it('роль analyst имеет capabilities', () => {
        const analyst = LIBRARY_ROLES.find((r: LibraryRole) => r.id === 'analyst');
        expect(analyst).toBeDefined();
        expect(analyst!.capabilities).toContain('analysis');
    });
});
