/**
 * Hierarchical plan decomposition (Generative Agents-inspired, H6).
 *
 * Breaks a goal into day → hour → minute nodes with parent links. Pure and
 * deterministic: the caller can attach an LLM later to enrich node text.
 */
import type { IHierarchicalPlanService, PlanNode } from '../../contracts/hierarchical-plan';

export class HierarchicalPlanService implements IHierarchicalPlanService {
    decompose(goal: string, minutes = 60): PlanNode[] {
        const day: PlanNode = {
            id: 'day-1',
            text: goal,
            horizon: 'day',
            done: false,
        };
        const chunks = Math.max(1, Math.ceil(minutes / 60));
        const nodes: PlanNode[] = [day];
        for (let i = 0; i < chunks; i++) {
            const hour: PlanNode = {
                id: `hour-${i + 1}`,
                text: `Hour ${i + 1}: work on "${goal.slice(0, 60)}"`,
                horizon: 'hour',
                parentId: day.id,
                done: false,
            };
            nodes.push(hour);
            for (let j = 0; j < 4; j++) {
                nodes.push({
                    id: `min-${i + 1}-${j + 1}`,
                    text: `Step ${j + 1} of hour ${i + 1}: concrete action toward the goal`,
                    horizon: 'minute',
                    parentId: hour.id,
                    done: false,
                });
            }
        }
        return nodes;
    }

    progress(plan: PlanNode[]): { total: number; done: number; ratio: number } {
        const actionable = plan.filter((n) => n.horizon === 'minute');
        const done = actionable.filter((n) => n.done).length;
        return {
            total: actionable.length,
            done,
            ratio: actionable.length === 0 ? 0 : done / actionable.length,
        };
    }

    nextAction(plan: PlanNode[]): PlanNode | null {
        return plan.find((n) => n.horizon === 'minute' && !n.done) ?? null;
    }
}
