export interface TokenBudget {
  readonly provider: string;
  readonly limit: number;
  readonly used: number;
  readonly remaining: number;
  readonly resetAt: number;
  readonly period: 'daily' | 'monthly' | 'absolute';
}

export interface RequestBudget {
  readonly provider: string;
  readonly limit: number;
  readonly used: number;
  readonly remaining: number;
  readonly resetAt: number;
  readonly period: 'daily' | 'monthly' | 'absolute';
}

export interface CostBudget {
  readonly monthlyBudget: number;
  readonly spentThisMonth: number;
  readonly remainingBudget: number;
  readonly dailyAverage: number;
  readonly projectedMonthly: number;
  readonly providerBudgets: Record<string, ProviderCostBudget>;
}

export interface ProviderCostBudget {
  readonly budget: number;
  readonly spent: number;
  readonly remaining: number;
}

export interface QuotaAlert {
  readonly type: 'token' | 'request' | 'cost';
  readonly provider: string;
  readonly severity: 'warning' | 'critical';
  readonly threshold: number;
  readonly current: number;
  readonly limit: number;
}

export interface QuotaStateSnapshot {
  readonly tokenBudgets: TokenBudget[];
  readonly requestBudgets: RequestBudget[];
  readonly costBudget: CostBudget;
  readonly activeAlerts: QuotaAlert[];
  readonly updatedAt: number;
}

export interface BudgetConfig {
  readonly monthlyBudget: number;
  readonly providerBudgets: Record<string, number>;
  readonly tokenLimitPerProvider: Record<string, number>;
  readonly requestLimitPerProvider: Record<string, number>;
  readonly alertThresholds: {
    readonly costWarning: number;   // e.g. 0.8 = 80%
    readonly costCritical: number;  // e.g. 0.95 = 95%
    readonly tokenWarning: number;
    readonly tokenCritical: number;
    readonly requestWarning: number;
    readonly requestCritical: number;
  };
}
