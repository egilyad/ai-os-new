import { describe, expect, it } from 'vitest';
import { ArchitectureGraphService } from './architecture-graph.service';
import type { ArchitectureGraphSource } from '../../contracts/viz/architecture-graph';

describe('architecture graph service', () => {
    it('builds nodes and dependency edges from a container source', () => {
        const source: ArchitectureGraphSource = {
            getServices: () => ['a', 'b', 'c', 'memoryX'],
            getDependencies: () => ({
                a: ['b'],
                b: ['c'],
                memoryX: ['a'],
            }),
        };
        const graph = new ArchitectureGraphService().build(source);
        expect(graph.nodes.map((n) => n.id)).toEqual(['a', 'b', 'c', 'memoryX']);
        expect(graph.edges.length).toBe(3);
        const a = graph.nodes.find((n) => n.id === 'a');
        expect(a!.degree).toBe(2);
        const memoryX = graph.nodes.find((n) => n.id === 'memoryX');
        expect(memoryX!.type).toBe('memory');
    });

    it('dedupes undirected edges and ignores unknown targets', () => {
        const source: ArchitectureGraphSource = {
            getServices: () => ['a', 'b'],
            getDependencies: () => ({
                a: ['b', 'missing'],
                b: ['a'],
            }),
        };
        const graph = new ArchitectureGraphService().build(source);
        expect(graph.edges.length).toBe(1);
    });
});
