import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Bookmark, Search, Trash2, X, BookmarkPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus, EVENTS } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import { chatBookmarksService } from '../../kernel/instances';
import type { ChatBookmark } from '../../kernel/services/chat-bookmarks-service';
import { errorContainer, dismissBtnRed, textMutedXs } from '../../styles/common';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useConfirm } from '../../hooks/useConfirm';
import { PanelLoading } from '../PanelStates';
import { BookmarkCard } from './BookmarkCard';
import { TagBar } from './TagBar';

const bookmarksService = chatBookmarksService;

const BookmarksPanel: React.FC = () => {
    const { confirm, ConfirmDialog } = useConfirm();
    const [bookmarks, setBookmarks] = useState<ChatBookmark[]>([]);
    const [search, setSearch] = useState('');
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();
    const isMountedRef = useRef(true);
    const clearError = useAutoClearError(setError);

    const refresh = useCallback(() => {
        const list = search.trim() ? bookmarksService.search(search) : bookmarksService.listAll();
        const filtered = activeTag ? list.filter((b) => b.tags.includes(activeTag)) : list;
        setBookmarks(filtered);
    }, [search, activeTag]);

    useEffect(() => {
        isMountedRef.current = true;
        bookmarksService
            .init()
            .then(() => {
                if (isMountedRef.current) {
                    refresh();
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMountedRef.current) {
                    setError(String(err));
                    clearError();
                    setLoading(false);
                }
            });
        const unsubAdd = eventBus.on(EVENTS.CHAT_BOOKMARK_ADDED, () => {
            if (isMountedRef.current) refresh();
        });
        const unsubRem = eventBus.on(EVENTS.CHAT_BOOKMARK_REMOVED, () => {
            if (isMountedRef.current) refresh();
        });
        const unsubClr = eventBus.on(EVENTS.CHAT_BOOKMARK_CLEARED, () => {
            if (isMountedRef.current) refresh();
        });
        return () => {
            isMountedRef.current = false;
            unsubAdd();
            unsubRem();
            unsubClr();
        };
    }, [refresh, clearError]);

    useEffect(() => {
        refresh();
    }, [search, activeTag, refresh]);

    const handleRemove = useCallback(
        async (id: string) => {
            if (
                !(await confirm({
                    title: 'Remove Bookmark',
                    message: 'Remove this bookmark?',
                    variant: 'danger',
                }))
            )
                return;
            await bookmarksService.removeBookmark(id);
        },
        [confirm],
    );

    const handleCopy = useCallback(
        (b: ChatBookmark) => {
            navigator.clipboard
                ?.writeText(b.content)
                .then(() => {
                    setCopiedId(b.id);
                    setTimeout(() => setCopiedId((prev) => (prev === b.id ? null : prev)), 1500);
                })
                .catch(() => {
                    setError(t('bookmarks.copy_failed'));
                    clearError();
                });
        },
        [t, clearError],
    );

    const handleClearAll = useCallback(async () => {
        if (
            !(await confirm({
                title: 'Clear All Bookmarks',
                message: t('bookmarks.confirm_clear'),
                variant: 'danger',
            }))
        )
            return;
        await bookmarksService.clearAll();
    }, [t, confirm]);

    // P6: compute from service, not from filtered local state (bookmarks ref changes every render)
    const allTags = useMemo(() => bookmarksService.getAllTags(), []);
    const total = useMemo(() => bookmarksService.count(), []);

    if (loading) return <PanelLoading />;

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                overflow: 'auto',
                padding: '1rem',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '1.25rem',
                }}
            >
                <div>
                    <h2
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            margin: '0 0 0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            color: 'var(--slate-50)',
                        }}
                    >
                        <Bookmark size={26} color="#f59e0b" /> {t('bookmarks.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('bookmarks.subtitle', { count: total })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.3rem',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '0.3rem',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.05)',
                            alignItems: 'center',
                        }}
                    >
                        <Search size={14} style={{ marginLeft: 6, color: 'var(--slate-400)' }} />
                        <input
                            type="text"
                            placeholder={t('bookmarks.search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--slate-200)',
                                padding: '0.4rem 0.5rem',
                                fontSize: '0.8rem',
                                outline: 'none',
                                width: 200,
                            }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--slate-400)',
                                    cursor: 'pointer',
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleClearAll}
                        disabled={total === 0}
                        style={{
                            padding: '0.5rem 0.9rem',
                            borderRadius: 8,
                            border: 'none',
                            background: total > 0 ? '#ef4444' : 'rgba(239,68,68,0.2)',
                            color: '#fff',
                            cursor: total > 0 ? 'pointer' : 'not-allowed',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Trash2 size={16} /> {t('bookmarks.clear_all')}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={errorContainer}
                    >
                        {error}
                        <button onClick={() => setError(null)} style={dismissBtnRed}>
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <TagBar allTags={allTags} activeTag={activeTag} onSelect={(tag) => setActiveTag(tag)} />

            {bookmarks.length === 0 ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '3rem',
                        color: 'var(--slate-400)',
                        textAlign: 'center',
                    }}
                >
                    {search || activeTag ? (
                        <>
                            <Search size={48} color="#475569" />
                            <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                                {t('bookmarks.no_matches')}
                            </p>
                            <p style={textMutedXs}>{t('bookmarks.no_matches_hint')}</p>
                        </>
                    ) : (
                        <>
                            <BookmarkPlus size={48} color="#475569" />
                            <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                                {t('bookmarks.empty')}
                            </p>
                            <p style={textMutedXs}>{t('bookmarks.empty_hint')}</p>
                        </>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                    <AnimatePresence>
                        {bookmarks.map((b) => (
                            <BookmarkCard
                                key={b.id}
                                bookmark={b}
                                copiedId={copiedId}
                                onCopy={handleCopy}
                                onRemove={handleRemove}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <div style={textMutedXs}>
                {t('bookmarks.shown', { shown: bookmarks.length, total })}
            </div>
            <ConfirmDialog />
        </div>
    );
};

export default BookmarksPanel;
