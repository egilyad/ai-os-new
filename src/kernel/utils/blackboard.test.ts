import { describe, it, expect } from 'vitest';
import { Blackboard } from './blackboard';

describe('Blackboard (P3-2)', () => {
    it('posts and reads values', () => {
        const bb = new Blackboard();
        bb.post('topic', 'pricing');
        expect(bb.read('topic')).toBe('pricing');
        expect(bb.has('topic')).toBe(true);
        expect(bb.keys()).toEqual(['topic']);
        expect(bb.size).toBe(1);
    });

    it('rolls back to the previous value', () => {
        const bb = new Blackboard();
        bb.post('x', 1);
        bb.post('x', 2);
        expect(bb.read('x')).toBe(2);
        expect(bb.rollback()).toBe(true);
        expect(bb.read('x')).toBe(1);
        expect(bb.rollback()).toBe(true);
        expect(bb.has('x')).toBe(false);
        expect(bb.rollback()).toBe(false);
    });

    it('clears everything', () => {
        const bb = new Blackboard();
        bb.post('a', 1);
        bb.post('b', 2);
        bb.clear();
        expect(bb.size).toBe(0);
        expect(bb.keys()).toEqual([]);
    });
});
