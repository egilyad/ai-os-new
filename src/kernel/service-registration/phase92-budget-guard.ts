/** Phase 92 — hard budget guard (blocking cap). */
import type { Phase } from './helpers';
import { BudgetGuardService } from '../services/budget/budget-guard-service';

export const registerPhase92: Phase = ({ register }) => {
    register('budgetGuardService', () => new BudgetGuardService());
};
