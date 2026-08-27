import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface ForumHeatmapProps {
    categories: Array<{ category: string; count: number }>;
}

/**
 * ForumHeatmap — per-category activity bars (topic/post distribution).
 */
const ForumHeatmap: React.FC<ForumHeatmapProps> = ({ categories }) => {
    const { t } = useTranslation();
    if (categories.length === 0) {
        return (
            <div style={{ fontSize: '0.66rem', color: 'var(--slate-600)' }}>{t('forum.no_activity')}</div>
        );
    }
    const max = Math.max(1, ...categories.map((c) => c.count));
    return (
        <div>
            {categories.map((c) => (
                <div
                    key={c.category}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}
                >
                    <span
                        style={{
                            fontSize: '0.62rem',
                            color: 'var(--slate-500)',
                            width: 90,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {c.category}
                    </span>
                    <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'var(--slate-900)' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${(c.count / max) * 100}%`,
                                background: 'var(--purple)',
                                borderRadius: 4,
                            }}
                        />
                    </div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--slate-400)' }}>{c.count}</span>
                </div>
            ))}
        </div>
    );
};

export default ForumHeatmap;
