import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { sopService, autonomyService } from '../../kernel/instances/services-extras';
import type { AgentLoop, SopDefinition } from '../../kernel/contracts/rivals';
import { Button, StatusBadge } from '../../components/Common';

function byNewest(a: AgentLoop, b: AgentLoop): number {
    return b.createdAt - a.createdAt;
}

export default function SopPanel() {
    const { t } = useTranslation();
    const [sops, setSops] = useState<SopDefinition[]>([]);
    const [runs, setRuns] = useState<AgentLoop[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [selectedSop, setSelectedSop] = useState('');
    const [goal, setGoal] = useState('');
    const [openId, setOpenId] = useState('');
    const [search, setSearch] = useState('');
    const busyRef = useRef(false);
    busyRef.current = busy;
    const active = runs.find((l) => l.id === activeId) ?? null;

    const fail = (e: unknown) => {
        console.error('[SopPanel]', e);
        setError(t('sop.error.generic'));
    };

    const reload = async (selectId?: string) => {
        try {
            const [defs, loops] = await Promise.all([sopService.listSops(), autonomyService.listLoops()]);
            setSops(defs);
            const sopRuns = [...loops].filter((l) => l.kind === 'sop').sort(byNewest);
            setRuns(sopRuns);
            if (selectId) setActiveId(selectId);
            else if (activeId === null && sopRuns.length > 0) setActiveId(sopRuns[0]!.id);
            if (defs.length > 0 && !selectedSop) setSelectedSop(defs[0]!.id);
        } catch (e) { fail(e); }
    };

    useEffect(() => { void reload(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

    const pollOnce = async () => {
        try {
            const loops = await autonomyService.listLoops();
            const sopRuns = [...loops].filter((l) => l.kind === 'sop').sort(byNewest);
            setRuns(sopRuns);
            const running = sopRuns.find((l) => l.status === 'running') ?? null;
            if (running) setActiveId(running.id);
        } catch (e) { fail(e); }
    };

    const handleRun = () => {
        setError(null); setNotice(null);
        if (!selectedSop) { setNotice(t('sop.validation.noSop')); return; }
        if (!goal.trim()) { setNotice(t('sop.validation.goal')); return; }
        const text = goal.trim().slice(0, 500);
        setBusy(true);
        const timer = window.setInterval(() => { if (busyRef.current) void pollOnce(); }, 2000);
        const done = () => { window.clearInterval(timer); setBusy(false); };
        sopService.runSop(selectedSop, text).then(
            (loop) => { done(); void reload(loop.id); setGoal(''); },
            (e) => { done(); fail(e); },
        );
    };

    const handleOpen = async () => {
        setError(null); setNotice(null);
        const id = openId.trim(); if (!id) return;
        try {
            const loop = await autonomyService.getLoop(id);
            if (!loop) { setNotice(t('sop.open.notFound')); return; }
            await reload(loop.id); setOpenId('');
        } catch (e) { fail(e); }
    };

    const activeDef = sops.find((s) => s.id === selectedSop) ?? null;
    const filteredSops = search.trim() ? sops.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())) : sops;
    const filteredRuns = search.trim() ? runs.filter((r) => r.goal.toLowerCase().includes(search.toLowerCase())) : runs;

    return (
        <div style={{ display: 'flex', height: '100%', background: 'var(--slate-900)', color: 'var(--slate-200)' }}>
            <div style={{ width: 360, minWidth: 360, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{t('sop.title')}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>{t('sop.subtitle')}</div>
                    {error && <div style={{ marginTop: 8, color: 'var(--error)', fontSize: 12 }}>{error}</div>}
                    {notice && <div style={{ marginTop: 8, color: '#f59e0b', fontSize: 12 }}>{notice}</div>}
                </div>

                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <input placeholder={t('common.search') ?? 'Search SOPs…'} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12 }} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{t('sop.definitions.heading')} · {filteredSops.length}</div>
                        {filteredSops.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 16, color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>{t('sop.definitions.empty')}</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {filteredSops.map((s) => (
                                    <div key={s.id} onClick={() => setSelectedSop(s.id)} style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: s.id === selectedSop ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.03)', borderLeft: s.id === selectedSop ? '3px solid #a855f7' : '3px solid transparent', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ fontWeight: 700, fontSize: 12 }}>{s.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 4 }}>{s.phases.length} phases</div>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                                            {s.phases.slice(0, 3).map((p) => <span key={p.name} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'var(--slate-400)' }}>{p.role}</span>)}
                                            {s.phases.length > 3 && <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>+{s.phases.length - 3}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{t('sop.runs.heading')} · {filteredRuns.length}</div>
                        {filteredRuns.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 16, color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>{t('sop.runs.empty')}</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {filteredRuns.map((r) => (
                                    <div key={r.id} onClick={() => setActiveId(r.id)} style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: r.id === activeId ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', borderLeft: r.id === activeId ? '3px solid #3b82f6' : '3px solid transparent', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.goal.slice(0, 60)}</div>
                                        <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                                            <StatusBadge status={r.status} label={t(`sop.status.${r.status}`)} />
                                            <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{r.iterations}/{r.maxIterations}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                            <input placeholder={t('sop.openPlaceholder')} value={openId} onChange={(e) => setOpenId(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void handleOpen(); }} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11 }} />
                            <Button variant="ghost" size="sm" onClick={() => void handleOpen()}>{t('sop.open')}</Button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {activeDef && (
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(168,85,247,0.04)' }}>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{activeDef.name}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            {activeDef.phases.map((p, i) => (
                                <div key={`${p.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11 }}>
                                    <span style={{ width: 18, height: 18, borderRadius: 6, background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10 }}>{i + 1}</span>
                                    <span style={{ fontWeight: 700 }}>{p.role}</span>
                                    <span style={{ color: 'var(--slate-500)' }}>→</span>
                                    <span style={{ color: '#c4b5fd' }}>{p.artifact}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-400)', fontStyle: 'italic' }}>{activeDef.phases.map((p) => p.instruction).join(' · ').slice(0, 200)}</div>
                    </div>
                )}

                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: 8 }}>
                    <input placeholder={t('sop.goalPlaceholder')} value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && goal.trim() && selectedSop) handleRun(); }} style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12 }} />
                    <Button variant="primary" size="sm" disabled={busy || !selectedSop} onClick={handleRun}>{t('sop.run.start')}</Button>
                    {busy && <span style={{ fontSize: 11, color: 'var(--slate-500)', alignSelf: 'center' }}>{t('sop.running')}…</span>}
                </div>

                {!active ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-500)', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 32, opacity: 0.2 }}>📋</div>
                        <div style={{ fontSize: 12, maxWidth: 360, textAlign: 'center' }}>Pick an SOP on the left, enter a goal above, and run. Phases execute as an autonomous loop.</div>
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontWeight: 800, fontSize: 14 }}>{active.goal.slice(0, 100)}</span>
                            <StatusBadge status={active.status} label={t(`sop.status.${active.status}`)} />
                            <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>Phase {active.iterations}/{active.maxIterations}</span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{t('sop.log.heading')} · {active.log.length}</div>
                        {active.log.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 16, color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>{t('sop.log.empty')}</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {active.log.map((line, i) => (
                                    <div key={`${i}-${line.slice(0, 24)}`} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{line}</div>
                                ))}
                            </div>
                        )}
                        {active.result && (
                            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', whiteSpace: 'pre-wrap', fontSize: 12 }}>{active.result}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
