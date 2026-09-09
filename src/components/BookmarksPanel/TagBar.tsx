import { Tag } from 'lucide-react';
import { textSecondaryXs } from '../../styles/common';
import { useTranslation } from '../../i18n/useTranslation';

interface TagBarProps {
    allTags: string[];
    activeTag: string | null;
    onSelect: (tag: string | null) => void;
}

export const TagBar: React.FC<TagBarProps> = ({ allTags, activeTag, onSelect }) => {
    const { t } = useTranslation();
    const filteredTags = activeTag ? allTags.filter((tg) => tg !== activeTag) : allTags;

    if (filteredTags.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <Tag size={14} color="#94a3b8" />
            <span style={{ ...textSecondaryXs, marginRight: 4 }}>{t('bookmarks.tags_label')}</span>
            {activeTag && (
                <button
                    onClick={() => onSelect(null)}
                    style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 12,
                        border: '1px solid #ef4444',
                        background: 'var(--error-tint)',
                        color: '#fca5a5',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    ✕ {activeTag}
                </button>
            )}
            {filteredTags.map((tag) => (
                <button
                    key={tag}
                    onClick={() => onSelect(tag)}
                    style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 12,
                        border: '1px solid rgba(245,158,11,0.3)',
                        background: 'rgba(245,158,11,0.05)',
                        color: 'var(--warning)',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                    }}
                >
                    {tag}
                </button>
            ))}
        </div>
    );
};
