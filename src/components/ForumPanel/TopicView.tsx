import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { eventBus, EVENTS } from '../../kernel/instances';
import { useDebateSessionStore } from '../../stores/debate-session-store';
import type { Post, Topic } from '../../kernel/types/forum-types';
import AuthorBadge from './AuthorBadge';
import PostComposer from './PostComposer';

interface TopicViewProps {
    thread: { topic: Topic; posts: Post[] } | null;
    consensus: string | null;
    onModerate: (postId: string, action: string) => void;
    onVote: (postId: string, vote: 'up' | 'down') => void;
    onCompose: (body: string) => void;
    onReply?: (postId: string) => void;
}

const CONSENSUS_COLORS: Record<string, string> = {
    consensus: '#10b981',
    contested: '#ef4444',
    open: '#f59e0b',
};

function buildThreadMarkdown(thread: { topic: Topic; posts: Post[] }): string {
    const lines: string[] = [];
    lines.push(`# ${thread.topic.title}`);
    lines.push('');
    lines.push(`*Category: ${thread.topic.category} — ${thread.posts.length} posts*`);
    lines.push('');
    lines.push('---');
    lines.push('');
    const sorted = [...thread.posts].sort((a, b) => a.createdAt - b.createdAt);
    for (const p of sorted) {
        const name = p.author?.displayName ?? p.author?.id ?? 'unknown';
        const date = new Date(p.createdAt).toISOString();
        if (p.parentId) lines.push(`> reply to ${p.parentId}`);
        lines.push(`**${name}** — ${date}`);
        lines.push('');
        lines.push(p.body);
        lines.push('');
        lines.push('---');
        lines.push('');
    }
    return lines.join('\n');
}

function downloadMarkdown(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

const PostCard: React.FC<{
    post: Post;
    onModerate: (id: string, action: string) => void;
    onVote: (id: string, vote: 'up' | 'down') => void;
    onQuote?: (post: Post) => void;
    onReply?: (id: string) => void;
}> = ({ post, onModerate, onVote, onQuote, onReply }) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: '#0d1526',
                borderRadius: 8,
                padding: '0.6rem 0.8rem',
                marginBottom: 8,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                <AuthorBadge author={post.author} />
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {post.agentProvenance && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                            {post.agentProvenance.tokensCost} tok
                        </span>
                    )}
                    <span style={{ fontSize: '0.66rem', color: 'var(--slate-400)', fontWeight: 700 }}>
                        {post.score}
                    </span>
                    <button
                        onClick={() => onVote(post.id, 'up')}
                        style={iconBtnSmall}
                        title="upvote"
                    >
                        ▲
                    </button>
                    <button
                        onClick={() => onVote(post.id, 'down')}
                        style={iconBtnSmall}
                        title="downvote"
                    >
                        ▼
                    </button>
                    {onQuote && typeof onQuote === 'function' && (
                        <button onClick={() => onQuote(post)} style={iconBtnSmall} title="quote">
                            ❝
                        </button>
                    )}
                    {onReply && (
                        <button onClick={() => onReply(post.id)} style={iconBtnSmall} title="reply" aria-label="reply">
                            ↩
                        </button>
                    )}
                    <button
                        onClick={() => onModerate(post.id, 'hide')}
                        style={iconBtnSmall}
                        title="hide"
                        aria-label={t('forum.moderate.hide')}
                    >
                        ○
                    </button>
                    <button
                        onClick={() => onModerate(post.id, 'remove')}
                        style={iconBtnSmall}
                        title="remove"
                        aria-label={t('forum.moderate.remove')}
                    >
                        ×
                    </button>
                </div>
            </div>
            <div
                className="forum-post-body"
                dangerouslySetInnerHTML={{ __html: post.renderedHtml }}
                style={{ fontSize: '0.75rem', color: 'var(--slate-300)', marginTop: 6, lineHeight: 1.5 }}
            />
        </div>
    );
};

/**
 * TopicView — selected thread: posts + consensus badge + composer.
 */
