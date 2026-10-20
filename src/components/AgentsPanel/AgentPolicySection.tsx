import React, { useState, useCallback } from 'react';
import { policyService, type AgentPolicy } from '../../kernel/instances';
import { agentPermissionService } from '../../kernel/instances';
import {
    PERMISSION_MODES,
    type PermissionMode,
    type PermissionRule,
} from '../../kernel/contracts/agent-permissions';

/**
 * Agent policy + permission ruleset.
 *
 * The ruleset shown here is the merged, effective one (base → preset → secret
 * protection → agent rules → saved rules) exactly as the tool pipeline
 * evaluates it.
 *
 * The component is mounted with `key={agent.id}`, so switching agents
 * remounts it with fresh state instead of syncing via an effect.
 */
export const AgentPolicySection: React.FC<{ agentId: string }> = ({ agentId }) => {
    const [policy, setPolicy] = useState<AgentPolicy>(() =>
        policyService.getAgentPolicy(agentId),
    );
    const [mode, setMode] = useState<PermissionMode>(
        () => agentPermissionService.getState(agentId).mode,
    );
    const [rules, setRules] = useState<PermissionRule[]>(() =>
        agentPermissionService.getEffectiveRules(agentId),
    );

    const updatePolicy = (patch: Partial<AgentPolicy>) => {
        const next = { ...policy, ...patch };
        setPolicy(next);
        policyService.setAgentPolicy(agentId, next);
    };

    const changeMode = useCallback(
        async (next: PermissionMode) => {
            setMode(next);
            await agentPermissionService.setMode(agentId, next);
            setRules(agentPermissionService.getEffectiveRules(agentId));
        },
        [agentId],
    );

    return (
        <div className="agents-permissions-panel">
            <label className="agents-toggle-row">
                <input
                    type="checkbox"
                    checked={policy.freeOnly}
                    onChange={(event) => updatePolicy({ freeOnly: event.currentTarget.checked })}
                />
                <span>Restrict to free-tier providers</span>
            </label>

            <div className="agents-config-field agents-config-field--full">
                <label className="agents-config-label" htmlFor="agents-permission-mode">
                    Permission Mode
                </label>
                <select
                    id="agents-permission-mode"
                    value={mode}
                    onChange={(e) => void changeMode(e.target.value as PermissionMode)}
                    className="agents-config-select"
                >
                    {PERMISSION_MODES.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.label} — {m.description}
                        </option>
                    ))}
                </select>
            </div>

            <div className="agents-config-field agents-config-field--full">
                <label className="agents-config-label">Effective ruleset</label>
                <ul className="agents-permission-rules">
                    {rules.map((rule, index) => (
                        <li key={`${rule.action}-${rule.resource}-${index}`}>
                            <code>
                                {rule.action} {rule.resource}
                            </code>
                            <span className={`agents-permission-effect agents-permission-effect--${rule.effect}`}>
                                {rule.effect}
                            </span>
                            {rule.note ? <em> {rule.note}</em> : null}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
