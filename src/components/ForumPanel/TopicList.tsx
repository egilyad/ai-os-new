import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Topic } from '../../kernel/types/forum-types';

interface TopicListProps {
    topics: Topic[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onCreate: (title: string, category: string) => void;
    onPin: (topicId: string, pinned: boolean) => void;
    page: number;
    onPageChange: (page: number) => void;
}

const SYSTEM_CATEGORIES = new Set(['case-study', 'announcements']);

const TopicRow: React.FC<{
    topic: Topic;
    active: boolean;
    onClick: () => void;
    onPin: (topicId: string, pinned: boolean) => void;
    t: (k: string) => string;
}> = ({ topic, active, onClick, onPin, t }) => (
    <div
        onClick={onClick}
        style={{
            border: `1px solid ${active ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
            background: active ? '#1a1433' : '#0d1526',
            borderRadius: 8,
            padding: '0.55rem 0.7rem',
            marginBottom: 6,
            cursor: 'pointer',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {topic.pinned && <span style={{ color: 'var(--warning)', fontSize: '0.68rem' }}>📌</span>}
            <span style={{ fontSize: '0.76rem', color: 'var(--slate-200)', fontWeight: 600, flex: 1 }}>
                {topic.title}
            </span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onPin(topic.id, topic.pinned);
                }}
                title={topic.pinned ? t('forum.unpin') : t('forum.pin')}
                style={{
                    border: topic.pinned
                        ? '1px solid rgba(245,158,11,0.6)'
                        : '1px solid rgba(255,255,255,0.12)',
                    background: topic.pinned ? 'rgba(245,158,11,0.15)' : 'transparent',
                    color: topic.pinned ? '#fcd34d' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    borderRadius: 5,
                    padding: '0 4px',
                }}
            >
                📌
            </button>
            {SYSTEM_CATEGORIES.has(topic.category) && (
                <span
                    title={t('forum.system_topic')}
                    style={{
                        fontSize: '0.6rem',
                        color: '#34d399',
                        border: '1px solid rgba(52,211,153,0.4)',
                        borderRadius: 4,
                        padding: '0 3px',
                    }}
                >
                    🤖 {t('forum.system_topic')}
                </span>
            )}
        </div>
        <div
            style={{
                display: 'flex',
                gap: 10,
                marginTop: 4,
                fontSize: '0.66rem',
                color: 'var(--slate-500)',
            }}
        >
            <span>{topic.category}</span>
            <span>{topic.postCount} posts</span>
            <span>score {topic.score}</span>
        </div>
    </div>
);

const TopicList: React.FC<TopicListProps> = ({
    topics,
    selectedId,
    onSelect,
    onCreate,
    onPin,
    page,
    onPageChange,
}) => {
    const { t } = useTranslation();
    const [title, setTitle] = React.useState('');
    const [category, setCategory] = React.useState('general');
    const [filter, setFilter] = React.useState('');
    const [catFilter, setCatFilter] = React.useState('');

    const categories = React.useMemo(
        () => [...new Set(topics.map((tp) => tp.category))].sort(),
        [topics],
    );

    const filteredTopics = topics.filter(
        (tp) =>
            (catFilter === '' || tp.category === catFilter) &&
            tp.title.toLowerCase().includes(filter.toLowerCase()),
    );

    const submit = (): void => {
        if (!title.trim()) return;
        onCreate(title.trim(), category.trim() || 'general');
        setTitle('');
    };

    return (
        <div>
            <div style={{ marginBottom: 8 }}>
                <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder={t('common.search')}
                    style={{ ...inputStyle, width: '100%' }}
                />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                <button
                    onClick={() => setCatFilter('')}
                    style={catFilter === '' ? chipStyleActive : chipStyle}
                >
                    {t('forum.filter_all')}
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCatFilter(cat)}
                        style={catFilter === cat ? chipStyleActive : chipStyle}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8, alignItems: 'center' }}>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') submit();
                    }}
                    placeholder={t('forum.topic_title_placeholder')}
                    style={inputStyle}
                />
                <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder={t('forum.category')}
                    style={{ ...inputStyle, width: 84 }}
                />
                <button onClick={submit} style={primaryBtn}>
                    +
                </button>
            </div>

            {filteredTopics.length === 0 && (
                <div
                    style={{
                        fontSize: '0.72rem',
                        color: 'var(--slate-600)',
                        textAlign: 'center',
                        padding: '1.5rem 0',
                    }}
                >
                    {t('forum.no_topics')}
                </div>
            )}

            {filteredTopics.map((tp) => (
                <TopicRow
                    key={tp.id}
                    topic={tp}
                    active={tp.id === selectedId}
                    onClick={() => onSelect(tp.id)}
                    onPin={onPin}
                    t={t}
                />
            ))}
            {topics.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        gap: 10,
                        justifyContent: 'center',
                        marginTop: 10,
                        alignItems: 'center',
                    }}
                >
                    <button
                        onClick={() => onPageChange(Math.max(0, page - 1))}
                        style={btnStyle('#94a3b8')}
                    >
                        Prev
                    </button>
                    <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Page {page + 1}</span>
                    <button onClick={() => onPageChange(page + 1)} style={btnStyle('#94a3b8')}>
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

const btnStyle = (color: string): React.CSSProperties => ({
    background: 'none',
    border: `1px solid ${color}`,
    color,
    cursor: 'pointer',
    padding: '0.25rem 0.55rem',
    borderRadius: 4,
    fontSize: '0.72rem',
});

const chipStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'var(--slate-400)',
    cursor: 'pointer',
    padding: '0.2rem 0.5rem',
    borderRadius: 999,
    fontSize: '0.66rem',
};

const chipStyleActive: React.CSSProperties = {
    background: 'rgba(139,92,246,0.15)',
    border: '1px solid rgba(139,92,246,0.6)',
    color: '#c4b5fd',
    cursor: 'pointer',
    padding: '0.2rem 0.5rem',
    borderRadius: 999,
    fontSize: '0.66rem',
};

const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    background: 'var(--slate-900)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: 'var(--slate-200)',
    fontSize: '0.7rem',
    padding: '0.32rem 0.55rem',
};

const primaryBtn: React.CSSProperties = {
    padding: '0.32rem 0.7rem',
    borderRadius: 6,
    border: 'none',
    background: 'var(--purple)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.7rem',
};

export default TopicList;
