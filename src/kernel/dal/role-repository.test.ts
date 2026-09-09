import { beforeEach, describe, expect, it } from 'vitest';
import type { Role } from '../types/role-types';
import { RoleRepository } from './role-repository';
import { createTestDb, type TestDb } from './_test-harness';

function role(id: string, updated: number): Role {
    return {
        id,
        name: `role-${id}`,
        capabilities: [],
        permissions: [],
        metadata: { category: 'technical', created: updated, updated },
    };
}

describe('RoleRepository', () => {
    let testDb: TestDb;
    let repo: RoleRepository;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        repo = new RoleRepository(testDb.db);
    });

    it('save persists a role and get returns it', async () => {
        await repo.save(role('r1', 100));
        expect((await repo.get('r1'))?.name).toBe('role-r1');
        expect(await testDb.db.roles.get('r1')).toBeDefined();
    });

    it('getAll returns all roles', async () => {
        await repo.save(role('a', 1));
        await repo.save(role('b', 2));
        expect((await repo.getAll()).map((r) => r.id).sort()).toEqual(['a', 'b']);
    });

    it('delete removes a role from db and cache', async () => {
        await repo.save(role('x', 1));
        await repo.delete('x');
        expect(await repo.get('x')).toBeUndefined();
        expect(await testDb.db.roles.get('x')).toBeUndefined();
    });

    it('get returns a clone, not the cached reference', async () => {
        await repo.save(role('a', 1));
        const first = await repo.get('a');
        const second = await repo.get('a');
        first!.name = 'mutated';
        expect(second?.name).toBe('role-a');
    });
});
