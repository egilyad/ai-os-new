import React from 'react';
import { AgentAvatar } from '../AgentsPanel/AgentAvatar';
import type { AgentIdentityView } from '../../kernel/services/agent-identity';

const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    minWidth: 0,
};

/** A compact, canonical agent identity presentation.
 *
 * Shows the persistent avatar (same everywhere), the display name, the agent's
 * base role / specialization, and — when supplied — the per-conversation role
 * it is performing in the current workflow. Model / provider / lens are shown
 * as secondary metadata when `showDetails` is set. */
const AgentIdentityChip: React.FC<{
    identity: AgentIdentityView;
    /** Per-conversation / per-debate role, distinct from `identity.baseRole`. */
    conversationRole?: string;
    showDetails?: boolean;
    size?: number;
}> = ({ identity, conversationRole, showDetails = false, size = 36 }) => {
    const subtitle = [identity.baseRole, identity.specializations[0]].filter(Boolean).join(' · ');
    const meta = [
        identity.model ? `Model: ${identity.model}` : '',
        identity.providerName ?? identity.provider ?? '',
        identity.lensNames.length > 0 ? `Lens: ${identity.lensNames.join(', ')}` : '',
    ].filter(Boolean);

    return (
        <div style={rowStyle}>
            {identity.avatar.url ? (
                <img
                    src={identity.avatar.url}
                    alt={identity.displayName}
                    width={size}
                    height={size}
                    style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
            ) : (
                <AgentAvatar agentId={identity.id} name={identity.displayName} size={size} />
            )}
            <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.2 }}>
                    {identity.displayName}
                    {identity.firstName &&
                    identity.lastName &&
                    identity.displayName !== `${identity.firstName} ${identity.lastName}` ? (
                        <span style={{ opacity: 0.6, fontWeight: 400 }}>
                            {' '}
                            · {identity.firstName} {identity.lastName}
                        </span>
                    ) : null}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.75, lineHeight: 1.2 }}>
                    {subtitle}
                    {conversationRole ? <b> · {conversationRole}</b> : null}
                </div>
                {showDetails && meta.length > 0 && (
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, lineHeight: 1.2 }}>
                        {meta.join(' · ')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentIdentityChip;
