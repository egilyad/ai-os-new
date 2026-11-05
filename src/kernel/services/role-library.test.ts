import { describe, expect, it } from 'vitest';
import { LIBRARY_ROLES, getLibraryRolesByCategory } from '../../data/role-library';
import type { LibraryRole } from '../../data/role-library';

describe('role-library', () => {
    it('содержит уникальные id', () => {
        const ids = LIBRARY_ROLES.map((r: LibraryRole) => r.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('каждая роль имеет systemPrompt и capabilities', () => {
        for (const role of LIBRARY_ROLES) {
            expect(role.systemPrompt.length, role.id).toBeGreaterThan(0);
            expect(role.capabilities.length, role.id).toBeGreaterThan(0);
        }
    });

    it('getLibraryRolesByCategory фильтрует по категории', () => {
        const code = getLibraryRolesByCategory('code');
        expect(code.length).toBeGreaterThan(0);
        expect(code.every((r: LibraryRole) => r.category === 'code')).toBe(true);
    });

    it('покрывает все категории', () => {
        const categories = new Set(LIBRARY_ROLES.map((r) => r.category));
        for (const c of ['code', 'writing', 'analysis', 'moderation', 'devops', 'design']) {
            expect(categories.has(c as never), c).toBe(true);
        }
    });
});
