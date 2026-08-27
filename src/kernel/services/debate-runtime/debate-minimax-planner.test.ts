import { describe, it, expect } from 'vitest';
import { MinimaxPlanner } from './debate-minimax-planner';
import { ArgumentGraphService } from './debate-argument-graph-service';

describe('MinimaxPlanner', () => {
    it('returns null when graph too small', () => {
        const graph = new ArgumentGraphService();
        const planner = new MinimaxPlanner(graph);
        expect(planner.plan('alice', 'Alice', 1)).toBeNull();
    });

    it('plan does not throw on empty graph', () => {
        const graph = new ArgumentGraphService();
        const planner = new MinimaxPlanner(graph);
        const move = planner.plan('alice', 'Alice', 3);
        expect(move === null || typeof move?.type === 'string').toBe(true);
    });

    it('returns null or valid move shape', () => {
        const graph = new ArgumentGraphService();
        const planner = new MinimaxPlanner(graph);
        const move = planner.plan('alice', 'Alice', 4);
        if (move) {
            expect(move).toHaveProperty('type');
            expect(move).toHaveProperty('targetNodeId');
            expect(move).toHaveProperty('score');
            expect(move).toHaveProperty('rationale');
        } else {
            expect(move).toBeNull();
        }
    });
});
