import type { DebatePhase } from '../../contracts/debate-runtime';
import type { ModePolicy, PolicyType } from '../../contracts/debate-mode-system';
export type { PolicyType } from '../../contracts/debate-mode-system';
export type { DebatePhase } from '../../contracts/debate-runtime';
import { safeJsonParse } from '../../../kernel/utils/safe-json';

// ── Policy Rule DSL ────────────────────────────────────────────────

export type PolicyCondition =
    | { type: 'phase_is'; value: DebatePhase }
    | { type: 'phase_in'; values: DebatePhase[] }
    | { type: 'round_gt'; value: number }
    | { type: 'round_lt'; value: number }
    | { type: 'round_eq'; value: number }
    | { type: 'tokens_gt'; value: number }
    | { type: 'tokens_lt'; value: number }
    | { type: 'cost_gt'; value: number }
    | { type: 'agent_error_rate_gt'; value: number }
    | { type: 'confidence_lt'; value: number }
    | { type: 'pressure_is'; value: string }
    | { type: 'policy_equals'; policyType: PolicyType; value: unknown }
    | { type: 'and'; conditions: PolicyCondition[] }
    | { type: 'or'; conditions: PolicyCondition[] }
    | { type: 'not'; condition: PolicyCondition };

export type PolicyAction =
    | { type: 'set_policy'; policyType: PolicyType; value: unknown }
    | { type: 'adjust_temperature'; delta: number }
    | { type: 'reduce_rounds'; by: number }
    | { type: 'skip_agent'; agentId: string }
    | { type: 'inject_message'; target: string; content: string }
    | { type: 'pause' }
    | { type: 'emit_event'; eventName: string; payload: Record<string, unknown> }
    | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string };

export interface PolicyRule {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly enabled: boolean;
    readonly priority: number;
    readonly condition: PolicyCondition;
    readonly actions: PolicyAction[];
    readonly cooldownMs?: number;
    readonly maxFirings?: number;
}

export interface PolicyContext {
    readonly phase: DebatePhase;
    readonly round: number;
    readonly totalTokens: number;
    readonly totalCost: number;
    readonly confidence: number;
    readonly pressureLevel: string;
    readonly agentErrorRates: Map<string, number>;
    readonly activePolicies: ModePolicy[];
}

export interface PolicyFireResult {
    readonly ruleId: string;
    readonly ruleName: string;
    readonly actionsExecuted: number;
    readonly timestamp: number;
}

export interface PolicyActionExecutor {
    pauseSession(sessionId: string): void;
    emitEvent(eventName: string, payload: Record<string, unknown>): void;
    skipAgent(agentId: string): void;
    log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void;
}

export function executePolicyActions(
    actions: PolicyAction[],
    sessionId: string,
    executor: PolicyActionExecutor,
): void {
    for (const action of actions) {
        switch (action.type) {
            case 'pause':
                executor.pauseSession(sessionId);
                break;
            case 'log':
                executor.log(action.level, action.message);
                break;
            case 'emit_event':
                executor.emitEvent(action.eventName, action.payload ?? {});
                break;
            case 'skip_agent':
                executor.skipAgent(action.agentId);
                break;
            case 'adjust_temperature':
            case 'reduce_rounds':
            case 'inject_message':
                executor.log('info', `Action ${action.type} not yet implemented`);
                break;
        }
    }
}

// ── Policy Engine ──────────────────────────────────────────────────

export class DebatePolicyEngine {
    private rules = new Map<string, PolicyRule>();
    private firings = new Map<string, number[]>();
    private _onRuleFired?: (result: PolicyFireResult) => void;

    /** ILifecycle — stateless, no async work needed. */
    init(): void | Promise<void> {}

    setFireListener(cb: (result: PolicyFireResult) => void): void {
        this._onRuleFired = cb;
    }

    // ── Rule Management ──────────────────────────────────────────

    addRule(rule: PolicyRule): void {
        this.rules.set(rule.id, rule);
    }

    removeRule(id: string): boolean {
        return this.rules.delete(id);
    }

    enableRule(id: string): void {
        const rule = this.rules.get(id);
        if (rule) this.rules.set(id, { ...rule, enabled: true });
    }

    disableRule(id: string): void {
        const rule = this.rules.get(id);
        if (rule) this.rules.set(id, { ...rule, enabled: false });
    }

    getRule(id: string): PolicyRule | undefined {
        return this.rules.get(id);
    }

    listRules(): PolicyRule[] {
        return [...this.rules.values()].sort((a, b) => b.priority - a.priority);
    }

    // ── Evaluation ───────────────────────────────────────────────

