import type { ICostCalculator, CostEstimate, BudgetInfo } from '../contracts/pricing';
import { EVENTS } from '../events/event-names';
import type { SpendSummary, BudgetAlert, IBudgetService } from '../contracts/budget';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('BudgetService');

export type { AgentBudget, SpendSummary, BudgetAlert } from '../contracts/budget';

const BUDGET_KEY = 'super_agents_pricing_budget';
const COST_HISTORY_KEY = 'super_agents_cost_history';

export interface BudgetServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    costCalculator: ICostCalculator;
}

export class BudgetService implements IBudgetService {
    private agentBudgets: Record<string, number> = {};
    private agentSpend: Record<string, number> = {};
    private alertsHistory: BudgetAlert[] = [];
    private sentAlerts = new Set<string>();
    private unsubs: Array<() => void> = [];
    private deps: BudgetServiceDeps;
    private _initialized = false;

    private monthlyBudget: number = 50;
    private providerBudgets: Record<string, number> = {};
    private costHistory: CostEstimate[] = [];
    private _costDedupSet?: Set<string>;
    private budgetInfoCache: { result: BudgetInfo; timestamp: number } | null = null;
    private readonly BUDGET_CACHE_TTL = 1000;
    /** C-91: Month-filtered cost cache — avoids 5+ full scans of costHistory per STREAM_END */
    private _monthFiltered: { start: number; entries: CostEstimate[] } | null = null;

    constructor(deps: BudgetServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        await this.loadAgentConfig();
        await this.loadBudget();
        await this.loadProviderBudgets();
        await this.loadHistory();
        this.setupListeners();
    }

