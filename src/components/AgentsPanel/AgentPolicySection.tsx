import React, { useState, useEffect } from 'react';
import { policyService, type AgentPolicy } from '../../kernel/instances';

export const AgentPolicySection: React.FC<{ agentId: string }> = ({ agentId }) => {
    const [policy, setPolicy] = useState<AgentPolicy>(() => policyService.getAgentPolicy(agentId));

    useEffect(() => {
        setPolicy(policyService.getAgentPolicy(agentId));
    }, [agentId]);

    const updatePolicy = (patch: Partial<AgentPolicy>) => {
        const next = { ...policy, ...patch };
        setPolicy(next);
        policyService.setAgentPolicy(agentId, next);
    };

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
        </div>
    );
};
