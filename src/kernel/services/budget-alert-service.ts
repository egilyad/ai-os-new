import { rootLogger } from './logger-service';
import type {
    IBudgetAlertService,
    BudgetAlertRule,
    BudgetAlertEvent,
} from '../contracts/budget-alert';
import type { IBudgetService } from '../contracts/budget';
import { ssrSafeStorage } from '../utils/ssr-storage';

const LOGGER = rootLogger.child('BudgetAlertService');

const STORAGE_KEY = 'budget_alert_rules';
const HISTORY_KEY = 'budget_alert_history';
const MAX_HISTORY = 100;

function id(): string {
    return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

const PRESET_RULES: Array<Omit<BudgetAlertRule, 'id' | 'createdAt'>> = [
    {
        name: 'Monthly budget 80%',
        condition: 'near_limit',
        threshold: 80,
        action: 'notification',
        enabled: true,
    },
    {
        name: 'Monthly budget exceeded',
        condition: 'above_threshold',
        threshold: 100,
        action: 'block_usage',
        enabled: false,
    },
    {
        name: 'Cost spike detection',
        condition: 'trending_up',
        threshold: 50,
        action: 'warn_user',
        enabled: true,
    },
];

export class BudgetAlertService implements IBudgetAlertService {
    private rules: BudgetAlertRule[] = [];
    private history: BudgetAlertEvent[] = [];
    private budgetService: IBudgetService | null = null;

    setBudgetService(svc: IBudgetService): void {
        this.budgetService = svc;
    }

    async init(): Promise<void> {
        try {
            const raw = ssrSafeStorage.getItem(STORAGE_KEY);
            if (raw) {
                this.rules = JSON.parse(raw);
            } else {
                this.rules = PRESET_RULES.map((r) => ({
                    ...r,
                    id: id(),
                    createdAt: Date.now(),
                }));
            }
            const histRaw = ssrSafeStorage.getItem(HISTORY_KEY);
            if (histRaw) this.history = JSON.parse(histRaw);
        } catch (err) {
            LOGGER.warn('BudgetAlertService', 'init failed', { error: String(err) });
        }
    }

    start(): Promise<void> {
        return Promise.resolve();
    }

    destroy(): void {
        this.rules = [];
        this.history = [];
    }

    private persist(): void {
        ssrSafeStorage.setItem(STORAGE_KEY, JSON.stringify(this.rules));
        ssrSafeStorage.setItem(HISTORY_KEY, JSON.stringify(this.history.slice(-100)));
    }

    getRules(): BudgetAlertRule[] {
        return this.rules;
    }

    addRule(rule: Omit<BudgetAlertRule, 'id' | 'createdAt'>): BudgetAlertRule {
        const r: BudgetAlertRule = { ...rule, id: id(), createdAt: Date.now() };
        this.rules.push(r);
        this.persist();
        return r;
    }

    updateRule(id: string, updates: Partial<BudgetAlertRule>): void {
        const r = this.rules.find((x) => x.id === id);
        if (r) {
            Object.assign(r, updates);
            this.persist();
        }
    }

    removeRule(id: string): void {
        this.rules = this.rules.filter((r) => r.id !== id);
        this.persist();
    }

    getAlertHistory(): BudgetAlertEvent[] {
        return this.history;
    }

    evaluate(): BudgetAlertEvent[] {
        const events: BudgetAlertEvent[] = [];
        if (!this.budgetService) return events;

        const summary = this.budgetService.getSpendSummary();
        const costTrend = this.budgetService.getCostTrend();
        const anomalies = this.budgetService.detectAnomalies();

        for (const rule of this.rules.filter((r) => r.enabled)) {
            let triggered = false;
            let usage: number;
            let message = '';

            if (rule.condition === 'trending_up' || rule.condition === 'trending_down') {
                const isUp = costTrend.direction === 'up';
                const isDown = costTrend.direction === 'down';
                const anomalyLevel = anomalies.length > 0 ? anomalies[0]!.deviation : 0;

                if (rule.condition === 'trending_up') {
                    triggered = isUp && anomalyLevel > rule.threshold / 20;
                } else {
                    triggered = isDown && anomalyLevel > rule.threshold / 20;
                }

                if (triggered) {
                    message = `Rule "${rule.name}" triggered: cost trending ${costTrend.direction} (daily: $${costTrend.dailyAvg}, projected: $${costTrend.projectedMonthly})`;
                }
                const sev = anomalyLevel > 3 ? 'critical' : anomalyLevel > 2 ? 'warn' : 'info';
                if (triggered) {
                    const ev: BudgetAlertEvent = {
                        ruleId: rule.id,
                        ruleName: rule.name,
                        message,
                        timestamp: Date.now(),
                        severity: sev,
                    };
                    events.push(ev);
                    this.history.push(ev);
                    if (this.history.length > MAX_HISTORY)
                        this.history = this.history.slice(-MAX_HISTORY);
                }
                continue;
            }

            if (rule.provider) {
                const p = summary.providers.find(
                    (x) => x.provider.toLowerCase() === rule.provider!.toLowerCase(),
                );
                usage = p ? p.pct : 0;
            } else {
                usage = summary.global.pct;
            }

            switch (rule.condition) {
                case 'above_threshold':
                    triggered = usage > rule.threshold;
                    break;
                case 'below_threshold':
                    triggered = usage < rule.threshold;
                    break;
                case 'near_limit':
                    triggered = usage > rule.threshold - 10 && usage < rule.threshold + 5;
                    break;
            }

            if (triggered) {
                message = `Rule "${rule.name}" triggered: ${rule.provider ? `provider ${rule.provider}` : 'global'} usage at ${usage.toFixed(0)}% (threshold: ${rule.threshold}%)`;
                const ev: BudgetAlertEvent = {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    message,
                    timestamp: Date.now(),
                    severity: usage > 100 ? 'critical' : usage > 80 ? 'warn' : 'info',
                };
                events.push(ev);
                this.history.push(ev);
                if (this.history.length > MAX_HISTORY)
                    this.history = this.history.slice(-MAX_HISTORY);
            }
        }
        this.persist();
        return events;
    }
}
