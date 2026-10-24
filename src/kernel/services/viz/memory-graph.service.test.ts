import { describe, expect, it } from 'vitest';
import { MemoryGraphService } from './memory-graph.service';
import type { MemoryEntry } from '../../types/memory-types';

function entry(id: string, overrides: Partial<MemoryEntry> = {}): MemoryEntry {
    return {
        id,
        content: 'some content about quantum mechanics and superposition',
        metadata: {
            source: 'fact',
            type: 'fact',
            timestamp: 1700000000000,
            importance: 5,
            collection: 'long_term',
            ...(overrides.metadata ?? {}),
        },
        ...overrides,
    };
}

describe('memory graph service', () => {
    it('builds fact nodes with relation edges', () => {
        const entries: MemoryEntry[] = [
            entry('a'),
            entry('b'),
            {
                ...entry('a'),
                metadata: {
                    source: 'fact',
                    type: 'fact',
                    timestamp: 1,
                    importance: 5,
                    relations: [{ targetId: 'b', type: 'reference', weight: 0.9 }],
                },
            },
        ];
        const graph = new MemoryGraphService().build(entries);
        expect(graph.nodes.find((n) => n.id === 'a')?.type).toBe('fact');
        expect(graph.edges.some((e) => e.kind === 'relation' && e.source === 'a' && e.target === 'b')).toBe(true);
    });

    it('creates tag nodes and connects entries to them', () => {
        const entries: MemoryEntry[] = [
            {
                ...entry('a'),
                metadata: { source: 'note', type: 'note', timestamp: 1, importance: 3, tags: { labels: ['quantum'] } },
            },
            {
                ...entry('b'),
                metadata: { source: 'note', type: 'note', timestamp: 2, importance: 3, tags: { labels: ['quantum'] } },
            },
        ];
        const graph = new MemoryGraphService().build(entries);
        const tagNode = graph.nodes.find((n) => n.type === 'tag');
        expect(tagNode).toBeDefined();
        expect(tagNode!.label).toBe('quantum');
        const tagEdges = graph.edges.filter((e) => e.kind === 'tag');
        expect(tagEdges.length).toBe(2);
        expect(tagEdges.every((e) => e.target === tagNode!.id)).toBe(true);
    });

    it('computes degree and keeps output deterministic', () => {
        const entries: MemoryEntry[] = [
            { ...entry('a'), content: 'quantum superposition decoherence' },
            { ...entry('b'), content: 'gardening soil compost nutrients' },
            { ...entry('c'), content: 'cooking recipes ingredients kitchen' },
            {
                ...entry('a'),
                content: 'quantum superposition decoherence',
                metadata: {
                    source: 'fact',
                    type: 'fact',
                    timestamp: 1,
                    importance: 5,
                    relations: [
                        { targetId: 'b', type: 'reference', weight: 1 },
                        { targetId: 'c', type: 'similar', weight: 1 },
                    ],
                },
            },
        ];
        const graph1 = new MemoryGraphService().build(entries);
        const graph2 = new MemoryGraphService().build(entries);
        const a1 = graph1.nodes.find((n) => n.id === 'a');
        expect(a1!.degree).toBe(2);
        expect(JSON.stringify(graph1)).toBe(JSON.stringify(graph2));
    });
});
