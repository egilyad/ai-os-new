export type BudgetAlertCondition =
    'above_threshold' | 'below_threshold' | 'near_limit' | 'trending_up' | 'trending_down';
export type BudgetAlertAction = 'notification' | 'block_usage' | 'switch_provider' | 'warn_user';

export interface BudgetAlertRule {
    id: string;
    name: string;
    provider?: string;
    condition: BudgetAlertCondition;
    threshold: number;
    action: BudgetAlertAction;
    enabled: boolean;
    createdAt: number;
}

export interface BudgetAlertEvent {
    ruleId: string;
    ruleName: string;
    message: string;
    timestamp: number;
    severity: 'info' | 'warn' | 'critical';
}

export interface IBudgetAlertService {
    getRules(): BudgetAlertRule[];
    addRule(rule: Omit<BudgetAlertRule, 'id' | 'createdAt'>): BudgetAlertRule;
    updateRule(id: string, updates: Partial<BudgetAlertRule>): void;
    removeRule(id: string): void;
    getAlertHistory(): BudgetAlertEvent[];
    evaluate(): BudgetAlertEvent[];
}
