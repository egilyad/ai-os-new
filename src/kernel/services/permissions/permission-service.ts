/**
 * Per-agent permission state and evaluation.
 *
 * Combines the three rule dialects ported from the reference harnesses into a
 * single persisted policy store:
 *
 *  - agent-scoped ruleset (OpenCode) — last matching rule wins;
 *  - session permission mode (OpenClaw) — read-only / guarded / workspace / full;
 *  - named preset binding sandbox + approval (DeepSeek Harness);
 *  - "always allow" saved rules that survive across sessions (OpenCode
 *    `PermissionSaved`, project scoped);
 *  - consecutive-denial circuit breaker (Hermes) — after N consecutive human
 *    rejections the agent is hard-stopped for that action instead of asking
 *    again, which keeps the model prompt stable and stops approval loops.
 */
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
import {
    BASE_PERMISSION_RULES,
    PERMISSION_MODE_TO_PRESET,
    SECRET_PROTECTION_RULES,
    type PermissionEffect,
    type PermissionMode,
    type PermissionPresetId,
    type PermissionRule,
    evaluatePermission,
    presetById,
} from '../../contracts/agent-permissions';

const LOGGER = rootLogger.child('AgentPermissionService');

const STATE_KEY = 'super_agents_agent_permissions';
const SAVED_KEY = 'super_agents_permission_saved';

export interface AgentPermissionState {
    agentId: string;
    mode: PermissionMode;
    preset: PermissionPresetId;
    /** Agent-specific rules, evaluated after the mode ruleset. */
    rules: PermissionRule[];
    /** Consecutive human rejections (Hermes circuit breaker). */
    consecutiveDenials: number;
    updatedAt: number;
}

export interface PermissionDecision {
    agentId: string;
    action: string;
    resource: string;
    effect: PermissionEffect;
    reason: string;
    /** True when the circuit breaker escalated an `ask` into a hard `deny`. */
    escalated: boolean;
    rule: PermissionRule;
    mode: PermissionMode;
    preset: PermissionPresetId;
}

export interface AgentPermissionServiceDeps {
    eventBus: {
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
}

function defaultState(agentId: string): AgentPermissionState {
    return {
        agentId,
        mode: 'guarded',
        preset: 'guarded',
        rules: [],
        consecutiveDenials: 0,
        updatedAt: Date.now(),
    };
}

export class AgentPermissionService {
    /** Consecutive denials before an `ask` is escalated into a hard `deny`. */
    static readonly DENIAL_ESCALATION_THRESHOLD = 3;

    private deps: AgentPermissionServiceDeps;
    private states: Record<string, AgentPermissionState> = {};
    private savedRules: PermissionRule[] = [];
    private loaded = false;

    constructor(deps: AgentPermissionServiceDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        if (this.loaded) return;
        this.loaded = true;
        try {
            const stored = await this.deps.database.getKv<Record<string, AgentPermissionState>>(
                STATE_KEY,
            );
            if (stored) this.states = { ...stored };
            const saved = await this.deps.database.getKv<PermissionRule[]>(SAVED_KEY);
            if (saved) this.savedRules = saved;
        } catch (e) {
            LOGGER.error('AgentPermissionService', 'Failed to load permission state', { error: e });
        }
    }

    private async persist(): Promise<void> {
        try {
            await this.deps.database.setKv(STATE_KEY, this.states);
        } catch (e) {
            LOGGER.error('AgentPermissionService', 'Failed to persist permission state', {
                error: e,
            });
        }
    }

    getState(agentId: string): AgentPermissionState {
        return this.states[agentId] ?? defaultState(agentId);
    }

    getSavedRules(): PermissionRule[] {
        return [...this.savedRules];
    }

    async addSavedRule(rule: PermissionRule): Promise<void> {
        this.savedRules = [...this.savedRules, { ...rule }];
        await this.deps.database.setKv(SAVED_KEY, this.savedRules);
        this.deps.eventBus.emit(EVENTS.PERMISSION_UPDATED, { agentId: '*' });
    }

    async removeSavedRule(index: number): Promise<void> {
        this.savedRules = this.savedRules.filter((_, i) => i !== index);
        await this.deps.database.setKv(SAVED_KEY, this.savedRules);
        this.deps.eventBus.emit(EVENTS.PERMISSION_UPDATED, { agentId: '*' });
    }

