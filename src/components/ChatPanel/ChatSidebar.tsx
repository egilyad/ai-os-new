import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageSquare, Plus, Search, Trash2 } from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useConfirm } from '../../hooks/useConfirm';
import { groupSessions } from './chat-panel-utils';
import type { ChatEntry } from '../../stores/useChatStore';
import { rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('ChatSidebar');

interface Props {
    showSidebar: boolean;
    sidebarWidth: number;
    sidebarRef: React.RefObject<HTMLDivElement | null>;
    onNewChat: () => void;
    onSessionClick: (id: string) => void;
}

const ChatSidebar: React.FC<Props> = ({
    showSidebar,
    sidebarWidth,
    sidebarRef,
    onNewChat,
    onSessionClick,
}) => {
    const { t } = useTranslation();
    const sessions = useChatStore((s) => s.sessions);
    const activeSessionId = useChatStore((s) => s.activeSessionId);
    const deleteSession = useChatStore((s) => s.deleteSession);
    const hasMoreSessions = useChatStore((s) => s.hasMoreSessions);
    const loadMoreSessions = useChatStore((s) => s.loadMoreSessions);
    const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

    const { confirm: confirmDelete, ConfirmDialog: DeleteConfirmDialog } = useConfirm();
    const { confirm: confirmClear, ConfirmDialog: ClearConfirmDialog } = useConfirm();

    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const filteredSessions = useMemo(() => {
        if (!searchQuery.trim()) return sessions;
        const q = searchQuery.toLowerCase();
        return sessions.filter(
            (s) =>
                s.title.toLowerCase().includes(q) ||
                (sessionMap.get(s.id)?.history || []).some((e: ChatEntry) =>
                    e.text.toLowerCase().includes(q),
                ),
        );
    }, [sessions, searchQuery, sessionMap]);

    const sessionGroups = useMemo(() => groupSessions(filteredSessions, t), [filteredSessions, t]);

    const toggleGroup = useCallback((label: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(label)) next.delete(label);
            else next.add(label);
            return next;
        });
    }, []);

    const handleDelete = useCallback(
        async (id: string) => {
            const confirmed = await confirmDelete({
                title: t('chat.delete_session'),
                message: t('chat.confirm_delete'),
            });
            if (!confirmed) return;
            try {
                deleteSession(id);
            } catch {
                LOGGER.error('Failed to delete session', id);
            }
            if (id === activeSessionId) {
                const nextSession = sessions.find((s) => s.id !== id);
                if (nextSession) {
                    onSessionClick(nextSession.id);
                } else {
                    onNewChat();
                }
            }
        },
        [confirmDelete, deleteSession, activeSessionId, sessions, onSessionClick, onNewChat, t],
    );

    const handleClear = useCallback(async () => {
        const confirmed = await confirmClear({
            title: t('chat.clear_all'),
            message: t('chat.confirm_clear'),
        });
        if (!confirmed) return;
        try {
            useChatStore.getState().clearHistory();
        } catch {
            LOGGER.error('Failed to clear chat history', '');
        }
    }, [confirmClear, t]);

    return (
        <>
            <AnimatePresence>
                {showSidebar && (
                    <motion.div
                        ref={sidebarRef}
                        key="chat-sidebar"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: sidebarWidth, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{
                            overflow: 'hidden',
                            flexShrink: 0,
                            borderRight: '1px solid var(--border)',
                            background: 'var(--bg-panel)',
                        }}
                    >
                        <div
                            style={{
                                width: sidebarWidth,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                            }}
                        >
                            <div
                                style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.75rem',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        {t('chat.sessions_label')}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                        <button
                                            onClick={onNewChat}
                                            style={{
                                                padding: '0.4rem',
                                                borderRadius: 8,
                                                background: 'var(--accent-tint)',
                                                border: '1px solid rgba(59,130,246,0.2)',
                                                color: 'var(--accent)',
                                                cursor: 'pointer',
                                            }}
                                            title={t('chat.new_session')}
                                            aria-label={t('chat.new_session')}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Search
                                        size={14}
                                        style={{
                                            position: 'absolute',
                                            left: 10,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-muted)',
                                            pointerEvents: 'none',
                                        }}
                                        aria-hidden="true"
                                    />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('chat.search_placeholder')}
                                        aria-label={t('chat.search_sessions')}
                                        style={{
                                            width: '100%',
                                            padding: '0.55rem 0.75rem 0.55rem 2rem',
                                            borderRadius: 8,
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text-main)',
                                            fontSize: '0.8rem',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
                                {sessionGroups.map((group) => (
                                    <div key={group.label} style={{ marginBottom: '0.75rem' }}>
                                        <div
                                            onClick={() => toggleGroup(group.label)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                padding: '0.35rem 0.5rem',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                color: 'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.03em',
                                            }}
                                        >
                                            <ChevronDown
                                                size={12}
                                                style={{
                                                    transform: collapsedGroups.has(group.label)
                                                        ? 'rotate(-90deg)'
                                                        : 'rotate(0deg)',
                                                    transition: 'transform 0.2s',
                                                }}
                                                aria-hidden="true"
                                            />
                                            {group.label}
                                            <span
                                                style={{
                                                    marginLeft: 'auto',
                                                    color: 'var(--text-muted)',
                                                    opacity: 0.5,
                                                }}
                                            >
                                                {group.sessions.length}
                                            </span>
                                        </div>
                                        {!collapsedGroups.has(group.label) &&
                                            group.sessions.map((s) => {
                                                const isActive = s.id === activeSessionId;
                                                return (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => onSessionClick(s.id)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            padding: '0.45rem 0.5rem',
                                                            borderRadius: 8,
                                                            cursor: 'pointer',
                                                            fontSize: '0.78rem',
                                                            color: isActive
                                                                ? '#3b82f6'
                                                                : 'var(--text-main)',
                                                            background: isActive
                                                                ? 'rgba(59,130,246,0.08)'
                                                                : 'transparent',
                                                            fontWeight: isActive ? 600 : 400,
                                                            border: isActive
                                                                ? '1px solid rgba(59,130,246,0.15)'
                                                                : '1px solid transparent',
                                                            transition: 'all 0.15s',
                                                        }}
                                                    >
                                                        <MessageSquare
                                                            size={12}
                                                            style={{ flexShrink: 0, opacity: 0.5 }}
                                                            aria-hidden="true"
                                                        />
                                                        <span
                                                            style={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                flex: 1,
                                                            }}
                                                        >
                                                            {s.title}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(s.id);
                                                            }}
                                                            style={{
                                                                padding: 2,
                                                                background: 'none',
                                                                border: 'none',
                                                                color: 'var(--text-muted)',
                                                                cursor: 'pointer',
                                                                opacity: 0.4,
                                                                flexShrink: 0,
                                                            }}
                                                            title={t('chat.delete_session')}
                                                            aria-label={t(
                                                                'chat.delete_session_aria',
                                                            )}
                                                        >
                                                            <Trash2 size={12} aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ))}
                                {hasMoreSessions && (
                                    <button
                                        onClick={loadMoreSessions}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 8,
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            marginTop: '0.5rem',
                                        }}
                                    >
                                        {t('chat.load_more')}
                                    </button>
                                )}
                                {sessionGroups.length === 0 && (
                                    <div
                                        style={{
                                            padding: '2rem 1rem',
                                            textAlign: 'center',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem',
                                        }}
                                    >
                                        {searchQuery
                                            ? t('chat.no_search_results')
                                            : t('chat.no_sessions')}
                                    </div>
                                )}
                            </div>

                            <div
                                style={{
                                    padding: '0.5rem',
                                    borderTop: '1px solid var(--border)',
                                    display: 'flex',
                                    gap: '0.35rem',
                                    justifyContent: 'center',
                                }}
                            >
                                <button
                                    onClick={handleClear}
                                    style={{
                                        padding: '0.4rem 0.75rem',
                                        borderRadius: 8,
                                        background: 'rgba(239,68,68,0.08)',
                                        border: '1px solid rgba(239,68,68,0.15)',
                                        color: 'var(--error)',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {t('chat.clear_all')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <DeleteConfirmDialog />
            <ClearConfirmDialog />
        </>
    );
};

export default ChatSidebar;
