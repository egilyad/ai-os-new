import type { ILifecycle } from './lifecycle';

export interface EnvironmentObservation {
    actorId: string;
    step: number;
    facts: Record<string, unknown>;
}

export interface EnvironmentVisibility {
    actorId: string;
    visibleTo: string[];
}

export interface EnvironmentView {
    actorId: string;
    /** Only facts this actor may see, after all rules. */
    visibleFacts: Record<string, unknown>;
    /** Ordered rule ids applied (for audit). */
    appliedRules: string[];
}

export interface EnvironmentRule {
    id: string;
    describe(): string;
    apply(obs: EnvironmentObservation, views: Map<string, EnvironmentView>): void | Promise<void>;
}

/** 5-component environment rule pipeline (AgentVerse G1). */
export interface IEnvironmentRuleService extends ILifecycle {
    addRule(rule: EnvironmentRule): void;
    observe(obs: EnvironmentObservation): Promise<Map<string, EnvironmentView>>;
}
