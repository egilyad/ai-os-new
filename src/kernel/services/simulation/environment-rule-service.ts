/**
 * Environment rule pipeline (AgentVerse-inspired, G1).
 *
 * Runs rules in order over an observation to produce per-actor views:
 * describe context, order speakers, select relevant facts, update state and
 * enforce visibility. Rules are pluggable; a failing rule is skipped and
 * recorded in appliedRules as `<id>:error` rather than breaking the pipeline.
 */
import type {
    IEnvironmentRuleService,
    EnvironmentRule,
    EnvironmentObservation,
    EnvironmentView,
} from '../../contracts/environment-rules';

export class EnvironmentRuleService implements IEnvironmentRuleService {
    private rules: EnvironmentRule[] = [];

    async init(): Promise<void> {}

    async destroy(): Promise<void> {
        this.rules = [];
    }

    addRule(rule: EnvironmentRule): void {
        this.rules.push(rule);
    }

    async observe(obs: EnvironmentObservation): Promise<Map<string, EnvironmentView>> {
        const views = new Map<string, EnvironmentView>();
        views.set(obs.actorId, {
            actorId: obs.actorId,
            visibleFacts: { ...obs.facts },
            appliedRules: [],
        });
        for (const rule of this.rules) {
            try {
                await rule.apply(obs, views);
                for (const view of views.values()) view.appliedRules.push(rule.id);
            } catch {
                for (const view of views.values()) view.appliedRules.push(`${rule.id}:error`);
            }
        }
        return views;
    }
}
