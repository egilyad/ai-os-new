import React from 'react';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import { AgentAvatar } from '../AgentsPanel/AgentAvatar';

export interface AgentDisplayProps {
    /** Internal agent id — never rendered to the user directly. */
    agentId: string;
    /** card = avatar + name + role + model; compact = avatar + name; name = name only. */
    variant?: 'card' | 'compact' | 'name';
    size?: number;
    showModel?: boolean;
    showProvider?: boolean;
}

/**
 * Canonical, user-facing agent identity card. Resolves the agent through the
 * single `resolveAgentIdentity` seam so the displayed data (name / role /
 * model / provider / avatar) is always human-readable. The internal id is used
 * only for lookup and is never shown as a fallback.
 */
export const AgentDisplay: React.FC<AgentDisplayProps> = ({
    agentId,
    variant = 'card',
    size = 40,
    showModel = true,
    showProvider = true,
}) => {
    const identity = resolveAgentIdentity(agentId);
    const name = identity.displayName || 'Unknown Agent';
    const role = identity.baseRole;
    const model = identity.model;
    const provider = identity.providerName;
    const avatar = identity.avatar;

    if (variant === 'name') {
        return <span>{name}</span>;
    }

    const avatarEl = (
        <AgentAvatar
            agentId={agentId}
            name={name}
            emoji={avatar?.emoji}
            color={avatar?.color}
            url={avatar?.url}
            size={size}
        />
    );

    if (variant === 'compact') {
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                {avatarEl}
                <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                </span>
            </span>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {avatarEl}
            <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                </div>
                {role && (
                    <div style={{ fontSize: 12, color: 'var(--slate-500, #64748b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {role}
                    </div>
                )}
                {showModel && model && (
                    <div style={{ fontSize: 11, color: 'var(--slate-400, #94a3b8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {model}
                        {showProvider && provider ? ` · ${provider}` : ''}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentDisplay;
