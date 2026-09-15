/**
 * ChatDock — AGEMS port, Phase 11.1.
 * Floating chat panels (up to 5 concurrent), minimize/maximize/close, unread badges.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useChatStore } from '../../stores/chat/hooks';

interface DockSession {
    id: string;
    title: string;
    minimized: boolean;
    unread: number;
    x: number;
    y: number;
}

const MAX_DOCK_SESSIONS = 5;
const DOCK_WIDTH = 360;
const DOCK_HEIGHT = 480;

export function ChatDock() {
    const { t } = useTranslation();
    const sessions = useChatStore(s => s.sessions);
    const activeSessionId = useChatStore(s => s.activeSessionId);
    const [docked, setDocked] = useState<DockSession[]>([]);
    const [expanded, setExpanded] = useState(false);
    const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

    const addDock = useCallback((sessionId: string) => {
        if (docked.length >= MAX_DOCK_SESSIONS) return;
        if (docked.some(d => d.id === sessionId)) return;
        const session = sessions[sessionId];
        const title = session?.title ?? sessionId;
        const offset = docked.length * 20;
        setDocked(prev => [...prev, {
            id: sessionId,
            title,
            minimized: false,
            unread: 0,
            x: window.innerWidth - DOCK_WIDTH - 20 - offset,
            y: window.innerHeight - DOCK_HEIGHT - 60 - offset,
        }]);
    }, [docked, sessions]);

    const removeDock = useCallback((id: string) => {
        setDocked(prev => prev.filter(d => d.id !== id));
    }, []);

    const toggleMinimize = useCallback((id: string) => {
        setDocked(prev => prev.map(d => d.id === id ? { ...d, minimized: !d.minimized } : d));
    }, []);

    const clearUnread = useCallback((id: string) => {
        setDocked(prev => prev.map(d => d.id === id ? { ...d, unread: 0 } : d));
    }, []);

    // Drag handling
    const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
        const session = docked.find(d => d.id === id);
        if (!session) return;
        dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: session.x, origY: session.y };
        e.preventDefault();
    }, [docked]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragRef.current) return;
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            setDocked(prev => prev.map(d => d.id === dragRef.current!.id ? {
                ...d,
                x: Math.max(0, Math.min(window.innerWidth - DOCK_WIDTH, dragRef.current!.origX + dx)),
                y: Math.max(0, Math.min(window.innerHeight - DOCK_HEIGHT, dragRef.current!.origY + dy)),
            } : d));
        };
        const handleMouseUp = () => { dragRef.current = null; };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, []);

    // Auto-add active session to dock
    useEffect(() => {
        if (activeSessionId && !docked.some(d => d.id === activeSessionId)) {
            addDock(activeSessionId);
        }
    }, [activeSessionId, docked, addDock]);

    // Simulate unread (would be wired to real events in production)
    useEffect(() => {
        const unsub = useChatStore.subscribe((state, prev) => {
            // When a new message arrives for a non-active docked session, increment unread
            const activeId = state.activeSessionId;
            if (!activeId) return;
            setDocked(prev2 => {
                let changed = false;
                const next = prev2.map(d => {
                    if (d.id !== activeId && d.minimized) {
                        const s = state.sessions[d.id];
                        const ps = prev.sessions[d.id];
                        if (s && ps && s.messages.length > ps.messages.length) {
                            changed = true;
                            return { ...d, unread: d.unread + 1 };
                        }
                    }
                    return d;
                });
                return changed ? next : prev2;
            });
        });
        return unsub;
    }, []);

    return (
        <>
            {/* Dock bar */}
            {docked.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    right: 0,
                    display: 'flex',
                    gap: 4,
                    padding: '4px 8px',
                    background: 'rgba(15,23,42,0.95)',
                    borderTopLeftRadius: 8,
                    zIndex: 9999,
                }}>
                    {docked.map(d => (
                        <button
                            key={d.id}
                            onClick={() => { if (d.minimized) toggleMinimize(d.id); else { clearUnread(d.id); /* navigate to chat */ } }}
                            style={{ position: 'relative', padding: '4px 12px', background: d.id === activeSessionId ? '#6366f1' : '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                            {d.title}
                            {d.unread > 0 && (
                                <span style={{ position: 'absolute', top: -4, right: -4, background: '#dc2626', color: '#fff', borderRadius: 10, padding: '1px 5px', fontSize: 10 }}>
                                    {d.unread > 99 ? '99+' : d.unread}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Floating panels */}
            {docked.filter(d => !d.minimized).map(d => (
                <div
                    key={d.id}
                    style={{
                        position: 'fixed',
                        left: d.x,
                        top: d.y,
                        width: DOCK_WIDTH,
                        height: DOCK_HEIGHT,
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: 10,
                        zIndex: 10000,
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                >
                    {/* Header */}
                    <div
                        onMouseDown={e => handleMouseDown(e, d.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#1e293b', borderRadius: '10px 10px 0 0', cursor: 'grab', userSelect: 'none' }}
                    >
                        <span style={{ flex: 1, color: '#e2e8f0', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
                        <button onClick={() => toggleMinimize(d.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>─</button>
                        <button onClick={() => removeDock(d.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>×</button>
                    </div>
                    {/* Body — ChatPanel inline (placeholder for actual integration) */}
                    <div style={{ flex: 1, overflow: 'auto', padding: 12, color: '#94a3b8', fontSize: 13 }}>
                        <p>Chat: {d.title}</p>
                        <p style={{ fontSize: 11, color: '#64748b' }}>Full ChatPanel integration here</p>
                    </div>
                </div>
            ))}

            {/* Toggle button */}
            <button
                onClick={() => setExpanded(prev => !prev)}
                style={{
                    position: 'fixed',
                    bottom: 8,
                    right: 8,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    background: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                    zIndex: 9998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                💬
            </button>
        </>
    );
}
