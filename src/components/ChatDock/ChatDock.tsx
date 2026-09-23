import { useState } from 'react';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';

interface DockChat {
    id: string;
    title: string;
    minimized: boolean;
    unread: number;
}

export default function ChatDock() {
    const sessions = useChatStore((s) => s.sessions);
    const [docks, setDocks] = useState<DockChat[]>([]);
    const [open, setOpen] = useState(false);

    const addDock = (id: string) => {
        if (docks.length >= 5) return;
        if (docks.some((d) => d.id === id)) return;
        const sess = sessions.find((s) => s.id === id);
        setDocks((prev) => [...prev, { id, title: sess?.title ?? id.slice(0, 8), minimized: false, unread: 0 }]);
        setOpen(true);
    };

    const toggleMin = (id: string) => setDocks((prev) => prev.map((d) => (d.id === id ? { ...d, minimized: !d.minimized } : d)));
    const closeDock = (id: string) => setDocks((prev) => prev.filter((d) => d.id !== id));

    return (
        <>
            <button
                onClick={() => setOpen((v) => !v)}
                style={{ position: 'fixed', bottom: 20, right: 20, width: 52, height: 52, borderRadius: '50%', background: '#3b82f6', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,130,246,0.4)', cursor: 'pointer', zIndex: 50 }}
                title="Chat Dock"
            >
                <MessageCircle size={22} />
                {docks.reduce((s, d) => s + d.unread, 0) > 0 && (
                    <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 10 }}>{docks.reduce((s, d) => s + d.unread, 0)}</span>
                )}
            </button>

            {open && (
                <div style={{ position: 'fixed', bottom: 80, right: 20, width: 380, maxHeight: 480, background: 'var(--slate-900)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 50 }}>
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 800, fontSize: 12 }}>Chat Dock · {docks.length}/5</span>
                        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}><X size={14} /></button>
                    </div>

                    <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {sessions.slice(0, 8).map((s) => (
                            <button key={s.id} onClick={() => addDock(s.id)} style={{ padding: '4px 8px', borderRadius: 20, fontSize: 11, border: docks.some((d) => d.id === s.id) ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)', background: docks.some((d) => d.id === s.id) ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)', color: docks.some((d) => d.id === s.id) ? '#60a5fa' : 'var(--slate-400)', cursor: 'pointer' }}>{s.title.slice(0, 18)}</button>
                        ))}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {docks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: 'var(--slate-500)', fontSize: 12 }}>No chats docked — pick sessions above. Gemma (META) always available.</div>
                        ) : (
                            docks.map((d) => {
                                const sess = sessions.find((s) => s.id === d.id);
                                return (
                                    <div key={d.id} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }} onClick={() => toggleMin(d.id)}>
                                            <span style={{ fontWeight: 700, fontSize: 11, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</span>
                                            {d.unread > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: 10, padding: '1px 5px', borderRadius: 10 }}>{d.unread}</span>}
                                            <button onClick={(e) => { e.stopPropagation(); toggleMin(d.id); }} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}>{d.minimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}</button>
                                            <button onClick={(e) => { e.stopPropagation(); closeDock(d.id); }} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}><X size={12} /></button>
                                        </div>
                                        {!d.minimized && (
                                            <div style={{ padding: '8px 10px', maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {(sess?.history ?? []).slice(-3).map((e) => (
                                                    <div key={e.id} style={{ fontSize: 11, padding: '6px 8px', borderRadius: 8, background: e.role === 'user' ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <span style={{ fontWeight: 700, color: e.role === 'user' ? '#60a5fa' : 'var(--slate-300)' }}>{e.role}:</span> {e.text.slice(0, 100)}
                                                    </div>
                                                ))}
                                                {(sess?.history?.length ?? 0) === 0 && <div style={{ fontSize: 11, color: 'var(--slate-500)', fontStyle: 'italic' }}>No messages yet</div>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 10, color: 'var(--slate-500)', flex: 1 }}>Gemma META · always available · history per participant</span>
                    </div>
                </div>
            )}
        </>
    );
}
