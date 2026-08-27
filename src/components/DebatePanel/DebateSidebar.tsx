import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePolling } from '../Common/usePolling';
import { Plus, MessageCircle, Trash2, Search, X } from 'lucide-react';
import { debateWorkspace, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('DebateSidebar');
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { WorkspaceRoomEntry } from '../../kernel/services/debate-runtime/debate-workspace';

const PHASE_COLORS: Record<string, string> = {
    created: '#64748b',
    queued: '#94a3b8',
    initializing: '#3b82f6',
    active: '#22c55e',
    paused: '#f59e0b',
    deliberating: '#a855f7',
    consensus: '#f59e0b',
    summarizing: '#06b6d4',
    completed: '#22c55e',
    failed: '#ef4444',
    cancelled: '#64748b',
};

const SIDEBAR_WIDTH = 280;

function formatTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    if (diffDays === 0) return `Today ${time}`;
    if (diffDays === 1) return `Yesterday ${time}`;
    return `${d.toLocaleDateString()} ${time}`;
}

function groupByDate(rooms: WorkspaceRoomEntry[]): Map<string, WorkspaceRoomEntry[]> {
    const groups = new Map<string, WorkspaceRoomEntry[]>();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    for (const room of rooms) {
        let label: string;
        if (room.createdAt >= today) label = 'Today';
        else if (room.createdAt >= yesterday) label = 'Yesterday';
        else label = 'Older';
        const g = groups.get(label);
        if (g) g.push(room);
        else groups.set(label, [room]);
    }
    return groups;
}

interface DebateSidebarProps {
    isOpen?: boolean;
}

