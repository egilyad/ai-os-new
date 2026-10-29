import { describe, it, expect } from 'vitest';
import { buildDagLevels } from './dag-plan';
import type { DagNode } from './dag-plan';

describe('buildDagLevels (P3-1)', () => {
    it('orders independent nodes into a single parallel level', () => {
        const nodes: DagNode<string>[] = [
            { id: 'a', payload: 'A', dependsOn: [] },
            { id: 'b', payload: 'B', dependsOn: [] },
        ];
        const levels = buildDagLevels(nodes);
        expect(levels).toHaveLength(1);
        expect(levels[0]!.nodes.map((n) => n.id).sort()).toEqual(['a', 'b']);
    });

    it('emits dependency chains across levels', () => {
        const nodes: DagNode<string>[] = [
            { id: 'a', payload: 'A', dependsOn: [] },
            { id: 'b', payload: 'B', dependsOn: ['a'] },
            { id: 'c', payload: 'C', dependsOn: ['b'] },
        ];
        const levels = buildDagLevels(nodes);
        expect(levels.map((l) => l.nodes.map((n) => n.id))).toEqual([['a'], ['b'], ['c']]);
    });

    it('groups fan-out dependents into the same later level', () => {
        const nodes: DagNode<string>[] = [
            { id: 'a', payload: 'A', dependsOn: [] },
            { id: 'b', payload: 'B', dependsOn: ['a'] },
            { id: 'c', payload: 'C', dependsOn: ['a'] },
        ];
        const levels = buildDagLevels(nodes);
        expect(levels[0]!.nodes[0]!.id).toBe('a');
        expect(levels[1]!.nodes.map((n) => n.id).sort()).toEqual(['b', 'c']);
    });

    it('throws on a cycle', () => {
        const nodes: DagNode<string>[] = [
            { id: 'a', payload: 'A', dependsOn: ['b'] },
            { id: 'b', payload: 'B', dependsOn: ['a'] },
        ];
        expect(() => buildDagLevels(nodes)).toThrow(/cycle/);
    });

    it('throws on a missing dependency', () => {
        const nodes: DagNode<string>[] = [{ id: 'a', payload: 'A', dependsOn: ['ghost'] }];
        expect(() => buildDagLevels(nodes)).toThrow(/missing dependency/);
    });
});
