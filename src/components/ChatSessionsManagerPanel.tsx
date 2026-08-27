import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../stores/chat/store';
import type { ChatSession } from '../stores/chat/types';
import { useTranslation } from '../i18n/useTranslation';
import { runtime } from '../kernel/runtime';
import type { ISessionManager, SessionLink } from '../kernel/contracts/session-manager';
import { rootLogger } from '../kernel/instances';
const LOGGER = rootLogger.child('ChatSessionsManagerPanel');

const STATUS_COLORS: Record<string, string> = {
    active: '#22c55e',
    paused: '#f59e0b',
    archived: '#64748b',
};

const sidebar: React.CSSProperties = {
    width: 320,
    minWidth: 320,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
};

const searchInput: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--slate-200)',
    fontSize: 13,
    outline: 'none',
};

const sessionItem: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    borderLeft: '3px solid transparent',
};

const sessionItemActive: React.CSSProperties = {
    ...sessionItem,
    background: 'rgba(59,130,246,0.12)',
    borderLeftColor: '#3b82f6',
};

const detailSection: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const label: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--slate-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 4,
};

const btn: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12,
    color: '#fff',
};

const tagChip: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    background: 'rgba(59,130,246,0.2)',
    color: '#60a5fa',
    margin: '2px 4px 2px 0',
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

function getSessionGroup(s: ChatSession): string {
    if (s.isArchived) return 'archived';
    return 'active';
}