const DebateSidebar: React.FC<DebateSidebarProps> = ({ isOpen = true }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const currentRoomId = searchParams.get('roomId');
    const [rooms, setRooms] = useState<WorkspaceRoomEntry[]>([]);
    const [search, setSearch] = useState('');
    const [newTopic, setNewTopic] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showNewInput, setShowNewInput] = useState(false);
    const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const loadRooms = useCallback(() => {
        try {
            debateWorkspace.syncFromEngine();
            setRooms(debateWorkspace.listRooms());
        } catch (e) {
            LOGGER.warn('DebateSidebar', 'loadRooms failed', { error: e });
        }
    }, []);

    usePolling(loadRooms, 10000);

    useEffect(() => {
        if (showNewInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showNewInput]);

    const createRoom = useCallback(async () => {
        const topic = newTopic.trim();
        if (!topic || isCreating) return;
        setIsCreating(true);
        try {
            const roomId = await debateWorkspace.createRoom(topic);
            setNewTopic('');
            setShowNewInput(false);
            loadRooms();
            navigate(`/debate?roomId=${encodeURIComponent(roomId)}`);
        } catch (e) {
            LOGGER.error('DebateSidebar', 'createRoom failed', { error: e });
        } finally {
            setIsCreating(false);
        }
    }, [newTopic, isCreating, loadRooms, navigate]);

    const openRoom = useCallback(
        (roomId: string) => {
            debateWorkspace.setActiveRoom(roomId);
            navigate(`/debate?roomId=${encodeURIComponent(roomId)}`);
        },
        [navigate],
    );

    const deleteRoom = useCallback(
        async (roomId: string) => {
            try {
                await debateWorkspace.closeRoom(roomId);
                loadRooms();
            } catch (e) {
                LOGGER.error('DebateSidebar', 'closeRoom failed', { error: e });
            }
        },
        [loadRooms],
    );

    const filteredRooms = search.trim()
        ? rooms.filter((r) => r.topic.toLowerCase().includes(search.toLowerCase()))
        : rooms;

    const groups = groupByDate(filteredRooms);

    if (!isOpen) return null;

    return (
        <div
            data-debug="rooms-sidebar-200pct"
            style={{
                width: SIDEBAR_WIDTH,
                minWidth: SIDEBAR_WIDTH,
                height: '200%',
                minHeight: '200%',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(15,23,42,0.85)',
                borderRight: '1px solid rgba(100,116,139,0.2)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(100,116,139,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <MessageCircle size={18} color="#a855f7" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-100)' }}>
                        Rooms
                    </span>
                    {!showNewInput && (
                        <button
                            onClick={() => setShowNewInput(true)}
                            style={{
                                marginLeft: 'auto',
                                padding: '3px 8px',
                                borderRadius: 6,
                                border: '1px solid rgba(168,85,247,0.3)',
                                background: 'var(--purple-tint)',
                                color: '#a855f7',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                            }}
                        >
                            <Plus size={12} /> New
                        </button>
                    )}
                </div>

                {showNewInput && (
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                        <input
                            ref={inputRef}
                            value={newTopic}
                            onChange={(e) => setNewTopic(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') createRoom();
                                if (e.key === 'Escape') {
                                    setShowNewInput(false);
                                    setNewTopic('');
                                }
                            }}
                            placeholder="Topic..."
                            style={{
                                flex: 1,
                                padding: '0.35rem 0.6rem',
                                borderRadius: 6,
                                border: '1px solid rgba(168,85,247,0.3)',
                                background: 'rgba(15,23,42,0.8)',
                                color: 'var(--slate-200)',
                                fontSize: '0.78rem',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={() => {
                                setShowNewInput(false);
                                setNewTopic('');
                            }}
                            style={{
                                padding: '0.35rem',
                                borderRadius: 6,
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--slate-500)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search
                        size={13}
                        style={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--slate-500)',
                            pointerEvents: 'none',
                        }}
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        style={{
                            width: '100%',
                            padding: '0.35rem 0.7rem 0.35rem 1.85rem',
                            borderRadius: 6,
                            border: '1px solid rgba(100,116,139,0.2)',
                            background: 'rgba(15,23,42,0.4)',
                            color: 'var(--slate-200)',
                            fontSize: '0.78rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            style={{
                                position: 'absolute',
                                right: 6,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                padding: 0,
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--slate-500)',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* Room List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                {filteredRooms.length === 0 ? (
                    <div
                        style={{
                            padding: '2rem 0.5rem',
                            textAlign: 'center',
                            color: 'var(--slate-500)',
                            fontSize: '0.78rem',
                        }}
                    >
                        {search ? 'No rooms match your search.' : 'No debate rooms yet.'}
                    </div>
                ) : (
                    Array.from(groups.entries()).map(([label, groupRooms]) => (
                        <div key={label} style={{ marginBottom: 6 }}>
                            <div
                                style={{
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    marginBottom: 2,
                                }}
                            >
                                {label}
                            </div>
                            {groupRooms.map((room) => (
                                <div
                                    key={room.id}
                                    onClick={() => openRoom(room.id)}
                                    onMouseEnter={() => setHoveredRoomId(room.id)}
                                    onMouseLeave={() => setHoveredRoomId(null)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '0.45rem 0.5rem',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        background:
                                            room.id === currentRoomId
                                                ? 'rgba(168,85,247,0.12)'
                                                : hoveredRoomId === room.id
                                                  ? 'rgba(255,255,255,0.03)'
                                                  : 'transparent',
                                        border:
                                            room.id === currentRoomId
                                                ? '1px solid rgba(168,85,247,0.2)'
                                                : '1px solid transparent',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: PHASE_COLORS[room.status] || '#64748b',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: '0.78rem',
                                                fontWeight: 600,
                                                color: 'var(--slate-200)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {room.topic}
                                        </div>
                                        <div style={{ fontSize: '0.62rem', color: 'var(--slate-500)' }}>
                                            {formatTime(room.createdAt)}
                                        </div>
                                    </div>
                                    {hoveredRoomId === room.id && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (
                                                    window.confirm(
                                                        `Delete debate "${room.topic}"? This cannot be undone.`,
                                                    )
                                                )
                                                    deleteRoom(room.id);
                                            }}
                                            style={{
                                                padding: '0.2rem',
                                                borderRadius: 4,
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--slate-500)',
                                                cursor: 'pointer',
                                                transition: 'color 0.15s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.color = '#ef4444';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.color = '#64748b';
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DebateSidebar;