const TopicView: React.FC<TopicViewProps> = ({
    thread,
    consensus,
    onModerate,
    onVote,
    onCompose,
    onReply,
}) => {
    const { t } = useTranslation();
    const [postFilter, setPostFilter] = React.useState('');
    const [quote, setQuote] = React.useState<{ text: string; n: number } | null>(null);

    React.useEffect(() => {
        setPostFilter('');
    }, [thread?.topic.id]);

    if (!thread) {
        return (
            <div
                style={{
                    fontSize: '0.75rem',
                    color: 'var(--slate-600)',
                    textAlign: 'center',
                    padding: '2.5rem 0',
                }}
            >
                {t('forum.select_topic')}
            </div>
        );
    }

    const color = consensus ? (CONSENSUS_COLORS[consensus] ?? '#f59e0b') : '#f59e0b';

    const handleEscalate = async (topic: Topic): Promise<void> => {
        // Q3: only contested topics are escalated to a debate (cohesion gate).
        if (consensus !== 'contested') {
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: t('forum.escalate_only_contested'),
                type: 'info',
            });
            return;
        }
        eventBus.emit(EVENTS.FORUM_TOPIC_ESCALATED_TO_DEBATE, {
            topicId: topic.id,
            title: topic.title,
            category: topic.category,
        });
        void useDebateSessionStore
            .getState()
            .createSession(topic.title, 'round_robin', [], {
                roundDelayMs: 2000,
                maxTokens: 4096,
                temperature: 0.7,
                debateTemperature: 0.7,
                useModerator: false,
                timeoutMs: 30000,
                language: 'ru',
            })
            .then(() => {
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: t('forum.escalate_debate') + ': ' + topic.title,
                    type: 'success',
                });
            })
            .catch((e) => {
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: String(e),
                    type: 'error',
                });
            });
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-200)', fontWeight: 700 }}>
                    {thread.topic.title}
                </span>
                {consensus && (
                    <span
                        style={{
                            fontSize: '0.66rem',
                            border: `1px solid ${color}55`,
                            color,
                            borderRadius: 5,
                            padding: '0.1rem 0.4rem',
                        }}
                    >
                        {t(`forum.consensus_${consensus}`)}
                    </span>
                )}
                <span
                    style={{
                        fontSize: '0.68rem',
                        color: 'var(--slate-500)',
                        marginLeft: 'auto',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                    }}
                >
                    <button
                        onClick={() =>
                            downloadMarkdown(
                                `forum-${(thread.topic.title ?? 'topic').slice(0, 50).replace(/[^a-z0-9]/gi, '_')}.md`,
                                buildThreadMarkdown(thread),
                            )
                        }
                        title={t('forum.export_md')}
                        style={exportBtn}
                    >
                        ⬇ {t('forum.export_md')}
                    </button>
                    <button
                        onClick={() => handleEscalate(thread.topic)}
                        title={t('forum.escalate_debate')}
                        style={exportBtn}
                    >
                        ⚔ {t('forum.escalate_debate')}
                    </button>
                    {thread.topic.postCount} {t('forum.posts')}
                </span>
            </div>

            {thread.posts.length === 0 && (
                <div
                    style={{
                        fontSize: '0.72rem',
                        color: 'var(--slate-600)',
                        textAlign: 'center',
                        padding: '1.5rem 0',
                    }}
                >
                    {t('forum.no_posts')}
                </div>
            )}

            <div style={{ marginBottom: 8 }}>
                <input
                    value={postFilter}
                    onChange={(e) => setPostFilter(e.target.value)}
                    placeholder={t('common.search')}
                    style={searchInput}
                />
            </div>

            {thread.posts
                .filter((p) =>
                    postFilter.trim() === ''
                        ? true
                        : (p.body + ' ' + (p.author?.displayName ?? ''))
                              .toLowerCase()
                              .includes(postFilter.toLowerCase()),
                )
                .sort((a, b) => a.createdAt - b.createdAt) // Sort by time first
                .map((p) => (
                    <div key={p.id} style={{ paddingLeft: p.parentId ? '1.5rem' : 0 }}>
                        <PostCard
                            post={p}
                            onModerate={onModerate}
                            onVote={onVote}
                            onQuote={(post) =>
                                setQuote({ text: post.body, n: (quote?.n ?? 0) + 1 })
                            }
                            onReply={onReply}
                        />
                    </div>
                ))}

            <PostComposer
                onSubmit={onCompose}
                draftKey={thread?.topic.id}
                injectText={quote?.text ?? null}
                injectNonce={quote?.n ?? 0}
            />
        </div>
    );
};

const iconBtnSmall: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    color: 'var(--slate-500)',
    cursor: 'pointer',
    fontSize: '0.7rem',
    padding: '0 2px',
};

const exportBtn: React.CSSProperties = {
    border: '1px solid rgba(139,92,246,0.3)',
    background: 'var(--purple-tint)',
    color: '#c4b5fd',
    cursor: 'pointer',
    fontSize: '0.66rem',
    borderRadius: 6,
    padding: '0.2rem 0.5rem',
};

const searchInput: React.CSSProperties = {
    width: '100%',
    background: 'var(--slate-900)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: 'var(--slate-200)',
    fontSize: '0.7rem',
    padding: '0.32rem 0.55rem',
};

export default TopicView;
