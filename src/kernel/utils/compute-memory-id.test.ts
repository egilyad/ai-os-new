import { describe, expect, it } from 'vitest';
import { computeMemoryId } from './compute-memory-id';

describe('computeMemoryId', () => {
    it('is deterministic for identical input', async () => {
        const a = await computeMemoryId('hello', 'chat', 'message');
        const b = await computeMemoryId('hello', 'chat', 'message');
        expect(a).toBe(b);
    });

    it('differs when source or type changes', async () => {
        const base = await computeMemoryId('hello', 'chat', 'message');
        const otherSource = await computeMemoryId('hello', 'agent', 'message');
        const otherType = await computeMemoryId('hello', 'chat', 'insight');
        expect(base).not.toBe(otherSource);
        expect(base).not.toBe(otherType);
    });

    it('prefixes with mem- and is 16 chars', async () => {
        const id = await computeMemoryId('x', 'y', 'z');
        expect(id.startsWith('mem-')).toBe(true);
        expect(id.length).toBe(16);
    });
});
