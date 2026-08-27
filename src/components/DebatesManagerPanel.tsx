import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebateSessionStore } from '../stores/debate-session-store';
import type { DebateSessionMeta } from '../stores/debate-session-store/types';
import { useTranslation } from '../i18n/useTranslation';
import { runtime } from '../kernel/runtime';
import { rootLogger } from '../kernel/instances';
const LOGGER = rootLogger.child('DebatesManagerPanel');
import type { ISessionManager, SessionLink } from '../kernel/contracts/session-manager';

const STATUS_COLORS: Record<string, string> = {
    active: '#22c55e',
    paused: '#f59e0b',
    completed: '#3b82f6',
    failed: '#ef4444',
    cancelled: '#6b7280',
    created: '#64748b',
    deliberating: '#22c55e',
    consensus: '#8b5cf6',
    summarizing: '#a855f7',
};

const STATUS_ORDER: Record<string, number> = {
    active: 0,
    paused: 1,
    completed: 2,
    archived: 3,
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

const badge: React.CSSProperties = {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 10,
    fontWeight: 600,
    display: 'inline-block',
};

const phaseLabel: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--slate-400)',
    marginTop: 2,
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

function getStatusGroup(s: DebateSessionMeta): string {
    if (s.isArchived) return 'archived';
    if (s.phase === 'paused') return 'paused';
    if (s.phase === 'completed' || s.phase === 'failed' || s.phase === 'cancelled')
        return 'completed';
    return 'active';
}

