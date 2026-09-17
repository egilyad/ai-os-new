import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { autonomyService } from '../../kernel/instances/services-extras';
import type { AgentLoop } from '../../kernel/contracts/rivals';
import { Button, StatusBadge } from '../../components/Common';

function byNewest(a: AgentLoop, b: AgentLoop): number {
    return b.createdAt - a.createdAt;
}

export default function AutonomyPanel() {
    const { t } = useTranslation();
    const [loops, setLoops] = useState<AgentLoop[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [runningId, setRunningId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [goal, setGoal] = useState('');
    const [maxIters, setMaxIters] = useState('8');
    const [openId, setOpenId] = useState('');
    const [search, setSearch] = useState('');
    const busyRef = useRef(false);
    busyRef.current = busy;
    const active = loops.find((l) => l.id === activeId) ?? null;

    const fail = (e: unknown) => {
        console.error('[AutonomyPanel]', e);
        setError(t('autonomy.error.generic'));
    };

    const reload = async (selectId?: string) => {
        try {
            const all = await autonomyService.listLoops();
            const sorted = [...all].sort(byNewest);
            setLoops(sorted);
            if (selectId) setActiveId(selectId);
            else if (activeId === null && sorted.length > 0) setActiveId(sorted[0]!.id);
        } catch (e) { fail(e); }
    };

    useEffect(() => { void reload(); }, []);

    const pollOnce = async () => {
        try {
            const all = await autonomyService.listLoops();
            const sorted = [...all].sort(byNewest);
            setLoops(sorted);
            const running = sorted.find((l) => l.status === 'running') ?? null;
            setRunningId(running ? running.id : null);
            if (running) setActiveId(running.id);
        } catch (e) { fail(e); }
    };

    const handleRun = (mode: 'goal' | 'queue') => {
        setError(null); setNotice(null);
        if (!goal.trim()) { setNotice(t('autonomy.validation.goal')); return; }
        const text = goal.trim().slice(0, 500);
        const max = Math.max(1, Number(maxIters) || 8);
        setBusy(true); setRunningId(null);
        const timer = window.setInterval(() => { if (busyRef.current) void pollOnce(); }, 1500);
        const done = () => { window.clearInterval(timer); setBusy(false); setRunningId(null); };
        (mode === 'goal' ? autonomyService.runGoal(text, max) : autonomyService.runTaskQueue(text, max)).then(
            (loop) => { done(); void reload(loop.id); setGoal(''); },
            (e) => { done(); fail(e); },
        );
    };

    const handleAbort = async () => {
        if (!runningId) return;
        setBusy(true);
        try { await autonomyService.abortLoop(runningId); await reload(runningId); } catch (e) { fail(e); } finally { setBusy(false); setRunningId(null); }
    };

    const handleOpen = async () => {
        setError(null); setNotice(null);
        const id = openId.trim(); if (!id) return;
        try {
            const loop = await autonomyService.getLoop(id);
            if (!loop) { setNotice(t('autonomy.open.notFound')); return; }
            await reload(loop.id); setOpenId('');
        } catch (e) { fail(e); }
    };

    const filtered = search.trim() ? loops.filter((l) => l.goal.toLowerCase().includes(search.toLowerCase())) : loops;

    return (
        <div style={{ display: 'flex', height: '100%', background: 'var(--slate-900)', color: 'var(--slate-200)' }}>
            {/* Sidebar */}
            <div style={{ width: 360, minWidth: 360, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{t('autonomy.title')}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>{t('autonomy.subtitle')}</div>
                    {error && <div style={{ marginTop: 8, color: 'var(--error)', fontSize: 12 }}>{error}</div>}
                    {notice && <div style={{ marginTop: 8, color: '#f59e0b', fontSize: 12 }}>{notice}</div>}
                </div>

                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6 }}>
                    <input placeholder={t('common.search') ?? 'Search goals…'} value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12 }} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20, color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>{t('autonomy.list.empty')}</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {filtered.map((l) => (
                                <div key={l.id} onClick={() => setActiveId(l.id)} style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: l.id === activeId ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', borderLeft: l.id === activeId ? '3px solid #3b82f6' : '3px solid transparent', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.goal.slice(0, 80)}</div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                                        <StatusBadge status={l.kind} label={t(`autonomy.kind.${l.kind}`)} />
                                        <StatusBadge status={l.status} label={t(`autonomy.status.${l.status}`)} />
                                        <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{l.iterations}/{l.maxIterations}</span>
                                        {l.status === 'running' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 1s infinite' }} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6 }}>
                    <input placeholder={t('autonomy.openPlaceholder')} value={openId} onChange={(e) => setOpenId(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void handleOpen(); }} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11 }} />
                    <Button variant="ghost" size="sm" onClick={() => void handleOpen()}>{t('autonomy.open')}</Button>
                </div>
            </div>

            {/* Main */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input placeholder={t('autonomy.goalPlaceholder')} value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && goal.trim()) handleRun('goal'); }} style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12 }} />
                        <input type="number" min={1} value={maxIters} onChange={(e) => setMaxIters(e.target.value)} style={{ width: 70, padding: '8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        <Button variant="primary" size="sm" disabled={busy || !goal.trim()} onClick={() => handleRun('goal')}>{t('autonomy.run.goal')}</Button>
                        <Button variant="secondary" size="sm" disabled={busy || !goal.trim()} onClick={() => handleRun('queue')}>{t('autonomy.run.queue')}</Button>
                        {runningId && <Button variant="danger" size="sm" onClick={() => void handleAbort()}>{t('autonomy.abort')}</Button>}
                        {busy && <span style={{ fontSize: 11, color: 'var(--slate-500)', alignSelf: 'center' }}>{t('autonomy.running')}…</span>}
                    </div>
                </div>

                {!active ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-500)', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 32, opacity: 0.2 }}>🤖</div>
                        <div style={{ fontSize: 12, maxWidth: 360, textAlign: 'center' }}>Select a loop on the left or start a new goal above. Loops poll every 1.5s while running.</div>
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: 14 }}>{active.goal.slice(0, 100)}</span>
                            <StatusBadge status={active.status} label={t(`autonomy.status.${active.status}`)} />
                            <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{t(`autonomy.kind.${active.kind}`)} · {active.iterations}/{active.maxIterations}</span>
                        </div>

                        {active.taskList.length > 0 && (
                            <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)', marginBottom: 8 }}>{t('autonomy.tasks.heading')} · {active.taskList.length}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {active.taskList.map((task) => (
                                        <div key={task.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', fontSize: 12 }}>
                                            <StatusBadge status={task.status} label={t(`autonomy.task.${task.status}`)} />
                                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{t('autonomy.log.heading')} · {active.log.length}</div>
                        {active.log.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 16, color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>{t('autonomy.log.empty')}</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {active.log.map((line, i) => (
                                    <div key={`${i}-${line.slice(0, 24)}`} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{line}</div>
                                ))}
                            </div>
                        )}

                        {active.result && (
                            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>{t('autonomy.result.heading')}</div>
                                <div style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{active.result}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
