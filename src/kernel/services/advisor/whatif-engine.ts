import type { IWhatIfEngine, WhatIfScenario, RuntimeScenario } from '../../contracts/advisor';

export interface FreeTierLimit {
  requestsPerDay: number;
  tokensPerDay: number;
}

export interface WhatIfEngineDeps {
  keyService: {
    getKeys: () => Array<{
      id: string; provider: string; status: string; label?: string; latency?: number;
      stats?: {
        successCount?: number; errorCount?: number;
        extended?: {
          usageToday?: { requests: number };
          errorBreakdown?: { rateLimit?: number };
          estimatedCost?: number;
        };
      };
      availableModels?: string[];
    }>;
  };
  budgetService: {
    getBudgetInfo: () => {
      monthlyBudget: number; spentThisMonth: number; remainingBudget: number;
      dailyAverage: number; projectedMonthly: number;
      providerBudgets: Array<{ provider: string; monthlyBudget: number; spentThisMonth: number; remainingBudget: number }>;
    };
  };
  freeTierLimits: Record<string, FreeTierLimit>;
}

export class WhatIfEngine implements IWhatIfEngine {
  private deps: WhatIfEngineDeps;
  private avgLatency = 0;

  constructor(deps: WhatIfEngineDeps) {
    this.deps = deps;
  }

  setAvgLatency(ms: number) { this.avgLatency = ms; }

  analyzeAddKey(providerToAdd: string): WhatIfScenario {
    const keys = this.deps.keyService.getKeys();
    const existingKeys = keys.filter(k => k.provider.toLowerCase() === providerToAdd.toLowerCase());
    const limit = this.deps.freeTierLimits[providerToAdd]?.requestsPerDay || 0;
    const dailyLimitIncrease = limit;

    const totalRequests = keys.reduce((s, k) => s + (k.stats?.successCount || 0), 0);
    const current429s = keys.reduce((s, k) => s + (k.stats?.extended?.errorBreakdown?.rateLimit || 0), 0);
    const current429Rate = totalRequests > 0 ? current429s / totalRequests : 0;
    const new429Rate = Math.max(0, current429Rate - current429Rate * (1 / (existingKeys.length + 1)));
    const probability429Reduction = Math.round((current429Rate - new429Rate) * 100);

    const avgCostPerRequest = keys.length > 0
      ? keys.reduce((s, k) => s + (k.stats?.extended?.estimatedCost || 0), 0) / Math.max(1, totalRequests) : 0;
    const additionalCostPerDay = avgCostPerRequest * limit * 0.5;
    const currentCost = totalRequests * avgCostPerRequest;
    const costChange = currentCost > 0 ? (additionalCostPerDay / currentCost) * 100 : 0;

    const avgLatency = keys.filter(k => k.latency).reduce((s, k) => s + (k.latency || 0), 0) / Math.max(1, keys.filter(k => k.latency).length);

    return {
      id: crypto.randomUUID(),
      title: `Add ${providerToAdd} key`,
      description: `Adding another ${providerToAdd} key increases daily capacity by ${limit.toLocaleString()} requests and reduces 429 probability by ~${probability429Reduction}%.`,
      type: 'add_key',
      impact: {
        dailyLimitIncrease,
        costChange: Math.round(costChange * 100) / 100,
        probability429Reduction,
        latencyImpact: avgLatency > 0 ? `${Math.round(avgLatency)}ms (current avg)` : 'Unknown',
      },
    };
  }

  analyzeSwitchProvider(fromProvider: string, toProvider: string): WhatIfScenario {
    const fromLimit = this.deps.freeTierLimits[fromProvider]?.requestsPerDay || 0;
    const toLimit = this.deps.freeTierLimits[toProvider]?.requestsPerDay || 0;

    return {
      id: crypto.randomUUID(),
      title: `Switch from ${fromProvider} to ${toProvider}`,
      description: toLimit > fromLimit
        ? `Switching to ${toProvider} increases daily capacity by ${(toLimit - fromLimit).toLocaleString()} requests.`
        : `${toProvider} has lower limits (${toLimit.toLocaleString()} vs ${fromLimit.toLocaleString()}). Consider keeping both.`,
      type: 'switch_provider',
      impact: {
        dailyLimitIncrease: toLimit - fromLimit,
        costChange: 0,
        probability429Reduction: toLimit > fromLimit ? 15 : -10,
        latencyImpact: toLimit > fromLimit ? 'May vary by model' : 'Potentially slower',
      },
    };
  }

