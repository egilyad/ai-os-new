import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { dyadService } from '../../kernel/instances/services-extras';
import type { AgentLoop } from '../../kernel/contracts/rivals';
import { Button, StatusBadge } from '../../components/Common';

function byNewest(a: AgentLoop, b: AgentLoop): number {
    return b.createdAt - a.createdAt;
}

export default function DyadPanel() {
    const { t } = useTranslation();
    const [loops, setLoops] = useState<AgentLoop[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [topic, setTopic] = useState('');
    const [userRole, setUserRole] = useState('');
    const [assistantRole, setAssistantRole] = useState('');
    const [maxTurns, setMaxTurns] = useState('10');
    const [openId, setOpenId] = useState('');
    const [search, setSearch] = useState('');
    const busyRef = useRef(false);
    busyRef.current = busy;
    const active = loops.find((l) => l.id === activeId) ?? null;

    const fail = (e: unknown) => {
        console.error('[DyadPanel]', e);
        setError(t('dyad.error.generic'));
    };

    const reload = async (selectId?: string) => {
        try {
            const all = await dyadService.listLoops();
            const sorted = [...all].filter((l) => l.kind === 'dyad').sort(byNewest);
            setLoops(sorted);
            if (selectId) setActiveId(selectId);
            else if (activeId === null && sorted.length > 0) setActiveId(sorted[0]!.id);
        } catch (e) { fail(e); }
    };

    useEffect(() => { void reload(); }, []);

    const pollOnce = async () => {
        try {
            const all = await dyadService.listLoops();
            const sorted = [...all].filter((l) => l.kind === 'dyad').sort(byNewest);
            setLoops(sorted);
            const running = sorted.find((l) => l.status === 'running') ?? null;
            if (running) setActiveId(running.id);
        } catch (e) { fail(e); }
    };

    const handleStart = () => {
        setError(null); setNotice(null);
        if (!topic.trim()) { setNotice(t('dyad.validation.topic')); return; }
        const text = topic.trim().slice(0, 500);
        const max = Math.max(2, Math.min(30, Number(maxTurns) || 10));
        setBusy(true);
        const timer = window.setInterval(() => { if (busyRef.current) void pollOnce(); }, 1500);
        const done = () => { window.clearInterval(timer); setBusy(false); };
        dyadService.startDyad({ topic: text, userRole: userRole.trim() || undefined, assistantRole: assistantRole.trim() || undefined, maxTurns: max }).then(
            (loop) => { done(); void reload(loop.id); setTopic(''); },
            (e) => { done(); fail(e); },
        );
    };

    const handleOpen = async () => {
        setError(null); setNotice(null);
        const id = openId.trim(); if (!id) return;
        try {
            const loop = await dyadService.getLoop(id);
            if (!loop) { setNotice(t('dyad.open.notFound')); return; }
            await reload(loop.id); setOpenId('');
        } catch (e) { fail(e); }
    };

    const filtered = search.trim() ? loops.filter((l) => l.goal.toLowerCase().includes(search.toLowerCase())) : loops;

    return (
        <div style={{ display: 'flex', height: '100%', background: 'var(--slate-900)', color: 'var(--slate-200)' }}>
            <div style={{ width: 340, minWidth: 340, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{t('dyad.title')}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>{t('dyad.subtitle')}</div>
                    {error && <div style={{ marginTop: 8, color: 'var(--error)', fontSize: 12 }}>{error}</div>}
                    {notice && <div style={{ marginTop: 8, color: '#f59e0b', fontSize: 12 }}>{notice}</div>}
                </div>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <input placeholder={t('common.search') ?? 'Search topics…'} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12 }} />
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20, color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>{t('dyad.list.empty')}</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {filtered.map((l) => (
                                <div key={l.id} onClick={() => setActiveId(l.id)} style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: l.id === activeId ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.03)', borderLeft: l.id === activeId ? '3px solid #a855f7' : '3px solid transparent', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.goal.slice(0, 80)}</div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                                        <StatusBadge status={l.status} label={t(`dyad.status.${l.status}`)} />
                                        <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{l.iterations}/{l.maxIterations} turns</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6 }}>
                    <input placeholder={t('dyad.openPlaceholder')} value={openId} onChange={(e) => setOpenId(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void handleOpen(); }} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11 }} />
                    <Button variant="ghost" size="sm" onClick={() => void handleOpen()}>{t('dyad.open')}</Button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 8 }}>{t('dyad.run.heading')}</div>
                    <input placeholder={t('dyad.topicPlaceholder')} value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && topic.trim()) handleStart(); }} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 13, marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input placeholder={t('dyad.userRolePlaceholder')} value={userRole} onChange={(e) => setUserRole(e.target.value)} style={{ flex: 1, minWidth: 140, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11 }} />
                        <input placeholder={t('dyad.assistantRolePlaceholder')} value={assistantRole} onChange={(e) => setAssistantRole(e.target.value)} style={{ flex: 1, minWidth: 140, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11 }} />
                        <input type="number" min={2} max={30} value={maxTurns} onChange={(e) => setMaxTurns(e.target.value)} style={{ width: 80, padding: '7px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11 }} />
                        <Button variant="primary" size="sm" disabled={busy || !topic.trim()} onClick={handleStart}>{t('dyad.run.start')}</Button>
                    </div>
                    {busy && <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 8 }}>{t('dyad.running')}… polling 1.5s</div>}
                </div>

                {!active ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-500)', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 32, opacity: 0.2 }}>💬</div>
                        <div style={{ fontSize: 12, maxWidth: 360, textAlign: 'center' }}>Pick a dyad on the left or start a new topic above. Two roles converse turn-by-turn.</div>
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontWeight: 800, fontSize: 14 }}>{active.goal.slice(0, 100)}</span>
                            <StatusBadge status={active.status} label={t(`dyad.status.${active.status}`)} />
                            <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{active.iterations}/{active.maxIterations}</span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{t('dyad.log.heading')} · {active.log.length}</div>
                        {active.log.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 16, color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>{t('dyad.log.empty')}</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {active.log.map((line, i) => {
                                    const isUser = i % 2 === 0;
                                    return (
                                        <div key={`${i}-${line.slice(0, 24)}`} style={{ alignSelf: isUser ? 'flex-start' : 'flex-end', maxWidth: '85%', padding: '8px 12px', borderRadius: 12, background: isUser ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isUser ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)'}`, borderBottomLeftRadius: isUser ? 4 : 12, borderBottomRightRadius: isUser ? 12 : 4, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{line}</div>
                                    );
                                })}
                            </div>
                        )}
                        {active.result && (
                            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>{t('dyad.result.heading')}</div>
                                <div style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{active.result}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
