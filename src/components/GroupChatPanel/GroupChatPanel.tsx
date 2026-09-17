import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { groupChatService } from '../../kernel/instances/services-extras';
import { orchestrator } from '../../kernel/instances';
import type { GroupChat, SpeakerSelection } from '../../kernel/contracts/rivals';
import { Button, StatusBadge } from '../../components/Common';

const SELECTIONS: SpeakerSelection[] = ['auto', 'round_robin', 'manual'];

export default function GroupChatPanel() {
    const { t } = useTranslation();
    const [chats, setChats] = useState<GroupChat[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [memberIds, setMemberIds] = useState<string[]>([]);
    const [customMember, setCustomMember] = useState('');
    const [selection, setSelection] = useState<SpeakerSelection>('auto');
    const [maxRounds, setMaxRounds] = useState('6');
    const [openId, setOpenId] = useState('');
    const [search, setSearch] = useState('');

    const [speaker, setSpeaker] = useState('');
    const [postSpeaker, setPostSpeaker] = useState('');
    const [postText, setPostText] = useState('');
    const [nestTopic, setNestTopic] = useState('');
    const [summary, setSummary] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const active = chats.find((c) => c.id === activeId) ?? null;

    const availableAgents = useMemo(() => {
        try {
            return orchestrator.getActiveTopology()?.nodes.filter((n) => n.type === 'agent') ?? [];
        } catch {
            return [];
        }
    }, [chats.length]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = await groupChatService.listChats();
                if (!cancelled) {
                    setChats(list.sort((a, b) => b.updatedAt - a.updatedAt));
                    if (list.length > 0 && !activeId) {
                        setActiveId(list[0]!.id);
                        setPostSpeaker(list[0]!.members[0] ?? '');
                    }
                }
            } catch (e) {
                console.error('[GroupChatPanel] list failed', e);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return chats;
        const q = search.toLowerCase();
        return chats.filter((c) => c.name.toLowerCase().includes(q) || c.members.some((m) => m.toLowerCase().includes(q)));
    }, [chats, search]);

    const fail = (e: unknown) => {
        console.error('[GroupChatPanel]', e);
        setError(t('groupChat.error.generic'));
    };

    const refresh = async (id: string) => {
        const chat = await groupChatService.get(id);
        if (chat) {
            setChats((prev) => {
                const rest = prev.filter((c) => c.id !== id);
                return [...rest, chat].sort((a, b) => b.updatedAt - a.updatedAt);
            });
        }
    };

    const handleCreate = async () => {
        setError(null);
        setNotice(null);
        const parsed = memberIds;
        if (!name.trim() || parsed.length < 2) {
            setNotice(t('groupChat.validation.members'));
            return;
        }
        setBusy(true);
        try {
            const chat = await groupChatService.createChat({
                name: name.trim().slice(0, 80),
                members: parsed.slice(0, 12),
                selection,
                maxRounds: Math.max(1, Number(maxRounds) || 6),
            });
            setChats((prev) => [...prev.filter((c) => c.id !== chat.id), chat].sort((a, b) => b.updatedAt - a.updatedAt));
            setActiveId(chat.id);
            setPostSpeaker(chat.members[0] ?? '');
            setSummary(null);
            setName('');
            setMemberIds([]);
            setShowCreate(false);
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    const handleOpen = async () => {
        setError(null);
        setNotice(null);
        const id = openId.trim();
        if (!id) return;
        setBusy(true);
        try {
            const chat = await groupChatService.get(id);
            if (!chat) {
                setNotice(t('groupChat.open.notFound'));
                return;
            }
            setChats((prev) => [...prev.filter((c) => c.id !== chat.id), chat].sort((a, b) => b.updatedAt - a.updatedAt));
            setActiveId(chat.id);
            setPostSpeaker(chat.members[0] ?? '');
            setSummary(null);
            setOpenId('');
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    const act = async (fn: (id: string) => Promise<unknown>) => {
        if (!active) return;
        setError(null);
        setNotice(null);
        setBusy(true);
        try {
            await fn(active.id);
            await refresh(active.id);
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    const handleSummarize = async () => {
        if (!active) return;
        setError(null);
        setBusy(true);
        try {
            setSummary(await groupChatService.summarize(active.id));
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    const toggleMember = (id: string) => {
        setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const addCustomMember = () => {
        const v = customMember.trim();
        if (!v || memberIds.includes(v)) return;
        setMemberIds((prev) => [...prev, v].slice(0, 12));
        setCustomMember('');
    };

    return (
        <div style={{ display: 'flex', height: '100%', background: 'var(--slate-900)', color: 'var(--slate-200)' }}>
            {/* Sidebar */}
            <div style={{ width: 340, minWidth: 340, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{t('groupChat.title')}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>{t('groupChat.subtitle')}</div>
                    {error && <div style={{ marginTop: 8, color: 'var(--error)', fontSize: 12 }}>{error}</div>}
                    {notice && <div style={{ marginTop: 8, color: 'var(--slate-400)', fontSize: 12 }}>{notice}</div>}
                </div>

                <div style={{ padding: '10px 14px', display: 'flex', gap: 8 }}>
                    <input
                        placeholder={t('common.search') ?? 'Search'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12 }}
                    />
                    <Button variant="primary" size="sm" onClick={() => setShowCreate((v) => !v)}>{showCreate ? '−' : '+ New'}</Button>
                </div>

                {showCreate && (
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{t('groupChat.create.heading')}</div>
                        <input placeholder={t('groupChat.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 12, marginBottom: 8 }} />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {availableAgents.map((n) => {
                                const sel = memberIds.includes(n.label || n.id);
                                return (
                                    <button key={n.id} onClick={() => toggleMember(n.label || n.id)} style={{ padding: '4px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: sel ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)', background: sel ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)', color: sel ? '#60a5fa' : 'var(--slate-400)', cursor: 'pointer' }}>{n.label || n.id} {sel ? '✓' : ''}</button>
                                );
                            })}
                        </div>
                        {memberIds.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                                {memberIds.map((m) => (
                                    <span key={m} style={{ padding: '2px 8px', borderRadius: 12, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: 11 }}>{m} <span style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => setMemberIds((prev) => prev.filter((x) => x !== m))}>×</span></span>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                            <input placeholder="Custom member + Enter" value={customMember} onChange={(e) => setCustomMember(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addCustomMember(); }} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11 }} />
                            <Button variant="ghost" size="sm" onClick={addCustomMember}>Add</Button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <select value={selection} onChange={(e) => setSelection(e.target.value as SpeakerSelection)} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'inherit', fontSize: 11 }}>
                                {SELECTIONS.map((s) => <option key={s} value={s}>{t(`groupChat.selection.${s}`)}</option>)}
                            </select>
                            <input type="number" min={1} value={maxRounds} onChange={(e) => setMaxRounds(e.target.value)} style={{ width: 70, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11 }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--slate-500)', marginBottom: 8 }}>{memberIds.length}/12 members · {t(`groupChat.selection.${selection}`)} · {maxRounds} rounds</div>
                        <Button variant="primary" size="sm" disabled={busy || !name.trim() || memberIds.length < 2} onClick={() => void handleCreate()}>{t('groupChat.create.submit')}</Button>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 24, color: 'var(--slate-500)', fontSize: 12 }}>{t('groupChat.list.empty')}</div>
                    ) : (
                        filtered.map((c) => (
                            <div key={c.id} onClick={() => { setActiveId(c.id); setPostSpeaker(c.members[0] ?? ''); setSummary(null); }} style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 6, background: c.id === activeId ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', borderLeft: c.id === activeId ? '3px solid #3b82f6' : '3px solid transparent', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                                    <StatusBadge status={c.status} label={t(`groupChat.status.${c.status}`)} />
                                    <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{c.members.length} members · {c.turns.length} turns · R{Math.floor(c.turns.length / Math.max(1, c.members.length)) + 1}/{c.maxRounds}</span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.members.join(', ')}</div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6 }}>
                    <input placeholder={t('groupChat.openPlaceholder')} value={openId} onChange={(e) => setOpenId(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void handleOpen(); }} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11 }} />
                    <Button variant="ghost" size="sm" disabled={busy || !openId.trim()} onClick={() => void handleOpen()}>{t('groupChat.open')}</Button>
                </div>
            </div>

            {/* Main */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--slate-900)' }}>
                {!active ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-500)', gap: 12 }}>
                        <div style={{ fontSize: 48, opacity: 0.2 }}>💬</div>
                        <div style={{ fontWeight: 700 }}>Group Chat</div>
                        <div style={{ fontSize: 12, maxWidth: 320, textAlign: 'center' }}>Create a chat on the left — pick agents as members, choose speaker rotation, then drive turns. Members converse via LLM (or echo if no key).</div>
                    </div>
                ) : (
                    <>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, fontSize: 15 }}>{active.name}</span>
                                <StatusBadge status={active.status} label={t(`groupChat.status.${active.status}`)} />
                                <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>R{Math.floor(active.turns.length / Math.max(1, active.members.length)) + 1}/{active.maxRounds} · {active.selection}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                                {active.members.map((m) => (
                                    <span key={m} style={{ padding: '3px 9px', borderRadius: 20, background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', fontSize: 11, fontWeight: 600 }}>{m}</span>
                                ))}
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {active.turns.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 24, color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12 }}>{t('groupChat.history.empty')} — press “Next turn” to start or post manually.</div>
                            ) : (
                                active.turns.map((turn, i) => {
                                    const isSystem = turn.speaker === 'system';
                                    return (
                                        <div key={`${turn.createdAt}-${i}`} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, background: isSystem ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', alignItems: 'flex-start' }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 8, background: isSystem ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: isSystem ? '#f59e0b' : '#60a5fa', flexShrink: 0 }}>{isSystem ? '◎' : turn.speaker.slice(0, 2).toUpperCase()}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 700, fontSize: 12, color: isSystem ? '#f59e0b' : 'var(--slate-200)' }}>{turn.speaker}</span>
                                                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'var(--slate-400)' }}>R{turn.round}</span>
                                                    <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>{new Date(turn.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                                <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--slate-300)' }}>{turn.text}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            {summary && (
                                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>{t('groupChat.summary.heading')}</div>
                                    <div style={{ fontSize: 12, color: 'var(--slate-300)', whiteSpace: 'pre-wrap' }}>{summary}</div>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <select value={speaker} onChange={(e) => setSpeaker(e.target.value)} style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'inherit', fontSize: 11, minWidth: 140 }}>
                                    <option value="">{t('groupChat.speakerOptional')} (auto)</option>
                                    {active.members.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <Button variant="primary" size="sm" disabled={busy || active.status !== 'running'} onClick={() => void act((id) => groupChatService.nextTurn(id, speaker.trim() || undefined))}>{t('groupChat.nextTurn')}</Button>
                                <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleSummarize()}>{t('groupChat.summarize')}</Button>
                                <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>{active.turns.length} turns</span>
                            </div>

                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <select value={postSpeaker} onChange={(e) => setPostSpeaker(e.target.value)} style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'inherit', fontSize: 11, minWidth: 120 }}>
                                    {active.members.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <input placeholder={t('groupChat.post.textPlaceholder')} value={postText} onChange={(e) => setPostText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && postText.trim() && active.status === 'running') void act((id) => { const text = postText; setPostText(''); return groupChatService.postTurn(id, postSpeaker, text); }); }} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12 }} />
                                <Button variant="secondary" size="sm" disabled={busy || !postText.trim() || active.status !== 'running'} onClick={() => void act((id) => { const text = postText; setPostText(''); return groupChatService.postTurn(id, postSpeaker, text); })}>{t('groupChat.post.submit')}</Button>
                            </div>

                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input placeholder={t('groupChat.nest.topicPlaceholder')} value={nestTopic} onChange={(e) => setNestTopic(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && nestTopic.trim() && active.status === 'running') void act((id) => { const topic = nestTopic; setNestTopic(''); return groupChatService.nestChat(id, topic); }); }} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12 }} />
                                <Button variant="ghost" size="sm" disabled={busy || !nestTopic.trim() || active.status !== 'running'} onClick={() => void act((id) => { const topic = nestTopic; setNestTopic(''); return groupChatService.nestChat(id, topic); })}>{t('groupChat.nest.submit')}</Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
