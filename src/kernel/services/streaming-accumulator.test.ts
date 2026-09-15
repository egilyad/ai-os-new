/**
 * StreamingAccumulator tests — AGEMS port Phase 12.7.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { StreamingAccumulator } from './streaming-accumulator';

describe('StreamingAccumulator', () => {
    let acc: StreamingAccumulator;

    beforeEach(() => {
        acc = new StreamingAccumulator();
    });

    it('accumulates chunks', () => {
        acc.addChunk({ content: 'Hello' });
        acc.addChunk({ content: ' ' });
        acc.addChunk({ content: 'world' });
        const r = acc.getResult();
        expect(r.content).toBe('Hello world');
        expect(r.chunks).toBe(3);
        expect(r.done).toBe(false);
    });

    it('marks done', () => {
        acc.addChunk({ content: 'Hi' });
        acc.addChunk({ done: true });
        const r = acc.getResult();
        expect(r.done).toBe(true);
    });

    it('handles error', () => {
        acc.addChunk({ error: 'timeout' });
        const r = acc.getResult();
        expect(r.error).toBe('timeout');
        expect(r.done).toBe(true);
    });

    it('reset clears state', () => {
        acc.addChunk({ content: 'a' });
        acc.reset();
        const r = acc.getResult();
        expect(r.content).toBe('');
        expect(r.chunks).toBe(0);
    });

    it('isDone returns finished state', () => {
        expect(acc.isDone()).toBe(false);
        acc.addChunk({ done: true });
        expect(acc.isDone()).toBe(true);
    });

    it('getLength returns content length', () => {
        acc.addChunk({ content: 'abc' });
        expect(acc.getLength()).toBe(3);
    });

    it('getChunkCount returns count', () => {
        acc.addChunk({ content: 'a' });
        acc.addChunk({ content: 'b' });
        expect(acc.getChunkCount()).toBe(2);
    });
});
