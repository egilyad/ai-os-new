/**
 * SessionHubPanel — Central hub for managing chat and debate sessions.
 *
 * Displays a searchable, filterable grid of all active and archived sessions.
 * Supports opening, renaming, pinning, and deleting sessions via card clicks
 * or right-click context menus. Shows linked session counts and metadata
 * previews for quick navigation.
 */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../stores/chat/store';
import { useDebateSessionStore } from '../stores/debate-session-store';
import { useTranslation } from '../i18n/useTranslation';
import { ContextMenu } from './Common/ContextMenu';
import { ConfirmDialog } from './ConfirmDialog';
import { Pin, Edit3, Trash2, ExternalLink, Star } from 'lucide-react';
import type { ContextMenuAction } from './Common/ContextMenu';

const container: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--slate-900)',
    color: 'var(--slate-200)',
    overflow: 'hidden',
};

const header: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

const searchInput: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--slate-200)',
    fontSize: 13,
    outline: 'none',
    width: 240,
};

const filterBtn: React.CSSProperties = {
    padding: '4px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: 'var(--slate-400)',
    fontSize: 12,
    cursor: 'pointer',
};

const filterBtnActive: React.CSSProperties = {
    ...filterBtn,
    background: 'rgba(59,130,246,0.2)',
    borderColor: 'var(--accent)',
    color: '#60a5fa',
};

const cardBase: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
};

const badge: React.CSSProperties = {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 8,
    fontWeight: 600,
    textTransform: 'uppercase',
};

const emptyState: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--slate-500)',
    gap: 16,
};

const renameInput: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid rgba(59,130,246,0.5)',
    background: 'var(--accent-tint)',
    color: 'var(--slate-200)',
    outline: 'none',
    width: '100%',
};

type SessionItem = {
    id: string;
    type: 'chat' | 'debate';
    title: string;
    status: string;
    updatedAt: number;
    tags: string[];
    folder?: string;
    preview?: string;
    linkedCount: number;
    linkedId?: string;
    isPinned?: boolean;
};

