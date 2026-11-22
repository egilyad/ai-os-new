import { describe, it, expect } from 'vitest';
import { HierarchicalPlanService } from './hierarchical-plan-service';

describe('HierarchicalPlanService', () => {
    it('decomposes a goal into day/hour/minute nodes with parents', () => {
        const plan = new HierarchicalPlanService().decompose('Build a feature', 120);
        expect(plan.filter((n) => n.horizon === 'day')).toHaveLength(1);
        expect(plan.filter((n) => n.horizon === 'hour')).toHaveLength(2);
        expect(plan.filter((n) => n.horizon === 'minute')).toHaveLength(8);
        expect(plan[1]!.parentId).toBe('day-1');
        expect(plan[2]!.parentId).toBe('hour-1');
    });

    it('tracks progress over actionable minute nodes', () => {
        const svc = new HierarchicalPlanService();
        const plan = svc.decompose('Goal', 60);
        expect(svc.progress(plan).ratio).toBe(0);
        plan.filter((n) => n.horizon === 'minute')[0]!.done = true;
        expect(svc.progress(plan).done).toBe(1);
        expect(svc.progress(plan).ratio).toBeCloseTo(0.25);
    });

    it('returns the next unfinished action', () => {
        const svc = new HierarchicalPlanService();
        const plan = svc.decompose('Goal', 60);
        const first = svc.nextAction(plan);
        expect(first?.id).toBe('min-1-1');
        first!.done = true;
        expect(svc.nextAction(plan)?.id).toBe('min-1-2');
    });
});
