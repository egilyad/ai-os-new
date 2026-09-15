/**
 * Phase 72 — Platform Budget + Budget Incidents (AGEMS port, Phase 4).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IDatabaseService } from '../types/interfaces';
import { PlatformBudgetService, BudgetIncidentService } from '../services/platform-budget-service';

export const registerPhase72: Phase = ({ register }) => {
    register('platformBudgetService', (c: IContainer) => {
        const db = c.get<IDatabaseService>('database');
        return new PlatformBudgetService({ keyValue: db });
    });

    register('budgetIncidentService', (c: IContainer) => {
        const db = c.get<IDatabaseService>('database');
        return new BudgetIncidentService({ budgetIncidents: db.budgetIncidents });
    });
};
