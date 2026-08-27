import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Post } from '../../kernel/types/forum-types';

interface ModerationQueueProps {
    posts: Post[];
    onModerate: (postId: string, action: string) => void;
}

/**
 * ModerationQueue — recently hidden/removed posts for review.
 */
const ModerationQueue: React.FC<ModerationQueueProps> = ({ posts, onModerate }) => {
    const { t } = useTranslation();
    const moderated = posts.filter((p) => p.moderation.status !== 'normal');
    if (moderated.length === 0) return null;
    return (
        <div
            style={{
                marginTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: 8,
            }}
        >
            <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginBottom: 6 }}>
                {t('forum.moderation')}
            </div>
            {moderated.map((p) => (
                <div
                    key={p.id}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.7rem',
                        color: 'var(--slate-400)',
                        marginBottom: 4,
                    }}
                >
                    <span
                        style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        [{p.moderation.status}] {p.author.displayName}: {p.body.slice(0, 80)}
                    </span>
                    <button
                        onClick={() => onModerate(p.id, 'warn')}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--warning)',
                            cursor: 'pointer',
                            fontSize: '0.62rem',
                        }}
                    >
                        {t('forum.moderate_warn')}
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ModerationQueue;
