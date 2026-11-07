import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HierarchyService } from './hierarchy-service';
import type { HierarchyNode } from '../../types/ops-types';

function node(id: string, partial: Partial<HierarchyNode> = {}): HierarchyNode {
    return {
        id,
        name: id,
        parentId: null,
        spent: 0,
        createdAt: 0,
        updatedAt: 0,
        ...partial,
    };
}

function makeRepo() {
    const nodes = new Map<string, HierarchyNode>();
    return {
        nodes,
        getNode: vi.fn(async (id: string) => nodes.get(id) ?? null),
        listNodes: vi.fn(async () => [...nodes.values()]),
        putNode: vi.fn(async (n: HierarchyNode) => {
            nodes.set(n.id, n);
        }),
        deleteNode: vi.fn(async (id: string) => {
            nodes.delete(id);
        }),
    };
}

function makeDeps() {
    const repo = makeRepo();
    const events = { emit: vi.fn() };
    const audit = { append: vi.fn(async () => ({})) };
    const svc = new HierarchyService(repo as never, events as never, audit as never);
    return { svc, repo, events, audit };
}

describe('HierarchyService', () => {
    beforeEach(() => {});

    it('createNode creates root and child nodes; rejects unknown parent', async () => {
        const { svc, repo } = makeDeps();
        const root = await svc.createNode({ name: 'CEO' });
        const child = await svc.createNode({ name: 'VP', parentId: root.id });
        expect(repo.nodes.size).toBe(2);
        expect(child.parentId).toBe(root.id);
        await expect(svc.createNode({ name: 'X', parentId: 'missing' })).rejects.toThrow(
            /Parent node not found/,
        );
    });

    it('subordinates returns the full subtree', async () => {
        const { svc } = makeDeps();
        const root = await svc.createNode({ name: 'CEO' });
        const vp = await svc.createNode({ name: 'VP', parentId: root.id });
        const dir = await svc.createNode({ name: 'Dir', parentId: vp.id });
        await svc.createNode({ name: 'Other' });
        const subs = await svc.subordinates(root.id);
        expect(subs.map((s) => s.id).sort()).toEqual([vp.id, dir.id].sort());
    });

    it('setBudget refuses caps below spent', async () => {
        const { svc, repo } = makeDeps();
        const n = await svc.createNode({ name: 'A', budgetCap: 100 });
        n.spent = 50;
        repo.nodes.set(n.id, n);
        await expect(svc.setBudget(n.id, 40)).rejects.toThrow(/below already spent/);
        const ok = await svc.setBudget(n.id, 60);
        expect(ok.budgetCap).toBe(60);
    });

    it('recordSpend refuses overspend and audits denial', async () => {
        const { svc, audit } = makeDeps();
        const n = await svc.createNode({ name: 'A', budgetCap: 10 });
        await expect(svc.recordSpend(n.id, 20)).rejects.toThrow(/Budget exceeded/);
        expect(audit.append).toHaveBeenCalledWith('hierarchy', 'spend.denied', expect.any(String), expect.any(String));
    });

    it('removeNode is refused while subordinates exist', async () => {
        const { svc } = makeDeps();
        const root = await svc.createNode({ name: 'CEO' });
        await svc.createNode({ name: 'VP', parentId: root.id });
        await expect(svc.removeNode(root.id)).rejects.toThrow(/subordinate/);
    });
});