function lastMessagePreview(s: ChatSession, maxLen = 80): string {
    const last = s.history[s.history.length - 1];
    if (!last) return '';
    const text = last.role === 'user' ? last.text : last.responses?.[0]?.content || last.text;
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

export const ChatSessionsManagerPanel: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const sessions = useChatStore((s) => s.sessions);
    const activeSessionId = useChatStore((s) => s.activeSessionId);
    const isLoaded = useChatStore((s) => s.isLoaded);
    const deleteSession = useChatStore((s) => s.deleteSession);
    const renameSession = useChatStore((s) => s.renameSession);
    const archiveSession = useChatStore((s) => s.archiveSession);
    const unarchiveSession = useChatStore((s) => s.unarchiveSession);
    const tagSession = useChatStore((s) => s.tagSession);
    const moveToFolder = useChatStore((s) => s.moveToFolder);
    const pinSession = useChatStore((s) => s.pinSession);
    const setActiveSessionId = useChatStore((s) => s.setActiveSessionId);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [folderInput, setFolderInput] = useState('');
    const [linkInput, setLinkInput] = useState('');
    const [links, setLinks] = useState<SessionLink[]>([]);

    useEffect(() => {
        if (!activeSessionId) {
            queueMicrotask(() => setLinks([]));
            return;
        }
        (async () => {
            try {
                const sm = runtime.getService<ISessionManager>('sessionManagerService');
                const result = await sm.getLinked(activeSessionId);
                queueMicrotask(() => setLinks(result));
            } catch {
                queueMicrotask(() => setLinks([]));
            }
        })();
    }, [activeSessionId]);

    const active = activeSessionId
        ? (sessions.find((s) => s.id === activeSessionId) ?? null)
        : null;

    const filtered = useMemo(() => {
        let list = sessions;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(
                (s) =>
                    s.title.toLowerCase().includes(q) ||
                    (s.tags ?? []).some((t) => t.toLowerCase().includes(q)),
            );
        }
        return list;
    }, [sessions, search]);

    const grouped = useMemo(() => {
        const pinned = filtered.filter((s) => s.isPinned);
        const unpinned = filtered.filter((s) => !s.isPinned);
        const map: Record<string, ChatSession[]> = {};
        if (pinned.length > 0) map['pinned'] = pinned;
        for (const s of unpinned) {
            const g = getSessionGroup(s);
            if (!map[g]) map[g] = [];
            map[g].push(s);
        }
        for (const k of Object.keys(map))
            map[k]!.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
        return map;
    }, [filtered]);

    const groupLabels: Record<string, string> = {
        pinned: 'Pinned',
        active: 'Active',
        archived: 'Archived',
    };

    const handleRename = useCallback(
        async (id: string) => {
            if (editTitle.trim()) renameSession(id, editTitle.trim());
            setEditingId(null);
        },
        [editTitle, renameSession],
    );

    const handleAddTag = useCallback(() => {
        if (!active || !tagInput.trim()) return;
        const newTags = [...new Set([...(active.tags ?? []), tagInput.trim()])];
        tagSession(active.id, newTags);
        setTagInput('');
    }, [active, tagInput, tagSession]);

    const handleSetFolder = useCallback(() => {
        if (!active || !folderInput.trim()) return;
        moveToFolder(active.id, folderInput.trim());
        setFolderInput('');
    }, [active, folderInput, moveToFolder]);

    const handleLink = useCallback(async () => {
        if (!active || !linkInput.trim()) return;
        try {
            const sm = runtime.getService<ISessionManager>('sessionManagerService');
            await sm.link(
                active.id,
                linkInput.trim(),
                'chat_to_debate',
                `Linked from chat ${active.title}`,
            );
            setLinks(await sm.getLinked(active.id));
        } catch (e) {
            LOGGER.warn('Link failed', String(e));
        }
        setLinkInput('');
    }, [active, linkInput]);

    return (
        <div style={{ display: 'flex', height: '100%', background: 'var(--slate-900)', color: 'var(--slate-200)' }}>
            <div style={sidebar}>
                <div style={{ padding: '12px 16px' }}>
                    <input
                        style={searchInput}
                        placeholder={t('common.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
                    {!isLoaded ? (
                        <div style={{ textAlign: 'center', padding: 32, color: 'var(--slate-500)' }}>
                            {t('common.loading')}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 32, color: 'var(--slate-500)' }}>
                            {t('common.no_results')}
                        </div>
                    ) : (
                        Object.entries(grouped).map(([group, items]) => (
                            <div key={group} style={{ marginBottom: 8 }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--slate-500)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        padding: '8px 4px 4px',
                                        fontWeight: 600,
                                    }}
                                >
                                    {groupLabels[group] || group} ({items.length})
                                </div>
                                {items.map((s) => (
                                    <div
                                        key={s.id}
                                        style={
                                            s.id === activeSessionId
                                                ? sessionItemActive
                                                : sessionItem
                                        }
                                        onClick={() => setActiveSessionId(s.id)}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: s.isPinned
                                                        ? '#f59e0b'
                                                        : STATUS_COLORS[getSessionGroup(s)],
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {s.title}
                                            </span>
                                            {s.isPinned && <span style={{ fontSize: 11 }}>📌</span>}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: 'var(--slate-400)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {lastMessagePreview(s)}
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                                {s.history.length} msgs ·{' '}
                                                {new Date(
                                                    s.updatedAt ?? s.createdAt,
                                                ).toLocaleDateString()}
                                            </span>
                                            {s.folder && (
                                                <span style={{ fontSize: 11, color: 'var(--purple)' }}>
                                                    📁 {s.folder}
                                                </span>
                                            )}
                                        </div>
                                        {(s.tags ?? []).length > 0 && (
                                            <div style={{ marginTop: 2 }}>
                                                {(s.tags ?? []).map((t) => (
                                                    <span key={t} style={tagChip}>
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {!active && (
                    <div style={emptyState}>
                        <div style={{ fontSize: 48, opacity: 0.3 }}>💬</div>
                        <div style={{ fontSize: 16 }}>Chat Sessions</div>
                        <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 300 }}>
                            Select a session from the sidebar to view details
                        </div>
                    </div>
                )}

                {active && (
                    <>
                        <div style={detailSection}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    {editingId === active.id ? (
                                        <input
                                            style={searchInput}
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRename(active.id);
                                            }}
                                            autoFocus
                                            onBlur={() => handleRename(active.id)}
                                        />
                                    ) : (
                                        <button
                                            style={{
                                                fontSize: 18,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                background: 'none',
                                                border: 'none',
                                                color: 'inherit',
                                                padding: 0,
                                                textAlign: 'left',
                                            }}
                                            onClick={() => {
                                                setEditingId(active.id);
                                                setEditTitle(active.title);
                                            }}
                                        >
                                            {active.title} ✏️
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                                    <button
                                        style={{
                                            ...btn,
                                            background: active.isPinned ? '#64748b' : '#f59e0b',
                                        }}
                                        onClick={() => pinSession(active.id)}
                                    >
                                        {active.isPinned ? 'Unpin' : '📌 Pin'}
                                    </button>
                                    <button
                                        style={{ ...btn, background: 'var(--accent)' }}
                                        onClick={() => navigate(`/chat?session=${active.id}`)}
                                    >
                                        Open in Chat
                                    </button>
                                    {active.isArchived ? (
                                        <button
                                            style={{ ...btn, background: 'var(--slate-500)' }}
                                            onClick={() => unarchiveSession(active.id)}
                                        >
                                            Unarchive
                                        </button>
                                    ) : (
                                        <button
                                            style={{ ...btn, background: 'var(--slate-500)' }}
                                            onClick={() => archiveSession(active.id)}
                                        >
                                            Archive
                                        </button>
                                    )}
                                    <button
                                        style={{ ...btn, background: 'var(--error)' }}
                                        onClick={() => {
                                            if (window.confirm(`Delete "${active.title}"?`))
                                                deleteSession(active.id);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={detailSection}>
                            <div style={label}>Details</div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 12,
                                    fontSize: 13,
                                }}
                            >
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Messages:</span>{' '}
                                    {active.history.length}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Pinned:</span>{' '}
                                    {active.isPinned ? 'Yes' : 'No'}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Created:</span>{' '}
                                    {new Date(active.createdAt).toLocaleString()}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Updated:</span>{' '}
                                    {new Date(active.updatedAt).toLocaleString()}
                                </div>
                                {active.currentProvider && (
                                    <div>
                                        <span style={{ color: 'var(--slate-500)' }}>Provider:</span>{' '}
                                        {active.currentProvider}
                                    </div>
                                )}
                                {active.currentModel && (
                                    <div>
                                        <span style={{ color: 'var(--slate-500)' }}>Model:</span>{' '}
                                        {active.currentModel}
                                    </div>
                                )}
                                {active.summary && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <span style={{ color: 'var(--slate-500)' }}>Summary:</span>{' '}
                                        {active.summary}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={detailSection}>
                            <div style={label}>Tags</div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 4,
                                    marginBottom: 8,
                                }}
                            >
                                {(active.tags ?? []).map((t) => (
                                    <span key={t} style={tagChip}>
                                        {t}{' '}
                                        <span
                                            style={{
                                                cursor: 'pointer',
                                                marginLeft: 4,
                                                opacity: 0.6,
                                            }}
                                            onClick={() =>
                                                tagSession(
                                                    active.id,
                                                    (active.tags ?? []).filter((x) => x !== t),
                                                )
                                            }
                                        >
                                            ✕
                                        </span>
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    style={{ ...searchInput, flex: 1 }}
                                    placeholder="Add tag..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddTag();
                                    }}
                                />
                                <button
                                    style={{ ...btn, background: 'var(--accent)' }}
                                    onClick={handleAddTag}
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div style={detailSection}>
                            <div style={label}>Folder</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: 13 }}>
                                    {active.folder || '(no folder)'}
                                </span>
                                <input
                                    style={{ ...searchInput, flex: 1 }}
                                    placeholder="Set folder..."
                                    value={folderInput}
                                    onChange={(e) => setFolderInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSetFolder();
                                    }}
                                />
                                <button
                                    style={{ ...btn, background: 'var(--accent)' }}
                                    onClick={handleSetFolder}
                                >
                                    Set
                                </button>
                            </div>
                        </div>

                        <div style={detailSection}>
                            <div style={label}>Linked Sessions</div>
                            {links.length > 0 ? (
                                links.map((l) => (
                                    <div
                                        key={l.id}
                                        style={{ fontSize: 12, padding: '4px 0', color: 'var(--slate-400)' }}
                                    >
                                        <span style={{ color: '#60a5fa' }}>
                                            {l.toId.slice(0, 12)}...
                                        </span>
                                        <span style={{ color: 'var(--slate-500)', marginLeft: 8 }}>
                                            {l.linkType}
                                        </span>
                                        {l.context && (
                                            <span style={{ marginLeft: 8 }}>— {l.context}</span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>
                                    No linked sessions
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <input
                                    style={{ ...searchInput, flex: 1 }}
                                    placeholder="Debate session ID to link..."
                                    value={linkInput}
                                    onChange={(e) => setLinkInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleLink();
                                    }}
                                />
                                <button
                                    style={{ ...btn, background: 'var(--purple)' }}
                                    onClick={handleLink}
                                >
                                    Link Debate
                                </button>
                            </div>
                        </div>

                        <div style={detailSection}>
                            <div style={label}>
                                Recent Messages ({Math.min(5, active.history.length)} of{' '}
                                {active.history.length})
                            </div>
                            {active.history
                                .slice(-5)
                                .reverse()
                                .map((e) => (
                                    <div
                                        key={e.id}
                                        style={{
                                            padding: '8px 0',
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: 8,
                                                alignItems: 'center',
                                                marginBottom: 2,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color:
                                                        e.role === 'user' ? '#60a5fa' : '#a78bfa',
                                                }}
                                            >
                                                {e.role}
                                            </span>
                                            <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>
                                                {new Date(e.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: 'var(--slate-300)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {e.text}
                                        </div>
                                    </div>
                                ))}
                            {active.history.length === 0 && (
                                <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>
                                    No messages yet
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatSessionsManagerPanel;