export const SessionHubPanel: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const chatSessions = useChatStore((s) => s.sessions);
    const debateMeta = useDebateSessionStore((s) => s.sessions);
    const chatPinSession = useChatStore((s) => s.pinSession);
    const chatRenameSession = useChatStore((s) => s.renameSession);
    const chatDeleteSession = useChatStore((s) => s.deleteSession);
    const debatePinSession = useDebateSessionStore((s) => s.pinSession);
    const debateRenameSession = useDebateSessionStore((s) => s.renameSession);
    const debateDeleteSession = useDebateSessionStore((s) => s.deleteSession);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'chat' | 'debate'>('all');
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; item: SessionItem } | null>(
        null,
    );
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const editRef = useRef<HTMLInputElement>(null);
    const [confirmDelete, setConfirmDelete] = useState<{
        id: string;
        type: 'chat' | 'debate';
        title: string;
    } | null>(null);

    useEffect(() => {
        if (editingId && editRef.current) {
            editRef.current.focus();
            editRef.current.select();
        }
    }, [editingId]);

    const items = useMemo((): SessionItem[] => {
        const result: SessionItem[] = [];
        for (const s of chatSessions) {
            const last = s.history[s.history.length - 1];
            const preview = last
                ? last.role === 'user'
                    ? last.text
                    : last.responses?.[0]?.content || last.text
                : '';
            result.push({
                id: s.id,
                type: 'chat',
                title: s.title,
                status: s.isArchived ? 'archived' : 'active',
                updatedAt: s.updatedAt ?? s.createdAt,
                tags: s.tags ?? [],
                folder: s.folder,
                preview: preview.slice(0, 100),
                linkedCount: s.linkedDebateId ? 1 : 0,
                linkedId: s.linkedDebateId,
                isPinned: s.isPinned,
            });
        }
        for (const s of debateMeta) {
            result.push({
                id: s.id,
                type: 'debate',
                title: s.topic,
                status: s.isArchived ? 'archived' : s.phase,
                updatedAt: s.updatedAt,
                tags: s.tags,
                folder: s.folder,
                preview: `R${s.round} · ${s.participants.length} agents · ${s.strategy}`,
                linkedCount: s.linkedSessionIds.length,
                linkedId: s.linkedSessionIds[0],
                isPinned: s.isPinned,
            });
        }
        result.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.updatedAt - a.updatedAt);
        return result;
    }, [chatSessions, debateMeta]);

    const filtered = useMemo(() => {
        let list = items;
        if (filter !== 'all') list = list.filter((i) => i.type === filter);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(
                (i) =>
                    i.title.toLowerCase().includes(q) ||
                    i.tags.some((t) => t.toLowerCase().includes(q)),
            );
        }
        return list;
    }, [items, filter, search]);

    const handleOpen = useCallback(
        (item: SessionItem) => {
            if (item.type === 'chat') navigate(`/chat?session=${item.id}`);
            else navigate(`/debate?mode=runtime&sessionId=${item.id}`);
        },
        [navigate],
    );

    const handleContextMenu = useCallback((e: React.MouseEvent, item: SessionItem) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ x: e.clientX, y: e.clientY, item });
    }, []);

    const handleRename = useCallback(
        (id: string, type: 'chat' | 'debate') => {
            const item = items.find((i) => i.id === id && i.type === type);
            if (!item) return;
            setEditingId(`${type}-${id}`);
            setEditTitle(item.title);
        },
        [items],
    );

    const handleRenameSubmit = useCallback(
        (id: string, type: 'chat' | 'debate') => {
            if (editTitle.trim()) {
                if (type === 'chat') chatRenameSession(id, editTitle.trim());
                else debateRenameSession(id, editTitle.trim());
            }
            setEditingId(null);
        },
        [editTitle, chatRenameSession, debateRenameSession],
    );

    const handlePinToggle = useCallback(
        (id: string, type: 'chat' | 'debate') => {
            if (type === 'chat') chatPinSession(id);
            else debatePinSession(id);
        },
        [chatPinSession, debatePinSession],
    );

    const handleDelete = useCallback(
        (id: string, type: 'chat' | 'debate') => {
            if (type === 'chat') chatDeleteSession(id);
            else debateDeleteSession(id);
        },
        [chatDeleteSession, debateDeleteSession],
    );

    const requestDelete = useCallback((item: SessionItem) => {
        setConfirmDelete({ id: item.id, type: item.type, title: item.title });
    }, []);

    const getContextMenuActions = useCallback(
        (item: SessionItem): ContextMenuAction[] => [
            {
                id: 'open',
                label: 'Open',
                icon: <ExternalLink size={14} />,
                onClick: () => handleOpen(item),
            },
            {
                id: 'rename',
                label: 'Rename',
                icon: <Edit3 size={14} />,
                onClick: () => handleRename(item.id, item.type),
            },
            {
                id: 'pin',
                label: item.isPinned ? 'Unpin' : 'Pin',
                icon: <Pin size={14} />,
                onClick: () => handlePinToggle(item.id, item.type),
            },
            {
                id: 'delete',
                label: 'Delete',
                icon: <Trash2 size={14} />,
                danger: true,
                divider: true,
                onClick: () => requestDelete(item),
            },
        ],
        [handleOpen, handleRename, handlePinToggle, requestDelete],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, id: string, type: 'chat' | 'debate') => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleRenameSubmit(id, type);
            }
            if (e.key === 'Escape') {
                setEditingId(null);
            }
        },
        [handleRenameSubmit],
    );

    return (
        <div style={container}>
            <div style={header}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Session Hub</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                        style={searchInput}
                        placeholder={t('common.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                        {(['all', 'chat', 'debate'] as const).map((f) => (
                            <button
                                key={f}
                                style={filter === f ? filterBtnActive : filterBtn}
                                onClick={() => setFilter(f)}
                            >
                                {f === 'all' ? 'All' : f === 'chat' ? '💬 Chats' : '🗣️ Debates'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {filtered.length === 0 ? (
                    <div style={emptyState}>
                        <div style={{ fontSize: 48, opacity: 0.3 }}>📋</div>
                        <div style={{ fontSize: 16 }}>No sessions found</div>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: 12,
                        }}
                    >
                        {filtered.map((item) => {
                            const isEditing = editingId === `${item.type}-${item.id}`;
                            return (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    style={cardBase}
                                    onClick={() => {
                                        if (!isEditing) handleOpen(item);
                                    }}
                                    onContextMenu={(e) => handleContextMenu(e, item)}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        {isEditing ? (
                                            <input
                                                ref={editRef}
                                                style={renameInput}
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onBlur={() =>
                                                    handleRenameSubmit(item.id, item.type)
                                                }
                                                onKeyDown={(e) =>
                                                    handleKeyDown(e, item.id, item.type)
                                                }
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}
                                            >
                                                {item.isPinned && (
                                                    <Star
                                                        size={12}
                                                        color="#f59e0b"
                                                        fill="#f59e0b"
                                                    />
                                                )}
                                                {item.title}
                                            </span>
                                        )}
                                        <span
                                            style={{
                                                ...badge,
                                                background:
                                                    item.type === 'chat'
                                                        ? 'rgba(16,185,129,0.2)'
                                                        : 'rgba(139,92,246,0.2)',
                                                color: item.type === 'chat' ? '#34d399' : '#a78bfa',
                                            }}
                                        >
                                            {item.type}
                                        </span>
                                    </div>
                                    {item.preview && (
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: 'var(--slate-400)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {item.preview}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 8,
                                            alignItems: 'center',
                                            fontSize: 11,
                                            color: 'var(--slate-500)',
                                        }}
                                    >
                                        <span
                                            style={{
                                                ...badge,
                                                background:
                                                    item.status === 'active'
                                                        ? 'rgba(34,197,94,0.2)'
                                                        : item.status === 'archived'
                                                          ? 'rgba(100,116,139,0.2)'
                                                          : 'rgba(245,158,11,0.2)',
                                                color:
                                                    item.status === 'active'
                                                        ? '#22c55e'
                                                        : item.status === 'archived'
                                                          ? '#94a3b8'
                                                          : '#f59e0b',
                                            }}
                                        >
                                            {item.status}
                                        </span>
                                        <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                                        {item.folder && <span>📁 {item.folder}</span>}
                                        {item.linkedCount > 0 && item.linkedId && (
                                            <span
                                                style={{
                                                    color: 'var(--purple)',
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline',
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(
                                                        item.type === 'chat'
                                                            ? `/chat?session=${item.linkedId}`
                                                            : `/debate?mode=runtime&sessionId=${item.linkedId}`,
                                                    );
                                                }}
                                                title={
                                                    item.type === 'chat'
                                                        ? 'Open linked debate'
                                                        : 'Open linked chat'
                                                }
                                            >
                                                🔗 {item.linkedCount}
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePinToggle(item.id, item.type);
                                            }}
                                            style={{
                                                marginLeft: 'auto',
                                                padding: 2,
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: item.isPinned ? '#f59e0b' : '#475569',
                                                display: 'flex',
                                            }}
                                            title={item.isPinned ? 'Unpin' : 'Pin'}
                                        >
                                            <Pin size={12} />
                                        </button>
                                    </div>
                                    {item.tags.length > 0 && (
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            {item.tags.map((t) => (
                                                <span
                                                    key={t}
                                                    style={{
                                                        padding: '1px 6px',
                                                        borderRadius: 6,
                                                        fontSize: 10,
                                                        background: 'rgba(59,130,246,0.15)',
                                                        color: '#60a5fa',
                                                    }}
                                                >
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {ctxMenu && (
                <ContextMenu
                    x={ctxMenu.x}
                    y={ctxMenu.y}
                    actions={getContextMenuActions(ctxMenu.item)}
                    onClose={() => setCtxMenu(null)}
                />
            )}

            <ConfirmDialog
                open={!!confirmDelete}
                title="Delete session"
                message={`Are you sure you want to delete "${confirmDelete?.title}"?`}
                variant="danger"
                confirmLabel="Delete"
                onConfirm={() => {
                    if (confirmDelete) handleDelete(confirmDelete.id, confirmDelete.type);
                    setConfirmDelete(null);
                }}
                onCancel={() => setConfirmDelete(null)}
            />

            <div
                style={{
                    padding: '8px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 11,
                    color: 'var(--slate-500)',
                }}
            >
                {items.length} total sessions · {items.filter((i) => i.type === 'chat').length}{' '}
                chats · {items.filter((i) => i.type === 'debate').length} debates
            </div>
        </div>
    );
};

export default SessionHubPanel;