    /**
     * Effective ruleset for an agent: base → preset → secret protection →
     * agent rules → saved rules. Later sets win because the evaluator takes
     * the last matching rule.
     */
    getEffectiveRules(agentId: string): PermissionRule[] {
        const state = this.getState(agentId);
        const preset = presetById(state.preset);
        return [
            ...BASE_PERMISSION_RULES,
            ...preset.rules,
            ...SECRET_PROTECTION_RULES,
            ...state.rules,
            ...this.savedRules,
        ];
    }

    async setMode(agentId: string, mode: PermissionMode): Promise<void> {
        const state = {
            ...this.getState(agentId),
            mode,
            preset: PERMISSION_MODE_TO_PRESET[mode],
            updatedAt: Date.now(),
        };
        this.states[agentId] = state;
        await this.persist();
        this.deps.eventBus.emit(EVENTS.PERMISSION_UPDATED, { agentId, mode });
    }

    async setPreset(agentId: string, preset: PermissionPresetId): Promise<void> {
        const state = { ...this.getState(agentId), preset, updatedAt: Date.now() };
        this.states[agentId] = state;
        await this.persist();
        this.deps.eventBus.emit(EVENTS.PERMISSION_UPDATED, { agentId });
    }

    async setRules(agentId: string, rules: PermissionRule[]): Promise<void> {
        const state = {
            ...this.getState(agentId),
            rules: rules.map((r) => ({ ...r })),
            updatedAt: Date.now(),
        };
        this.states[agentId] = state;
        await this.persist();
        this.deps.eventBus.emit(EVENTS.PERMISSION_UPDATED, { agentId });
    }

    async resetRules(agentId: string): Promise<void> {
        await this.setRules(agentId, []);
    }

    /** Record a human rejection — drives the consecutive-denial circuit breaker. */
    async recordDenial(agentId: string): Promise<number> {
        const state = this.getState(agentId);
        const consecutiveDenials = state.consecutiveDenials + 1;
        this.states[agentId] = { ...state, consecutiveDenials, updatedAt: Date.now() };
        await this.persist();
        return consecutiveDenials;
    }

    async resetDenials(agentId: string): Promise<void> {
        const state = this.getState(agentId);
        if (state.consecutiveDenials === 0) return;
        this.states[agentId] = { ...state, consecutiveDenials: 0, updatedAt: Date.now() };
        await this.persist();
    }

    /**
     * Evaluate a tool request for an agent.
     *
     * `ask` is escalated into `deny` once the agent accumulated
     * `DENIAL_ESCALATION_THRESHOLD` consecutive human rejections — the same
     * idea as Hermes' denial circuit breaker, which stops the model from
     * looping on the same forbidden call.
     */
    async evaluate(
        agentId: string,
        action: string,
        resource: string,
    ): Promise<PermissionDecision> {
        const state = this.getState(agentId);
        const rule = evaluatePermission(action, resource, this.getEffectiveRules(agentId));
        let effect = rule.effect;
        let reason = rule.note ?? defaultReason(effect, action, resource);
        let escalated = false;

        if (
            effect === 'ask' &&
            state.consecutiveDenials >= AgentPermissionService.DENIAL_ESCALATION_THRESHOLD
        ) {
            effect = 'deny';
            escalated = true;
            reason = `Escalated to a hard stop after ${state.consecutiveDenials} consecutive denials`;
        }

        const decision: PermissionDecision = {
            agentId,
            action,
            resource,
            effect,
            reason,
            escalated,
            rule,
            mode: state.mode,
            preset: state.preset,
        };
        this.deps.eventBus.emit(EVENTS.PERMISSION_DECIDED, {
            agentId,
            action,
            resource,
            effect,
            escalated,
            reason,
        });
        return decision;
    }
}

function defaultReason(effect: PermissionEffect, action: string, resource: string): string {
    switch (effect) {
        case 'allow':
            return `Allowed by ruleset (${action} ${resource})`;
        case 'deny':
            return `Denied by ruleset (${action} ${resource})`;
        case 'ask':
            return `Requires approval (${action} ${resource})`;
    }
}
