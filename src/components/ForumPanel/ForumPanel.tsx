import React from 'react';
import { MessagesSquare } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { forumService } from '../../kernel/instances/services-extras';
import { eventBus, EVENTS } from '../../kernel/instances';
import type { ForumAuthor, Post, Topic } from '../../kernel/types/forum-types';
import TopicList from './TopicList';
import TopicView from './TopicView';
import ModerationQueue from './ModerationQueue';
import ForumHeatmap from './ForumHeatmap';
import { Button } from '../../components/Common';

/**
 * ForumPanel — async persistent threads UI: topic list + thread view +
 * moderation + activity heatmap.
 */
const ForumPanel: React.FC = () => {
    const { t } = useTranslation();
    const [topics, setTopics] = React.useState<Topic[]>([]);
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const [thread, setThread] = React.useState<{ topic: Topic; posts: Post[] } | null>(null);
    const [consensus, setConsensus] = React.useState<string | null>(null);
    const [heatmap, setHeatmap] = React.useState<Array<{ category: string; count: number }>>([]);

    const currentAuthor: ForumAuthor = {
        kind: 'human',
        id: 'local-user',
        displayName: t('forum.you'),
    };

    const [page, setPage] = React.useState(0);

    const refreshTopics = React.useCallback(async () => {
        const pageData = await forumService.listTopics({ page, pageSize: 50 });
        setTopics(pageData.items);
        const counts = new Map<string, number>();
        for (const tp of pageData.items) {
            counts.set(tp.category, (counts.get(tp.category) ?? 0) + tp.postCount);
        }
        setHeatmap([...counts.entries()].map(([category, count]) => ({ category, count })));
    }, [page]);

    // Combined Effect for lifecycle + real-time
    React.useEffect(() => {
        void refreshTopics();
        const unsubs = [
            eventBus.onSafe(EVENTS.FORUM_TOPIC_CREATED, () => void refreshTopics()),
            eventBus.onSafe(EVENTS.FORUM_POST_ADDED, () => void refreshTopics()),
        ];
        return () => unsubs.forEach((u) => u());
    }, [refreshTopics]);

    const openThread = async (id: string): Promise<void> => {
        setSelectedId(id);
        const th = await forumService.getThread(id);
        setThread(th);
        const cv = await forumService.getConsensus(id);
        setConsensus(cv?.status ?? null);
    };

    const handleCreate = async (title: string, category: string): Promise<void> => {
        const id = await forumService.createTopic({ title, category, author: currentAuthor });
        await refreshTopics();
        await openThread(id);
    };

    const [replyTo, setReplyTo] = React.useState<string | null>(null);
    const handleCompose = async (body: string): Promise<void> => {
        if (!selectedId) return;
        await forumService.postMessage(selectedId, currentAuthor, body, replyTo ?? undefined);
        setReplyTo(null);
        await openThread(selectedId);
        await refreshTopics();
    };

    const handleModerate = async (postId: string, action: string): Promise<void> => {
        if (!selectedId) return;
        await forumService.moderatePost(
            postId,
            action as 'hide' | 'remove' | 'warn',
            t('forum.moderation_reason'),
        );
        await openThread(selectedId);
    };

    const handleVote = async (postId: string, vote: 'up' | 'down'): Promise<void> => {
        if (!selectedId) return;
        await forumService.votePost(postId, currentAuthor, vote);
        await openThread(selectedId);
    };

    const handlePin = async (topicId: string, pinned: boolean): Promise<void> => {
        await forumService.pinTopic(topicId, !pinned);
        await refreshTopics();
    };

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '1rem 1.25rem 0.6rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessagesSquare size={18} color="#8b5cf6" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {t('forum.title')}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void refreshTopics()}
                    title={t('forum.refresh')}
                    aria-label={t('forum.refresh')}
                >
                    ↻
                </Button>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                {/* Left: topics */}
                <div
                    style={{
                        width: 340,
                        overflowY: 'auto',
                        padding: '0.9rem 1rem',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <TopicList
                        topics={topics}
                        selectedId={selectedId}
                        onSelect={(id) => void openThread(id)}
                        onCreate={(title, cat) => void handleCreate(title, cat)}
                        onPin={(id, pinned) => void handlePin(id, pinned)}
                        page={page}
                        onPageChange={setPage}
                    />
                    <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginBottom: 6 }}>
                            {t('forum.heatmap_title')}
                        </div>
                        <ForumHeatmap categories={heatmap} />
                    </div>
                </div>

                {/* Right: thread */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 1rem' }}>
                    {replyTo && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            Replying to {replyTo.slice(0, 8)} <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--slate-500)', cursor: 'pointer', fontSize: '0.7rem' }}>✕ cancel</button>
                        </div>
                    )}
                    <TopicView
                        thread={thread}
                        consensus={consensus}
                        onModerate={(id, action) => void handleModerate(id, action)}
                        onVote={(id, vote) => void handleVote(id, vote)}
                        onCompose={(body) => void handleCompose(body)}
                        onReply={(id) => setReplyTo(id)}
                    />
                    {thread && (
                        <ModerationQueue
                            posts={thread.posts}
                            onModerate={(id, action) => void handleModerate(id, action)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForumPanel;
