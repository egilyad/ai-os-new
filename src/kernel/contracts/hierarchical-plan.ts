export interface PlanNode {
    id: string;
    text: string;
    horizon: 'day' | 'hour' | 'minute';
    parentId?: string;
    done: boolean;
}

/** Hierarchical day → hour → minute plan decomposition. */
export interface IHierarchicalPlanService {
    decompose(goal: string, minutes?: number): PlanNode[];
    progress(plan: PlanNode[]): { total: number; done: number; ratio: number };
    nextAction(plan: PlanNode[]): PlanNode | null;
}
