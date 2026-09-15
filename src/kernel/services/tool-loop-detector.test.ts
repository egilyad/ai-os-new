/**
 * ToolLoopDetector tests — AGEMS port Phase 12.1.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ToolLoopDetector } from './tool-loop-detector';

describe('ToolLoopDetector', () => {
    let det: ToolLoopDetector;

    beforeEach(() => {
        det = new ToolLoopDetector(20, 4);
    });

    it('returns no loop for empty input', () => {
        const r = det.detect([]);
        expect(r.loop).toBe(false);
        expect(r.shouldBreak).toBe(false);
    });

    it('returns no loop for diverse tools', () => {
        const r = det.detect(['a', 'b', 'c', 'd']);
        expect(r.loop).toBe(false);
    });

    it('detects hash dedup loop (same tool >= 4 times)', () => {
        const r1 = det.detect(['search', 'search', 'search']);
        expect(r1.loop).toBe(false);
        const r2 = det.detect(['search']);
        expect(r2.loop).toBe(true);
        expect(r2.shouldBreak).toBe(true);
        expect(r2.pattern).toContain('search');
        expect(r2.pattern).toContain('4 times');
    });

    it('detects ping-pong pattern (A-B-A-B)', () => {
        const r = det.detect(['search', 'calculate', 'search', 'calculate', 'search', 'calculate']);
        expect(r.loop).toBe(true);
        expect(r.shouldBreak).toBe(true);
        expect(r.pattern).toContain('Ping-pong');
    });

    it('does not detect ping-pong for A-B-C-D', () => {
        const r = det.detect(['a', 'b', 'a', 'b', 'c', 'd']);
        expect(r.loop).toBe(false);
    });

    it('reset clears state', () => {
        det.detect(['x', 'x', 'x', 'x']);
        det.reset();
        const r = det.detect(['x']);
        expect(r.loop).toBe(false);
    });

    it('getWindow returns current window', () => {
        det.detect(['a', 'b', 'c']);
        expect(det.getWindow()).toEqual(['a', 'b', 'c']);
    });

    it('window slides beyond window size', () => {
        const big = new ToolLoopDetector(3, 10);
        big.detect(['a', 'b', 'c', 'd', 'e']);
        expect(big.getWindow()).toEqual(['c', 'd', 'e']);
    });

    it('custom thresholds', () => {
        const custom = new ToolLoopDetector(20, 2);
        const r = custom.detect(['tool', 'tool']);
        expect(r.loop).toBe(true);
        expect(r.pattern).toContain('2 times');
    });
});