  analyzeBudgetChange(currentBudget: number, newBudget: number): WhatIfScenario {
    const keys = this.deps.keyService.getKeys();
    const totalCost = keys.reduce((s, k) => s + (k.stats?.extended?.estimatedCost || 0), 0);

    return {
      id: crypto.randomUUID(),
      title: `Change budget to $${newBudget}/month`,
      description: currentBudget === 0
        ? `Setting a $${newBudget}/month budget enables cost alerts when spending approaches the limit.`
        : `Increasing budget from $${currentBudget} to $${newBudget} allows ${Math.round((newBudget - currentBudget) / (totalCost || 1))} more days of current usage.`,
      type: 'add_budget',
      impact: {
        dailyLimitIncrease: 0,
        costChange: ((newBudget - currentBudget) / Math.max(1, currentBudget)) * 100,
        probability429Reduction: newBudget > currentBudget ? 5 : 0,
        latencyImpact: 'No direct impact',
      },
    };
  }

  getRuntimeScenarios(): RuntimeScenario[] {
    const results: RuntimeScenario[] = [];
    const keys = this.deps.keyService.getKeys();
    const providerKeyCount: Record<string, { active: number; total: number; used: number; limit: number }> = {};

    for (const key of keys) {
      const p = key.provider;
      if (!providerKeyCount[p]) providerKeyCount[p] = { active: 0, total: 0, used: 0, limit: 0 };
      providerKeyCount[p].total++;
      if (key.status === 'active') providerKeyCount[p].active++;
      const lim = this.deps.freeTierLimits[p]?.requestsPerDay || 0;
      if (lim > 0) {
        providerKeyCount[p].limit = lim;
        providerKeyCount[p].used += key.stats?.extended?.usageToday?.requests || 0;
      }
    }

    for (const [provider, info] of Object.entries(providerKeyCount)) {
      if (info.limit <= 0) continue;
      const limitPerKey = info.limit;
      const currentCapacity = info.active * limitPerKey;
      const usagePct = currentCapacity > 0 ? (info.used / currentCapacity) * 100 : 0;
      const newKeyCapacity = (info.active + 1) * limitPerKey;
      const newUsagePct = newKeyCapacity > 0 ? (info.used / newKeyCapacity) * 100 : 0;

      if (usagePct > 70) {
        results.push({
          scenario: `Add a ${provider} key`,
          improvement: `Daily capacity: ${currentCapacity.toLocaleString()} → ${newKeyCapacity.toLocaleString()} reqs (${Math.round(usagePct)}% → ${Math.round(newUsagePct)}% usage). Adds ${limitPerKey.toLocaleString()} more reqs/day.`,
          details: `Current ${info.active} active key(s) at ${Math.round(usagePct)}% usage. Adding 1 more key drops utilization to ${Math.round(newUsagePct)}% and reduces 429 probability by ~${Math.round((1 - newUsagePct / usagePct) * 100)}%.`,
          impact: usagePct > 90 ? 'high' : 'medium',
        });
      }
    }

    const groqActive = providerKeyCount['groq']?.active || 0;
    const geminiActive = providerKeyCount['gemini']?.active || 0;
    if (groqActive > 0 && geminiActive > 0 && this.avgLatency > 2000) {
      results.push({
        scenario: 'Shift short prompts to Groq',
        improvement: `Estimated latency reduction: ${Math.round(this.avgLatency)}ms → ~800ms`,
        details: `Groq typically responds in <500ms vs ${Math.round(this.avgLatency)}ms average. Routing prompts <100 chars through Groq could reduce p50 latency by 60%+.`,
        impact: 'medium',
      });
    }

    const budget = this.deps.budgetService.getBudgetInfo();
    if (budget.monthlyBudget > 0 && budget.projectedMonthly > budget.monthlyBudget) {
      const overage = budget.projectedMonthly - budget.monthlyBudget;
      results.push({
        scenario: 'Switch to free tier models for non-critical tasks',
        improvement: `Projected: $${budget.projectedMonthly.toFixed(2)} → within $${budget.monthlyBudget.toFixed(2)} budget. Saves ~$${overage.toFixed(2)}/mo`,
        details: `Free tier models (Gemini Flash, Groq Llama) cost $0. Moving 50% of non-urgent requests to free models keeps spending within budget. Current burn rate: $${budget.dailyAverage.toFixed(2)}/day.`,
        impact: budget.projectedMonthly > budget.monthlyBudget * 1.2 ? 'high' : 'medium',
      });
    }

    return results;
  }

  getPromptCachingAdvice(): { cacheable: boolean; reuseCount: number; estimatedSavings: string; details: string } | null {
    return null;
  }
}
