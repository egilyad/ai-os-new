export type BudgetIncidentType = 'SOFT_ALERT' | 'HARD_STOP' | 'BUDGET_RESET' | 'MANUAL_OVERRIDE';

export interface PlatformBudget {
    id?: number;
    orgId: string;
    hourlyLimitUsd?: number;
    dailyLimitUsd?: number;
    monthlyLimitUsd?: number;
    currentSpendUsd: number;
    softAlertPercent: number;
    hardStopEnabled: boolean;
    periodStart: number;
    periodEnd: number;
}

export interface BudgetIncident {
    id?: number;
    budgetId: number;
    type: BudgetIncidentType;
    message: string;
    spendUsd: number;
    limitUsd: number;
    createdAt: number;
}
