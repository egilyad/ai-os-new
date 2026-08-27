import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { ForumAuthor } from '../../kernel/types/forum-types';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import { AgentAvatar } from '../AgentsPanel/AgentAvatar';

interface AuthorBadgeProps {
    author: ForumAuthor;
}

/**
 * AuthorBadge — visual badge for human vs agent authors. Agent authors resolve
 * their canonical identity (avatar + display name) when the id maps to a
 * topology agent; otherwise the supplied display name / id is used.
 */
const AuthorBadge: React.FC<AuthorBadgeProps> = ({ author }) => {
    const { t } = useTranslation();
    const isAgent = author.kind === 'agent';
    const identity = isAgent ? resolveAgentIdentity(author.id) : null;
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.66rem',
                fontWeight: 600,
                padding: '0.1rem 0.4rem',
                borderRadius: 5,
                border: `1px solid ${isAgent ? '#8b5cf655' : '#38bdf855'}`,
                color: isAgent ? '#c4b5fd' : '#7dd3fc',
                background: isAgent ? '#8b5cf611' : '#38bdf811',
            }}
        >
            {isAgent && (
                <AgentAvatar
                    agentId={author.id}
                    name={author.displayName || identity?.displayName}
                    size={16}
                    emoji={identity?.avatar.emoji}
                    color={identity?.avatar.color}
                    url={identity?.avatar.url}
                />
            )}
            {isAgent ? '◆' : '●'} {author.displayName || identity?.displayName || t('forum.author_unknown')}
            {author.roleId && isAgent ? ` · ${author.roleId}` : ''}
            <span style={{ color: 'var(--slate-500)', fontWeight: 400 }}>
                {isAgent ? t('forum.author_agent') : t('forum.author_human')}
            </span>
        </span>
    );
};

export default AuthorBadge;