    destroy() {
        this.unsubs.forEach((u) => u());
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }
        this.costHistory = [];
        this.sentAlerts.clear();
        this.agentBudgets = {};
        this.agentSpend = {};
        this._costDedupSet?.clear();
        this.alertsHistory = [];
        this.budgetInfoCache = null;
        this._monthFiltered = null;
    }

    private async loadAgentConfig() {
        try {
            const budgets = await this.deps.database.getKv<Record<string, number>>(
                'super_agents_agent_budgets',
            );
            if (budgets) this.agentBudgets = budgets;
            const spend = await this.deps.database.getKv<Record<string, number>>(
                'super_agents_agent_spend',
            );
            if (spend) this.agentSpend = spend;
        } catch (e) {
            LOGGER.warn('BudgetService', 'Failed to load agent config', { error: e });
        }
    }

    private async persistAgentConfig() {
        try {
            await this.deps.database.setKv('super_agents_agent_budgets', this.agentBudgets);
            await this.deps.database.setKv('super_agents_agent_spend', this.agentSpend);
        } catch (e) {
            LOGGER.warn('BudgetService', 'Failed to persist agent config', { error: e });
        }
    }

    private async loadBudget() {
        try {
            const saved = await this.deps.database.getKv<{ monthlyBudget: number }>(BUDGET_KEY);
            if (saved) this.monthlyBudget = saved.monthlyBudget;
        } catch (e) {
            LOGGER.warn('BudgetService', 'Failed to load budget', { error: e });
        }
    }

    private async saveBudget() {
        try {
            await this.deps.database.setKv(BUDGET_KEY, { monthlyBudget: this.monthlyBudget });
        } catch (e) {
            LOGGER.warn('BudgetService', 'Failed to save budget', { error: e });
        }
    }

    private async loadProviderBudgets() {
        try {
            const saved =
                await this.deps.database.getKv<Record<string, number>>('provider_budgets');
            if (saved) {
                this.providerBudgets = Object.fromEntries(
                    Object.entries(saved).map(([provider, budget]) => [
                        provider.toLowerCase(),
                        budget,
                    ]),
                );
            }
        } catch (e) {
            LOGGER.warn('BudgetService', 'Failed to load provider budgets', { error: e });
        }
    }

    private async saveProviderBudgets() {
        try {
            await this.deps.database.setKv('provider_budgets', this.providerBudgets);
        } catch (e) {
            LOGGER.warn('BudgetService', 'Failed to save provider budgets', { error: e });
        }
    }

    private async loadHistory() {
        try {
            const saved = await this.deps.database.getKv<CostEstimate[]>(COST_HISTORY_KEY);
            if (saved) {
                this.costHistory = saved.map((c) => ({
                    model: c.model,
                    provider: (c.provider ||
                        (c.model.includes('/') ? c.model.split('/')[0] : c.model))!,
                    inputTokens: c.inputTokens,
                    outputTokens: c.outputTokens,
                    inputCost: c.inputCost,
                    outputCost: c.outputCost,
                    totalCost: c.totalCost,
                    timestamp: c.timestamp,
                    agentId: (c as { agentId?: string }).agentId,
                }));
            }
            this._invalidateMonthFiltered();
        } catch (e) {
            LOGGER.warn('BudgetService', 'Failed to load cost history', { error: e });
        }
    }

    private _saveDirty = false;
    private _saveTimer: ReturnType<typeof setTimeout> | null = null;

    private async saveHistory() {
        this._saveDirty = true;
        if (this._saveTimer) return;
        this._saveTimer = setTimeout(async () => {
            this._saveTimer = null;
            if (!this._saveDirty) return;
            this._saveDirty = false;
            try {
                await this.deps.database.setKv(COST_HISTORY_KEY, this.costHistory);
            } catch (e) {
                LOGGER.warn('BudgetService', 'Failed to save cost history', { error: e });
            }
        }, 5000);
    }

    private setupListeners() {
        const cc = this.deps.costCalculator;
        this.unsubs.push(
            this.deps.eventBus.onSafe<{
                requestId?: string;
                provider?: string;
                model?: string;
                tokens?: number;
                inputTokens?: number;
                outputTokens?: number;
                agentId?: string;
                invocationId?: string;
            }>(EVENTS.STREAM_END, (d) => {
                if (!d.requestId || !d.model) return;
                const input = d.inputTokens ?? Math.round((d.tokens || 0) * 0.3);
                const output = d.outputTokens ?? Math.round((d.tokens || 0) * 0.7);
                const cost = cc.calculateCost(d.model, input, output);
                const provider = (
                    d.provider || (d.model.includes('/') ? d.model.split('/')[0]! : d.model)
                ).toLowerCase();
                const now = Date.now();
                // C-67: use requestId for dedup key (stable, not time-based) — prevents silent cost duplication
                const dedupKey = `stream:${d.requestId || `${now}-${d.model}`}`;
                if (this._costDedupSet?.has(dedupKey)) return;
                if (!this._costDedupSet) this._costDedupSet = new Set<string>();
                this._costDedupSet.add(dedupKey);
                this.costHistory.push({
                    model: d.model,
                    provider,
                    inputTokens: input,
                    outputTokens: output,
                    inputCost: (input / 1_000_000) * cc.getInputCost(d.model),
                    outputCost: (output / 1_000_000) * cc.getOutputCost(d.model),
                    totalCost: cost,
                    timestamp: now,
                    agentId: d.agentId,
                    invocationId: d.invocationId,
                });
                this._invalidateMonthFiltered();
                // Prune dedupSet when it exceeds costHistory or grows past 15000
                if (
                    this.costHistory.length > 10000 ||
                    (this._costDedupSet && this._costDedupSet.size > 15000)
                ) {
                    this.costHistory = this.costHistory.slice(-10000);
                    this._invalidateMonthFiltered();
                    this._costDedupSet = new Set(
                        this.costHistory.map(
                            (e) => `stream:${e.timestamp}-${e.model}-${e.provider}`,
                        ),
                    );
                }
                this.saveHistory();
                this.budgetInfoCache = null;
                // C-91: Single pass through monthly entries for all spends
                const monthlyEntries = this._getMonthFiltered();
                const monthlySpend = monthlyEntries.reduce((s, c) => s + c.totalCost, 0);
                this.checkThresholds('global', 'global', monthlySpend, this.monthlyBudget);
                const providerSpendMap: Record<string, number> = {};
                for (const entry of monthlyEntries) {
                    const p = entry.provider.toLowerCase();
                    providerSpendMap[p] = (providerSpendMap[p] || 0) + entry.totalCost;
                }
                if (provider) {
                    const pBudget = this.providerBudgets[provider.toLowerCase()] || 0;
                    if (pBudget > 0) {
                        const pSpent = providerSpendMap[provider.toLowerCase()] || 0;
                        this.checkThresholds('provider', provider, pSpent, pBudget);
                    }
                }
                const providerSpends = Object.entries(this.providerBudgets).map(([p, budget]) => ({
                    provider: p,
                    budget,
                    spent: providerSpendMap[p.toLowerCase()] || 0,
                }));
                this.deps.eventBus.emit(EVENTS.BUDGET_ALERT, {
                    type: 'spend_updated',
                    summary: {
                        global: {
                            budget: this.monthlyBudget,
                            spent: monthlySpend,
                            remaining: Math.max(0, this.monthlyBudget - monthlySpend),
                            pct:
                                this.monthlyBudget > 0
                                    ? Math.round((monthlySpend / this.monthlyBudget) * 100)
                                    : 0,
                        },
                        providers: providerSpends.map(({ provider: p, budget, spent }) => ({
                            provider: p,
                            budget,
                            spent,
                            remaining: Math.max(0, budget - spent),
                            pct: budget > 0 ? Math.round((spent / budget) * 100) : 0,
                        })),
                        agents: [],
                    } as SpendSummary,
                });
            }),
        );
    }

    /** C-91: Invalidate month cache on costHistory mutation */
    private _invalidateMonthFiltered(): void {
        this._monthFiltered = null;
    }

    /** C-91: Get pre-filtered month entries — single scan, cached for repeat calls */
    private _getMonthFiltered(): CostEstimate[] {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
        if (this._monthFiltered && this._monthFiltered.start === monthStart) {
            return this._monthFiltered.entries;
        }
        const entries = this.costHistory.filter((c) => c.timestamp >= monthStart);
        this._monthFiltered = { start: monthStart, entries };
        return entries;
    }

    private computeCurrentSpend(): number {
        return this._getMonthFiltered().reduce((s, c) => s + c.totalCost, 0);
    }

    private computeProviderSpend(provider: string): number {
        const normalized = provider.toLowerCase();
        return this._getMonthFiltered()
            .filter((c) => c.provider.toLowerCase() === normalized)
            .reduce((s, c) => s + c.totalCost, 0);
    }

    private checkThresholds(
        type: 'global' | 'provider' | 'agent',
        entity: string,
        current: number,
        limit: number,
    ) {
        if (limit <= 0 || limit >= Number.MAX_SAFE_INTEGER) return;
        const pct = Math.round((current / limit) * 100);
        const thresholds = [50, 80, 90, 100];

        for (const key of this.sentAlerts) {
            const parts = key.split(':');
            if (parts[0] === type && parts[1] === entity) {
                const thresholdLevel = parseInt(parts[2]!, 10);
                if (pct < thresholdLevel) this.sentAlerts.delete(key);
            }
        }

        for (const level of thresholds) {
            if (pct >= level) {
                const key = `${type}:${entity}:${level}`;
                if (!this.sentAlerts.has(key)) {
                    this.sentAlerts.add(key);
                    const alert: BudgetAlert = {
                        type,
                        level,
                        entity,
                        current,
                        limit,
                        message: `${type === 'global' ? 'Global' : type === 'provider' ? `Provider ${entity}` : `Agent ${entity}`} spend at ${level}% ($${current.toFixed(2)}/$${limit.toFixed(2)})`,
                        timestamp: Date.now(),
                    };
                    this.alertsHistory.push(alert);
                    if (this.alertsHistory.length > 100)
                        this.alertsHistory = this.alertsHistory.slice(-100);
                    this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                        message: alert.message,
                        type: level >= 100 ? 'error' : 'warning',
                    });
                    this.deps.eventBus.emit(EVENTS.BUDGET_ALERT, alert);
                }
            }
        }
    }

    getGlobalSpend(): number {
        return this.computeCurrentSpend();
    }

    getSpendSummary(): SpendSummary {
        const spentGlobal = this.computeCurrentSpend();
        const global = {
            budget: this.monthlyBudget,
            spent: spentGlobal,
            remaining: Math.max(0, this.monthlyBudget - spentGlobal),
            pct: this.monthlyBudget > 0 ? Math.round((spentGlobal / this.monthlyBudget) * 100) : 0,
        };

        const providers = Object.entries(this.providerBudgets).map(([provider, budget]) => {
            const spent = this.computeProviderSpend(provider);
            return {
                provider,
                budget,
                spent,
                remaining: Math.max(0, budget - spent),
                pct: budget > 0 ? Math.round((spent / budget) * 100) : 0,
            };
        });

        const agents = Object.entries(this.agentSpend)
            .filter(([id]) => this.agentBudgets[id] && this.agentBudgets[id] > 0)
            .map(([agentId, spent]) => {
                const budget = this.agentBudgets[agentId] || 0;
                return {
                    agentId,
                    name: agentId,
                    budget,
                    spent,
                    remaining: Math.max(0, budget - spent),
                    pct: budget > 0 ? Math.round((spent / budget) * 100) : 0,
                };
            });

        return { global, providers, agents };
    }

    canUseProvider(provider: string, estimatedCost: number = 0): boolean {
        const providerBudget = this.providerBudgets[provider.toLowerCase()];
        if (!providerBudget || providerBudget <= 0) return true;
        const pSpent = this.computeProviderSpend(provider);
        return pSpent + estimatedCost <= providerBudget;
    }

    canUseGlobal(estimatedCost: number = 0): boolean {
        if (this.monthlyBudget <= 0) return true;
        return this.computeCurrentSpend() + estimatedCost <= this.monthlyBudget;
    }

    recordSpend(agentId: string | null, provider: string, amount: number): void {
        if (amount <= 0) return;
        // Track by provider — append synthetic cost history entry so provider budgets are accurate
        this.costHistory.push({
            model: 'recorded',
            provider: provider.toLowerCase(),
            inputTokens: 0,
            outputTokens: 0,
            inputCost: 0,
            outputCost: 0,
            totalCost: amount,
            timestamp: Date.now(),
            agentId: agentId || undefined,
        });
        this._invalidateMonthFiltered();
        if (this.costHistory.length > 10000) {
            this.costHistory = this.costHistory.slice(-10000);
            this._invalidateMonthFiltered();
        }
        this.saveHistory();
        this.budgetInfoCache = null;
        // C-68: check provider budget threshold
        const pBudget = this.providerBudgets[provider.toLowerCase()] || 0;
        if (pBudget > 0) {
            const pSpent = this.computeProviderSpend(provider);
            this.checkThresholds('provider', provider, pSpent, pBudget);
        }
        // Agent-level tracking
        if (agentId && amount > 0) {
            this.agentSpend[agentId] = (this.agentSpend[agentId] || 0) + amount;
            const budget = this.agentBudgets[agentId] || 0;
            if (budget > 0) {
                this.checkThresholds('agent', agentId, this.agentSpend[agentId], budget);
            }
            this.persistAgentConfig();
        }
    }

    getAgentBudget(agentId: string): number | undefined {
        return this.agentBudgets[agentId] || undefined;
    }
    setAgentBudget(agentId: string, budget: number) {
        this.agentBudgets[agentId] = budget;
        this.budgetInfoCache = null;
        this.persistAgentConfig();
    }
    getAllAgentBudgets(): Record<string, number> {
        return { ...this.agentBudgets };
    }

    getProviderBudget(provider: string): number | undefined {
        return this.providerBudgets[provider.toLowerCase()] || undefined;
    }

    setProviderBudget(provider: string, budget: number): void {
        this.providerBudgets[provider.toLowerCase()] = budget;
        this.budgetInfoCache = null;
        this.saveProviderBudgets();
    }

    setMonthlyBudget(budget: number) {
        this.budgetInfoCache = null;
        this.monthlyBudget = budget;
        this.saveBudget();
    }

    getBudgetInfo(): BudgetInfo {
        if (
            this.budgetInfoCache &&
            Date.now() - this.budgetInfoCache.timestamp < this.BUDGET_CACHE_TTL
        ) {
            return this.budgetInfoCache.result;
        }
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dayOfMonth = now.getDate();
        const monthlyCost = this.computeCurrentSpend();

        const providerBudgets = Object.entries(this.providerBudgets).map(([provider, budget]) => {
            const spent = this.computeProviderSpend(provider);
            return {
                provider,
                monthlyBudget: budget,
                spentThisMonth: spent,
                remainingBudget: budget > 0 ? Math.max(0, budget - spent) : Number.MAX_SAFE_INTEGER,
            };
        });

        const result: BudgetInfo = {
            monthlyBudget: this.monthlyBudget,
            spentThisMonth: monthlyCost,
            remainingBudget: Math.max(0, this.monthlyBudget - monthlyCost),
            dailyAverage: dayOfMonth > 0 ? monthlyCost / dayOfMonth : 0,
            projectedMonthly: dayOfMonth > 0 ? (monthlyCost / dayOfMonth) * daysInMonth : 0,
            providerBudgets,
        };
        this.budgetInfoCache = { result, timestamp: Date.now() };
        return result;
    }

    checkProviderBudget(provider: string, cost: number): boolean {
        const budget = this.providerBudgets[provider.toLowerCase()];
        if (!budget || budget <= 0) return true;
        return this.computeProviderSpend(provider) + cost <= budget;
    }

    getCostHistory(limit = 50): CostEstimate[] {
        return this.costHistory.slice(-limit);
    }

    getDailyCosts(days = 30): Array<{ date: string; cost: number; count: number }> {
        const cutoff = Date.now() - days * 86400000;
        const dayBuckets = new Map<string, { cost: number; count: number }>();
        for (const c of this.costHistory) {
            if (c.timestamp < cutoff) continue;
            const date = new Date(c.timestamp).toISOString().slice(0, 10);
            const b = dayBuckets.get(date) || { cost: 0, count: 0 };
            b.cost += c.totalCost;
            b.count += 1;
            dayBuckets.set(date, b);
        }
        const sorted = Array.from(dayBuckets.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        return sorted.map(([date, v]) => ({
            date,
            cost: Math.round(v.cost * 100) / 100,
            count: v.count,
        }));
    }

    getCostTrend(): {
        direction: 'up' | 'down' | 'stable';
        dailyAvg: number;
        projectedMonthly: number;
        forecast: number;
    } {
        const daily = this.getDailyCosts(7);
        if (daily.length < 2)
            return { direction: 'stable', dailyAvg: 0, projectedMonthly: 0, forecast: 0 };
        const recent =
            daily.slice(-3).reduce((s, d) => s + d.cost, 0) / Math.min(3, daily.slice(-3).length);
        const older =
            daily.slice(0, Math.min(3, daily.length)).reduce((s, d) => s + d.cost, 0) /
            Math.min(3, daily.length);
        const direction = recent > older * 1.2 ? 'up' : recent < older * 0.8 ? 'down' : 'stable';
        const dailyAvg = daily.reduce((s, d) => s + d.cost, 0) / daily.length;
        const projectedMonthly = dailyAvg * 30;
        const forecast =
            direction === 'up'
                ? projectedMonthly * 1.15
                : direction === 'down'
                  ? projectedMonthly * 0.85
                  : projectedMonthly;
        return {
            direction,
            dailyAvg: Math.round(dailyAvg * 100) / 100,
            projectedMonthly: Math.round(projectedMonthly * 100) / 100,
            forecast: Math.round(forecast * 100) / 100,
        };
    }

    detectAnomalies(): Array<{
        date: string;
        cost: number;
        expected: number;
        deviation: number;
        severity: 'low' | 'medium' | 'high';
    }> {
        const daily = this.getDailyCosts(60);
        if (daily.length < 5) return [];
        const costs = daily.map((d) => d.cost);
        const mean = costs.reduce((s, c) => s + c, 0) / costs.length;
        const variance = costs.reduce((s, c) => s + (c - mean) ** 2, 0) / costs.length;
        const stddev = Math.sqrt(variance);
        const anomalies: Array<{
            date: string;
            cost: number;
            expected: number;
            deviation: number;
            severity: 'low' | 'medium' | 'high';
        }> = [];
        for (const d of daily) {
            if (d.cost > 0 && d.cost > mean + stddev) {
                const deviation = (d.cost - mean) / stddev;
                const severity = deviation > 3 ? 'high' : deviation > 2 ? 'medium' : 'low';
                anomalies.push({
                    date: d.date,
                    cost: Math.round(d.cost * 100) / 100,
                    expected: Math.round(mean * 100) / 100,
                    deviation: Math.round(deviation * 100) / 100,
                    severity,
                });
            }
        }
        return anomalies.sort((a, b) => b.deviation - a.deviation);
    }

    getCostByProvider(): Record<string, number> {
        const byProvider: Record<string, number> = {};
        for (const c of this.costHistory) {
            byProvider[c.provider] = (byProvider[c.provider] || 0) + c.totalCost;
        }
        return byProvider;
    }

    getCostByModel(): Record<string, number> {
        const byModel: Record<string, number> = {};
        for (const c of this.costHistory) {
            byModel[c.model] = (byModel[c.model] || 0) + c.totalCost;
        }
        return byModel;
    }

    getCostByAgent(): Record<string, number> {
        const byAgent: Record<string, number> = {};
        for (const c of this.costHistory) {
            if (c.agentId) byAgent[c.agentId] = (byAgent[c.agentId] || 0) + c.totalCost;
        }
        return byAgent;
    }

    getCostByInvocation(): Record<string, number> {
        const byInvocation: Record<string, number> = {};
        for (const c of this.costHistory) {
            if (c.invocationId)
                byInvocation[c.invocationId] = (byInvocation[c.invocationId] || 0) + c.totalCost;
        }
        return byInvocation;
    }

    clearHistory() {
        this.costHistory = [];
        this._invalidateMonthFiltered();
        this.saveHistory();
    }

    getAlertsHistory(): BudgetAlert[] {
        return [...this.alertsHistory];
    }
    getAgentSpend(agentId: string): number {
        return this.agentSpend[agentId] || 0;
    }
    getAlerts(): BudgetAlert[] {
        return [...this.alertsHistory];
    }
    clearAlerts() {
        this.alertsHistory = [];
        this.sentAlerts.clear();
    }
}
