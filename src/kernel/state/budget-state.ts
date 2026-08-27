export interface BudgetStateEntry {
  entity: string;
  type: 'global' | 'provider' | 'agent';
  budget: number;
  spent: number;
  remaining: number;
  usagePercent: number;
}

export interface BudgetAlertEntry {
  type: 'global' | 'provider' | 'agent';
  level: number;
  entity: string;
  current: number;
  limit: number;
  message: string;
  timestamp: number;
}

export interface BudgetStateSnapshot {
  entries: BudgetStateEntry[];
  alerts: BudgetAlertEntry[];
  globalBudget: number;
  globalSpent: number;
  globalRemaining: number;
  globalUsagePercent: number;
  alertCount: number;
  lastAlertTimestamp: number | null;
}
