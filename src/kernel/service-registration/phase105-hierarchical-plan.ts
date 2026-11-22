/** Phase 105 — hierarchical day/hour/minute planning. */
import type { Phase } from './helpers';
import { HierarchicalPlanService } from '../services/orchestrator/hierarchical-plan-service';

export const registerPhase105: Phase = ({ register }) => {
    register('hierarchicalPlanService', () => new HierarchicalPlanService());
};
