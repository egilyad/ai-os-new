/**
 * buildAssociativeContext tests — keyword seed → PPR expansion → prompt block.
 */
import { describe, it, expect, vi } from 'vitest';
import { buildAssociativeContext } from './associative-context';
import type { ILtMemoryService } from '../../contracts/persona';
import type { LongTermMemory } from '../../types/persona-types';

function mem(id: string, content: string): LongTermMemory {
    return { id, ownerId: 'agent', tier: 'recall', content, createdAt: 1, updatedAt: 1 };
}

function fakeLt(
    seeds: LongTermMemory[],
    related: Record<string, Array<{ memory: LongTermMemory; score: number }>>,
): ILtMemoryService {
    return {
        recall: vi.fn(async () => seeds),
        associativeRecall: vi.fn(async (id: string) => related[id] ?? []),
    } as unknown as ILtMemoryService;
}

describe('buildAssociativeContext', () => {
    it('returns empty for blank query or no seeds', async () => {
        const lt = fakeLt([], {});
        expect(await buildAssociativeContext(lt, 'agent', '   ')).toBe('');
        expect(await buildAssociativeContext(lt, 'agent', 'anything')).toBe('');
    });

    it('expands seeds through PPR, excludes seeds, dedupes, and labels provenance', async () => {
        const s1 = mem('s1', 'zinc is an essential trace element');
        const s2 = mem('s2', 'zinc deficiency impairs immunity');
        const n1 = mem('n1', 'immune response depends on zinc');
        const n2 = mem('n2', 'metalloenzymes use zinc cofactors');
        const lt = fakeLt([s1, s2], {
            s1: [
                { memory: n1, score: 0.3 },
                { memory: s2, score: 0.2 },
            ],
            s2: [
                { memory: n1, score: 0.25 },
                { memory: n2, score: 0.1 },
            ],
        });

        const block = await buildAssociativeContext(lt, 'agent', 'zinc');
        expect(block).toContain('[ASSOCIATIVE MEMORY]');
        expect(block).toContain('immune response depends on zinc');
        expect(block).toContain('metalloenzymes use zinc cofactors');
        expect(block).toContain('(via zinc is an essential trace element)');
        // seed s2 is not rendered as a neighbour, and n1 appears once
        expect(block.match(/immune response depends on zinc/g)).toHaveLength(1);
        expect(block).not.toContain('- zinc deficiency impairs immunity');
    });

    it('respects the limit', async () => {
        const seed = mem('s1', 'topic');
        const related = Array.from({ length: 10 }, (_, i) => ({
            memory: mem(`n${i}`, `neighbour ${i}`),
            score: 1 - i / 10,
        }));
        const lt = fakeLt([seed], { s1: related });
        const block = await buildAssociativeContext(lt, 'agent', 'topic', { limit: 2 });
        expect(block.match(/^- neighbour/gm)).toHaveLength(2);
    });
});