export const DebatesManagerPanel: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const sessions = useDebateSessionStore((s) => s.sessions);
    const activeSessionId = useDebateSessionStore((s) => s.activeSessionId);
    const isLoaded = useDebateSessionStore((s) => s.isLoaded);
    const createSession = useDebateSessionStore((s) => s.createSession);
    const deleteSession = useDebateSessionStore((s) => s.deleteSession);
    const archiveSession = useDebateSessionStore((s) => s.archiveSession);
    const unarchiveSession = useDebateSessionStore((s) => s.unarchiveSession);
    const pauseSession = useDebateSessionStore((s) => s.pauseSession);
    const resumeSession = useDebateSessionStore((s) => s.resumeSession);
    const renameSession = useDebateSessionStore((s) => s.renameSession);
    const tagSession = useDebateSessionStore((s) => s.tagSession);
    const moveToFolder = useDebateSessionStore((s) => s.moveToFolder);
    const setActiveSessionId = useDebateSessionStore((s) => s.setActiveSessionId);
    const refresh = useDebateSessionStore((s) => s.refresh);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newTopic, setNewTopic] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [folderInput, setFolderInput] = useState('');
    const [linkInput, setLinkInput] = useState('');
    const [links, setLinks] = useState<SessionLink[]>([]);

    useEffect(() => {
        refresh();
    }, [refresh]);

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
                    s.topic.toLowerCase().includes(q) ||
                    s.tags.some((t) => t.toLowerCase().includes(q)),
            );
        }
        return list;
    }, [sessions, search]);

    const grouped = useMemo(() => {
        const map: Record<string, DebateSessionMeta[]> = {};
        for (const s of filtered) {
            const g = getStatusGroup(s);
            if (!map[g]) map[g] = [];
            map[g].push(s);
        }
        for (const k of Object.keys(map)) map[k]!.sort((a, b) => b.updatedAt - a.updatedAt);
        return map;
    }, [filtered]);

    const groupOrder = Object.keys(grouped).sort(
        (a, b) => (STATUS_ORDER[a] ?? 9) - (STATUS_ORDER[b] ?? 9),
    );

    const handleCreate = useCallback(async () => {
        if (!newTopic.trim()) return;
        await createSession(newTopic.trim(), 'round_robin', [], {
            roundDelayMs: 2000,
            maxTokens: 4096,
            temperature: 0.7,
            debateTemperature: 0.7,
            useModerator: false,
            timeoutMs: 30000,
            language: 'ru',
        });
        setNewTopic('');
        setShowCreate(false);
    }, [newTopic, createSession]);

    const handleRename = useCallback(
        async (id: string) => {
            if (editTitle.trim()) {
                await renameSession(id, editTitle.trim());
            }
            setEditingId(null);
        },
        [editTitle, renameSession],
    );

    const handleAddTag = useCallback(async () => {
        if (!active || !tagInput.trim()) return;
        const newTags = [...new Set([...active.tags, tagInput.trim()])];
        await tagSession(active.id, newTags);
        setTagInput('');
    }, [active, tagInput, tagSession]);

    const handleSetFolder = useCallback(async () => {
        if (!active || !folderInput.trim()) return;
        await moveToFolder(active.id, folderInput.trim());
        setFolderInput('');
    }, [active, folderInput, moveToFolder]);

    const handleLink = useCallback(async () => {
        if (!active || !linkInput.trim()) return;
        try {
            const sm = runtime.getService<ISessionManager>('sessionManagerService');
            await sm.link(
                active.id,
                linkInput.trim(),
                'debate_to_chat',
                `Linked from debate ${active.topic}`,
            );
            setLinks(await sm.getLinked(active.id));
        } catch (e) {
            LOGGER.warn('DebatesManagerPanel', 'Link failed', { error: e });
        }
        setLinkInput('');
    }, [active, linkInput]);

    return (
        <div style={{ display: 'flex', height: '100%', background: 'var(--slate-900)', color: 'var(--slate-200)' }}>
            <div style={sidebar}>
                <div
                    style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}
                >
                    <input
                        style={searchInput}
                        placeholder={t('common.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button
                        style={{
                            ...btn,
                            background: 'var(--accent)',
                            whiteSpace: 'nowrap',
                            padding: '8px 14px',
                        }}
                        onClick={() => setShowCreate(true)}
                    >
                        + New
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
                    {!isLoaded ? (
                        <div style={{ textAlign: 'center', padding: 32, color: 'var(--slate-500)' }}>
                            {t('common.loading')}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 32, color: 'var(--slate-500)' }}>
                            {search ? t('common.no_results') : t('common.empty')}
                        </div>
                    ) : (
                        groupOrder.map((group) => (
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
                                    {group} ({grouped[group]!.length})
                                </div>
                                {grouped[group]!.map((s) => (
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
                                                    background: STATUS_COLORS[s.phase] || '#64748b',
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
                                                {s.topic}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    ...badge,
                                                    background: `${STATUS_COLORS[s.phase] || '#64748b'}22`,
                                                    color: STATUS_COLORS[s.phase] || '#64748b',
                                                }}
                                            >
                                                {s.phase}
                                            </span>
                                            <span style={phaseLabel}>
                                                R{s.round} · {s.participants.length} agents ·{' '}
                                                {new Date(s.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {s.tags.length > 0 && (
                                            <div style={{ marginTop: 2 }}>
                                                {s.tags.map((t) => (
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
                {showCreate && (
                    <div style={detailSection}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                            {t('common.create')}
                        </div>
                        <input
                            style={{ ...searchInput, marginBottom: 8 }}
                            placeholder="Debate topic"
                            value={newTopic}
                            onChange={(e) => setNewTopic(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate();
                            }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                style={{ ...btn, background: 'var(--accent)' }}
                                onClick={handleCreate}
                            >
                                Create
                            </button>
                            <button
                                style={{ ...btn, background: 'var(--slate-600)' }}
                                onClick={() => setShowCreate(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {!active && !showCreate && (
                    <div style={emptyState}>
                        <div style={{ fontSize: 48, opacity: 0.3 }}>🗂️</div>
                        <div style={{ fontSize: 16 }}>{t('nav.debate_history')}</div>
                        <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 300 }}>
                            {t('common.select_item')}
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
                                        <div
                                            style={{
                                                fontSize: 18,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => {
                                                setEditingId(active.id);
                                                setEditTitle(active.topic);
                                            }}
                                        >
                                            {active.topic} ✏️
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                                    {(active.phase === 'paused' || active.phase === 'created') && (
                                        <button
                                            style={{ ...btn, background: 'var(--success)' }}
                                            onClick={() => resumeSession(active.id)}
                                        >
                                            ▶ Resume
                                        </button>
                                    )}
                                    {active.phase === 'active' ||
                                    active.phase === 'deliberating' ? (
                                        <button
                                            style={{ ...btn, background: 'var(--warning)' }}
                                            onClick={() => pauseSession(active.id)}
                                        >
                                            ⏸ Pause
                                        </button>
                                    ) : null}
                                    <button
                                        style={{ ...btn, background: 'var(--accent)' }}
                                        onClick={() =>
                                            navigate(`/debate?mode=runtime&sessionId=${active.id}`)
                                        }
                                    >
                                        Open
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
                                        onClick={async () => {
                                            if (window.confirm(`Delete "${active.topic}"?`)) {
                                                await deleteSession(active.id);
                                            }
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
                                    <span style={{ color: 'var(--slate-500)' }}>Status:</span>{' '}
                                    <span
                                        style={{ color: STATUS_COLORS[active.phase] || '#e2e8f0' }}
                                    >
                                        {active.phase}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Strategy:</span>{' '}
                                    {active.strategy}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Round:</span> {active.round}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Participants:</span>{' '}
                                    {active.participants.length}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Created:</span>{' '}
                                    {new Date(active.createdAt).toLocaleString()}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--slate-500)' }}>Updated:</span>{' '}
                                    {new Date(active.updatedAt).toLocaleString()}
                                </div>
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
                                {active.tags.map((t) => (
                                    <span key={t} style={tagChip}>
                                        {t}{' '}
                                        <span
                                            style={{
                                                cursor: 'pointer',
                                                marginLeft: 4,
                                                opacity: 0.6,
                                            }}
                                            onClick={async () => {
                                                await tagSession(
                                                    active.id,
                                                    active.tags.filter((x) => x !== t),
                                                );
                                            }}
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
                            <div style={label}>Participants</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {active.participants.map((p) => (
                                    <span
                                        key={p.id}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: 6,
                                            background: 'rgba(255,255,255,0.05)',
                                            fontSize: 12,
                                        }}
                                    >
                                        {p.name}{' '}
                                        <span style={{ color: 'var(--slate-500)' }}>({p.role})</span>
                                    </span>
                                ))}
                                {active.participants.length === 0 && (
                                    <span style={{ color: 'var(--slate-500)', fontSize: 13 }}>
                                        No participants saved in metadata
                                    </span>
                                )}
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
                                    placeholder="Chat session ID to link..."
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
                                    Link Chat
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DebatesManagerPanel;
