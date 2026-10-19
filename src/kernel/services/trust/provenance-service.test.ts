/**
 * ProvenanceService tests — temporal validity of provenance edges.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProvenanceService, isProvenanceEdgeValidAt } from './provenance-service';
import type { TrustRepository } from '../../dal/trust-repository';
import type { ProvenanceEdge, ProvenanceNode } from '../../types/trust-types';

vi.mock('../logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function fakeRepo() {
    const nodes = new Map<string, ProvenanceNode>();
    const edges = new Map<string, ProvenanceEdge>();
    const repo = {
        putProvNode: async (n: ProvenanceNode) => {
            nodes.set(n.id, { ...n });
        },
        getProvNode: async (id: string) => (nodes.has(id) ? { ...nodes.get(id)! } : null),
        putProvEdge: async (e: ProvenanceEdge) => {
            edges.set(e.id, { ...e });
        },
        getProvEdge: async (id: string) => (edges.has(id) ? { ...edges.get(id)! } : null),
        listProvEdges: async () => [...edges.values()].map((e) => ({ ...e })),
    };
    return repo as unknown as TrustRepository;
}

describe('ProvenanceService temporal edges', () => {
    let svc: ProvenanceService;

    beforeEach(() => {
        svc = new ProvenanceService(fakeRepo());
    });

    it('stamps validFrom/observedAt and traces upstream', async () => {
        const data = await svc.addNode('data', 'source doc');
        const decision = await svc.addNode('decision', 'verdict');
        const edge = await svc.link(data.id, decision.id, 'derived_from');
        expect(edge.validFrom).toBeGreaterThan(0);
        expect(edge.observedAt).toBeGreaterThan(0);
        expect(edge.validTo).toBeNull();

        const trace = await svc.trace(decision.id);
        expect(trace.nodes.map((n) => n.id)).toContain(data.id);
        expect(trace.edges).toHaveLength(1);
    });

    it('excludes closed edges from trace', async () => {
        const data = await svc.addNode('data', 'source doc');
        const decision = await svc.addNode('decision', 'verdict');
        const edge = await svc.link(data.id, decision.id, 'derived_from');
        await svc.closeLink(edge.id);
        const trace = await svc.trace(decision.id);
        expect(trace.edges).toHaveLength(0);
        expect(trace.nodes.map((n) => n.id)).toEqual([decision.id]);
    });

    it('honors asOf for historical traces', async () => {
        const data = await svc.addNode('data', 'source doc');
        const decision = await svc.addNode('decision', 'verdict');
        await svc.link(data.id, decision.id, 'derived_from', { validFrom: 1000, validTo: 2000 });
        expect((await svc.trace(decision.id, 5, 1500)).edges).toHaveLength(1);
        expect((await svc.trace(decision.id, 5, 500)).edges).toHaveLength(0);
        expect((await svc.trace(decision.id, 5, 2500)).edges).toHaveLength(0);
    });

    it('isProvenanceEdgeValidAt: favors createdAt when validFrom absent', () => {
        const edge: ProvenanceEdge = {
            id: 'e',
            fromId: 'a',
            toId: 'b',
            relation: 'derived_from',
            createdAt: 1000,
        };
        expect(isProvenanceEdgeValidAt(edge, 999)).toBe(false);
        expect(isProvenanceEdgeValidAt(edge, 1000)).toBe(true);
        expect(isProvenanceEdgeValidAt({ ...edge, validTo: 1500 }, 1500)).toBe(false);
        expect(isProvenanceEdgeValidAt({ ...edge, validTo: 1500 }, 1499)).toBe(true);
    });
});
