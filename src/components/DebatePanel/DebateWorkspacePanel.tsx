import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, MessageCircle, Trash2, Play, Bot, Activity, Clock, Loader2 } from 'lucide-react';
import { runtime } from '../../kernel/runtime';
import { debateWorkspace, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('DebateWorkspacePanel');
import { useTranslation } from '../../i18n/useTranslation';
import type { WorkspaceRoomEntry } from '../../kernel/services/debate-runtime/debate-workspace';
import { useNavigate } from 'react-router-dom';

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

const DebateWorkspacePanel: React.FC = () => {
    void useTranslation(); // i18n initialized at app level
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<WorkspaceRoomEntry[]>([]);
    const [newTopic, setNewTopic] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const initRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);

    const loadRooms = useCallback(() => {
        try {
            const index = debateWorkspace.getIndex();
            if (!index || !Array.isArray(index.rooms)) return;
            try {
                debateWorkspace.syncFromEngine();
            } catch (e) {
                LOGGER.warn('DebateWorkspacePanel', 'syncFromEngine failed', { error: e });
            }
            if (isMountedRef.current) setRooms(debateWorkspace.listRooms());
            if (isMountedRef.current) setReady(true);
        } catch (e) {
            LOGGER.warn('DebateWorkspacePanel', 'loadRooms failed', { error: e });
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        if (initRef.current) return;
        initRef.current = true;

        // Try immediately first (runtime may already be ready)
        loadRooms();

        // If not ready, poll
        if (!ready) {
            let attempts = 0;
            const check = () => {
                attempts++;
                try {
                    const isRuntimeReady =
                        runtime && typeof runtime.isReady === 'function' && runtime.isReady();
                    if (isRuntimeReady) {
                        loadRooms();
                    } else if (attempts < 20) {
                        timerRef.current = setTimeout(check, 500);
                    } else {
                        if (isMountedRef.current) setReady(true);
                    }
                } catch {
                    if (attempts < 20) timerRef.current = setTimeout(check, 500);
                    else if (isMountedRef.current) setReady(true);
                }
            };
            timerRef.current = setTimeout(check, 500);
        }
        return () => {
            isMountedRef.current = false;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [loadRooms, ready]);

    const createRoom = useCallback(async () => {
        const topic = newTopic.trim();
        if (!topic || isCreating) return;

        setIsCreating(true);
        setError(null);

        try {
            await debateWorkspace.createRoom(topic);
            setNewTopic('');
            loadRooms();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setError('Create failed: ' + msg);
            LOGGER.error('DebateWorkspacePanel', 'Create room failed', { error: e });
        } finally {
            setIsCreating(false);
        }
    }, [newTopic, isCreating, loadRooms]);

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
                LOGGER.error('DebateWorkspacePanel', 'Close room failed', { error: e });
            }
        },
        [loadRooms],
    );

    const formatDate = (ts: number) => {
        const d = new Date(ts);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const hasText = newTopic.trim().length > 0;

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                gap: '1rem',
                overflow: 'hidden',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <MessageCircle size={24} color="#a855f7" />
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-100)' }}>
                    Debate Rooms
                </h2>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && hasText && !isCreating) createRoom();
                    }}
                    placeholder="New debate topic..."
                    style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid rgba(100,116,139,0.3)',
                        background: 'rgba(15,23,42,0.6)',
                        color: 'var(--slate-200)',
                        fontSize: '0.85rem',
                        outline: 'none',
                    }}
                />
                <button
                    onClick={createRoom}
                    disabled={!hasText || isCreating}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 8,
                        border: 'none',
                        background: hasText && !isCreating ? '#a855f7' : '#334155',
                        color: '#fff',
                        cursor: hasText && !isCreating ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        opacity: isCreating ? 0.7 : 1,
                    }}
                >
                    {isCreating ? <Loader2 size={16} className="spinning" /> : <Plus size={16} />}
                    {isCreating ? 'Creating...' : 'Create Room'}
                </button>
            </div>

            {error && (
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 8,
                        background: 'var(--error-tint)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#fca5a5',
                        fontSize: '0.8rem',
                    }}
                >
                    {error}
                </div>
            )}

            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                }}
            >
                {rooms.length === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--slate-500)',
                            fontSize: '0.9rem',
                            flexDirection: 'column',
                            gap: 8,
                        }}
                    >
                        <Bot size={48} opacity={0.3} />
                        <span>No debate rooms yet. Create one above.</span>
                    </div>
                ) : (
                    rooms.map((room) => (
                        <div
                            key={room.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '0.75rem 1rem',
                                borderRadius: 10,
                                background: 'rgba(30,41,59,0.6)',
                                border: '1px solid rgba(100,116,139,0.15)',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: PHASE_COLORS[room.status] || '#64748b',
                                    flexShrink: 0,
                                }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--slate-200)',
                                        marginBottom: 2,
                                    }}
                                >
                                    {room.topic}
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 12,
                                        fontSize: '0.75rem',
                                        color: 'var(--slate-500)',
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Activity size={12} /> {room.status}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={12} /> {formatDate(room.createdAt)}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => openRoom(room.id)}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: 6,
                                    border: '1px solid rgba(168,85,247,0.3)',
                                    background: 'var(--purple-tint)',
                                    color: '#a855f7',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                }}
                            >
                                <Play size={14} /> Open
                            </button>
                            <button
                                onClick={() => deleteRoom(room.id)}
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
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DebateWorkspacePanel;