    evaluate(ctx: PolicyContext): PolicyAction[] {
        const actions: PolicyAction[] = [];
        const now = Date.now();

        for (const rule of this.listRules()) {
            if (!rule.enabled) continue;

            // Check cooldown
            if (rule.cooldownMs) {
                const lastFiring = this.firings.get(rule.id);
                if (lastFiring && lastFiring.length > 0) {
                    const last = lastFiring[lastFiring.length - 1]!;
                    if (now - last < rule.cooldownMs) continue;
                }
            }

            // Check max firings
            if (rule.maxFirings) {
                const count = this.firings.get(rule.id)?.length ?? 0;
                if (count >= rule.maxFirings) continue;
            }

            // Evaluate condition
            if (this.evaluateCondition(rule.condition, ctx)) {
                actions.push(...rule.actions);

                // Record firing (cap at 100 per rule)
                const history = this.firings.get(rule.id) || [];
                history.push(now);
                if (history.length > 100) history.shift();
                this.firings.set(rule.id, history);

                this._onRuleFired?.({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    actionsExecuted: rule.actions.length,
                    timestamp: now,
                });
            }
        }

        return actions;
    }

    private evaluateCondition(condition: PolicyCondition, ctx: PolicyContext): boolean {
        switch (condition.type) {
            case 'phase_is':
                return ctx.phase === condition.value;
            case 'phase_in':
                return condition.values.includes(ctx.phase);
            case 'round_gt':
                return ctx.round > condition.value;
            case 'round_lt':
                return ctx.round < condition.value;
            case 'round_eq':
                return ctx.round === condition.value;
            case 'tokens_gt':
                return ctx.totalTokens > condition.value;
            case 'tokens_lt':
                return ctx.totalTokens < condition.value;
            case 'cost_gt':
                return ctx.totalCost > condition.value;
            case 'agent_error_rate_gt': {
                const maxRate = Math.max(0, ...ctx.agentErrorRates.values());
                return maxRate > condition.value;
            }
            case 'confidence_lt':
                return ctx.confidence < condition.value;
            case 'pressure_is':
                return ctx.pressureLevel === condition.value;
            case 'policy_equals': {
                const policy = ctx.activePolicies.find((p) => p.type === condition.policyType);
                return policy?.value === condition.value;
            }
            case 'and':
                return condition.conditions.every((c) => this.evaluateCondition(c, ctx));
            case 'or':
                return condition.conditions.some((c) => this.evaluateCondition(c, ctx));
            case 'not':
                return !this.evaluateCondition(condition.condition, ctx);
            default:
                return false;
        }
    }

    // ── Context Builder ──────────────────────────────────────────

    buildContext(
        phase: DebatePhase,
        round: number,
        totalTokens: number,
        totalCost: number,
        confidence: number,
        pressureLevel: string,
        agentErrorRates: Map<string, number>,
        activePolicies: ModePolicy[],
    ): PolicyContext {
        return {
            phase,
            round,
            totalTokens,
            totalCost,
            confidence,
            pressureLevel,
            agentErrorRates,
            activePolicies,
        };
    }

    // ── Serialization ────────────────────────────────────────────

    exportRules(): string {
        return JSON.stringify([...this.rules.values()], null, 2);
    }

    importRules(json: string): { success: boolean; count: number; error?: string } {
        try {
            const rules = safeJsonParse(json) as PolicyRule[];
            for (const rule of rules) {
                this.addRule(rule);
            }
            return { success: true, count: rules.length };
        } catch {
            return { success: false, count: 0, error: 'Invalid JSON' };
        }
    }

    reset(): void {
        this.rules.clear();
        this.firings.clear();
    }

    destroy(): void {
        this.rules.clear();
        this.firings.clear();
        this._onRuleFired = undefined;
    }
}

// ── Built-in Rule Presets ──────────────────────────────────────────

export const BUILTIN_POLICY_RULES: PolicyRule[] = [
    {
        id: 'auto-pause-high-pressure',
        name: 'Auto-pause on Critical Pressure',
        description: 'Pause debate when budget pressure reaches critical level',
        enabled: true,
        priority: 100,
        condition: { type: 'pressure_is', value: 'critical' },
        actions: [{ type: 'pause' }],
        cooldownMs: 30000,
    },
    {
        id: 'skip-failing-agent',
        name: 'Skip Persistently Failing Agent',
        description: 'Skip agent with >70% error rate',
        enabled: true,
        priority: 90,
        condition: { type: 'agent_error_rate_gt', value: 0.7 },
        actions: [{ type: 'log', level: 'warn', message: 'Agent error rate exceeded threshold' }],
        maxFirings: 3,
    },
    {
        id: 'budget-warning',
        name: 'Budget Token Warning',
        description: 'Log warning when token usage exceeds 80% of budget',
        enabled: true,
        priority: 50,
        condition: { type: 'tokens_gt', value: 80000 },
        actions: [
            {
                type: 'emit_event',
                eventName: 'debate:budget:warning',
                payload: { threshold: 80000 },
            },
        ],
    },
];
