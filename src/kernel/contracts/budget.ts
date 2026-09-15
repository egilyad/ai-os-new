import type { Result } from './results';
import type { ConfigError } from './errors';
import type { CostEstimate, BudgetInfo } from './pricing';

export interface AgentBudget {
    agentId: string;
    monthlyBudget: number;
    spentThisMonth: number;
}

export interface SpendSummary {
    global: { budget: number; spent: number; remaining: number; pct: number };
    providers: Array<{
        provider: string;
        budget: number;
        spent: number;
        remaining: number;
        pct: number;
    }>;
    agents: Array<{
        agentId: string;
        name: string;
        budget: number;
        spent: number;
        remaining: number;
        pct: number;
    }>;
}

export interface BudgetAlert {
    type: 'global' | 'provider' | 'agent';
    level: number;
    entity: string;
    current: number;
    limit: number;
    message: string;
    timestamp: number;
}

// ── AGEMS Phase 4: Platform Budget + Incidents ──

export type BudgetIncidentType = 'soft_alert' | 'hard_stop' | 'budget_reset' | 'manual_override';

export interface PlatformBudget {
    id: string;
    hourlyLimitUsd?: number;
    dailyLimitUsd?: number;
    monthlyLimitUsd?: number;
    currentSpendUsd: number;
    softAlertPercent: number; // default 80
    hardStopEnabled: boolean; // default true
    periodStart: number;
    periodEnd: number;
    createdAt: number;
    updatedAt: number;
}

export interface BudgetIncident {
    id: string;
    budgetId: string;
    type: BudgetIncidentType;
    message: string;
    spendUsd: number;
    limitUsd: number;
    agentId?: string;
    provider?: string;
    resolvedBy?: string;
    resolvedAt?: number;
    createdAt: number;
}

export interface IBudgetService {
    init(): Promise<void>;
    destroy(): void;
    getAgentBudget(agentId: string): number | undefined;
    setAgentBudget(agentId: string, budget: number): void;
    getAllAgentBudgets(): Record<string, number>;
    getProviderBudget(provider: string): number | undefined;
    setProviderBudget(provider: string, budget: number): void;
    recordSpend(agentId: string | null, provider: string, amount: number): void;
    getSpendSummary(): SpendSummary;
    getAlertsHistory(): BudgetAlert[];
    getAlerts(): BudgetAlert[];
    clearAlerts(): void;
    trySetAgentBudget?(agentId: string, budget: number): Result<void, ConfigError>;
    trySetProviderBudget?(provider: string, budget: number): Result<void, ConfigError>;

    // Budget consolidation — moved from PricingService
    setMonthlyBudget(budget: number): void;
    getBudgetInfo(): BudgetInfo;
    checkProviderBudget?(provider: string, cost: number): boolean;
    getCostHistory?(limit?: number): CostEstimate[];
    getDailyCosts(days?: number): Array<{ date: string; cost: number; count: number }>;
    getCostTrend(): {
        direction: 'up' | 'down' | 'stable';
        dailyAvg: number;
        projectedMonthly: number;
        forecast: number;
    };
    detectAnomalies(): Array<{
        date: string;
        cost: number;
        expected: number;
        deviation: number;
        severity: 'low' | 'medium' | 'high';
    }>;
    getCostByProvider(): Record<string, number>;
    getCostByModel(): Record<string, number>;
    getCostByAgent(): Record<string, number>;
    getCostByInvocation(): Record<string, number>;
    clearHistory(): void;
}

// ── AGEMS Phase 4: Extended budget methods ──

export interface IPlatformBudgetService {
    getPlatformBudget(): Promise<PlatformBudget | undefined>;
    setPlatformBudget(input: Partial<Omit<PlatformBudget, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PlatformBudget>;
    checkPlatformBudget(costUsd: number): Promise<{ allowed: boolean; reason?: string }>;
    recordPlatformSpend(amountUsd: number): Promise<void>;
    resetPeriod(): Promise<void>;
}

export interface IBudgetIncidentService {
    logIncident(input: Omit<BudgetIncident, 'id' | 'createdAt'>): Promise<BudgetIncident>;
    listIncidents(limit?: number): Promise<BudgetIncident[]>;
    listIncidentsByAgent(agentId: string): Promise<BudgetIncident[]>;
    resolveIncident(id: string, resolvedBy: string): Promise<BudgetIncident>;
    getIncidentStats(): Promise<{ softAlerts: number; hardStops: number; total: number }>;
}
