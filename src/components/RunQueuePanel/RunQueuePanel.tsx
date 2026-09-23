import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { runQueueService } from '../../kernel/instances/services-extras';
import type { QueuedRun, Toolkit } from '../../kernel/contracts/rivals';
import { Button, StatusBadge } from '../../components/Common';

function byNewest(a: QueuedRun, b: QueuedRun): number {
    return b.createdAt - a.createdAt;
}

const KINDS: QueuedRun['kind'][] = ['crew', 'graph', 'eval'];

export default function RunQueuePanel() {
    const { t } = useTranslation();
    const [runs, setRuns] = useState<QueuedRun[]>([]);
    const [toolkits, setToolkits] = useState<Toolkit[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [kind, setKind] = useState<QueuedRun['kind']>('crew');
    const [refId, setRefId] = useState('');
    const [inputJson, setInputJson] = useState('');
    const [drainConcurrency, setDrainConcurrency] = useState('1');
    const [tkName, setTkName] = useState('');
    const [tkPrefixes, setTkPrefixes] = useState('');
    const [search, setSearch] = useState('');

    const active = runs.find((r) => r.id === activeId) ?? null;

    const fail = (e: unknown) => {
        console.error('[RunQueuePanel]', e);
        setError(t('runQueue.error.generic'));
    };

    const reload = async () => {
        try {
            const [q, tk] = await Promise.all([runQueueService.list(), runQueueService.listToolkits()]);
            setRuns([...q].sort(byNewest));
            setToolkits(tk);
            if (activeId === null && q.length > 0) {
                const sorted = [...q].sort(byNewest);
                setActiveId(sorted[0]!.id);
            }
        } catch (e) { fail(e); }
    };

    useEffect(() => { void reload(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

    const handleEnqueue = async () => {
        setError(null); setNotice(null);
        if (!refId.trim()) { setNotice(t('runQueue.validation.refId')); return; }
        setBusy(true);
        try {
            let parsed: Record<string, unknown> | undefined;
            if (inputJson.trim()) {
                try { parsed = JSON.parse(inputJson) as Record<string, unknown>; } catch { setNotice(t('runQueue.validation.json')); setBusy(false); return; }
            }
            const item = await runQueueService.enqueue(kind, refId.trim().slice(0, 200), parsed);
            setRuns((prev) => [item, ...prev]);
            setActiveId(item.id);
            setRefId(''); setInputJson('');
        } catch (e) { fail(e); } finally { setBusy(false); }
    };

    const handleDrain = async () => {
        setError(null); setNotice(null); setBusy(true);
        try {
            const concurrency = Math.max(1, Math.min(4, Number(drainConcurrency) || 1));
            const done = await runQueueService.drain(concurrency);
            if (done.length > 0) setNotice(t('runQueue.drain.done', { count: String(done.length) }));
            else setNotice(t('runQueue.drain.empty'));
            await reload();
        } catch (e) { fail(e); } finally { setBusy(false); }
    };

    const handleDefineToolkit = async () => {
        setError(null); setNotice(null);
        if (!tkName.trim()) { setNotice(t('runQueue.validation.toolkitName')); return; }
        setBusy(true);
        try {
            const prefixes = tkPrefixes.split(',').map((p) => p.trim()).filter(Boolean);
            const tk = await runQueueService.defineToolkit(tkName.trim().slice(0, 80), prefixes);
            setToolkits((prev) => [...prev, tk]);
            setTkName(''); setTkPrefixes('');
        } catch (e) { fail(e); } finally { setBusy(false); }
    };

    const filtered = search.trim() ? runs.filter((r) => r.refId.toLowerCase().includes(search.toLowerCase()) || r.kind.toLowerCase().includes(search.toLowerCase())) : runs;
    const statusColor: Record<string, string> = { queued: '#f59e0b', running: '#3b82f6', completed: '#10b981', failed: '#ef4444' };

    return (
        <div style={{ display: 'flex', height: '100%', background: 'var(--slate-900)', color: 'var(--slate-200)' }}>
            <div style={{ width: 360, minWidth: 360, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{t('runQueue.title')}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>{t('runQueue.subtitle')}</div>
                    {error && <div style={{ marginTop: 8, color: 'var(--error)', fontSize: 12 }}>{error}</div>}
                    {notice && <div style={{ marginTop: 8, color: '#10b981', fontSize: 12 }}>{notice}</div>}
                </div>

                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <input placeholder={t('common.search') ?? 'Search refId…'} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12 }} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20, color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>{t('runQueue.queue.empty')}</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {filtered.map((r) => (
                                <div key={r.id} onClick={() => setActiveId(r.id)} style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: r.id === activeId ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${statusColor[r.status] ?? '#64748b'}`, border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.refId.slice(0, 60)}</div>
                                    <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <StatusBadge status={r.status} label={t(`runQueue.status.${r.status}`)} />
                                        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'var(--slate-400)' }}>{t(`runQueue.kind.${r.kind}`)}</span>
                                        <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>{new Date(r.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{t('runQueue.toolkits.heading')} · {toolkits.length}</div>
                    {toolkits.length === 0 ? (
                        <div style={{ fontSize: 11, color: 'var(--slate-500)', fontStyle: 'italic' }}>{t('runQueue.toolkits.empty')}</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 100, overflowY: 'auto', marginBottom: 8 }}>
                            {toolkits.map((tk) => (
                                <div key={tk.id} style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', fontSize: 11 }}>
                                    <span style={{ fontWeight: 700 }}>{tk.name}</span> <span style={{ color: 'var(--slate-500)', fontSize: 10 }}>[{tk.prefixes.join(', ')}]</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <input placeholder={t('runQueue.toolkit.namePlaceholder')} value={tkName} onChange={(e) => setTkName(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11, marginBottom: 6 }} />
                    <input placeholder={t('runQueue.toolkit.prefixesPlaceholder')} value={tkPrefixes} onChange={(e) => setTkPrefixes(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11, marginBottom: 6 }} />
                    <Button variant="ghost" size="sm" disabled={busy || !tkName.trim()} onClick={() => void handleDefineToolkit()} style={{ width: '100%' }}>{t('runQueue.toolkit.define')}</Button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 8 }}>{t('runQueue.enqueue.heading')}</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <select value={kind} onChange={(e) => setKind(e.target.value as QueuedRun['kind'])} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'inherit', fontSize: 11, minWidth: 110 }}>
                            {KINDS.map((k) => <option key={k} value={k}>{t(`runQueue.kind.${k}`)}</option>)}
                        </select>
                        <input placeholder={t('runQueue.refIdPlaceholder')} value={refId} onChange={(e) => setRefId(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && refId.trim()) void handleEnqueue(); }} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12 }} />
                    </div>
                    <textarea placeholder={t('runQueue.inputJsonPlaceholder')} value={inputJson} onChange={(e) => setInputJson(e.target.value)} rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11, resize: 'vertical', marginBottom: 8, fontFamily: 'monospace' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="primary" size="sm" disabled={busy || !refId.trim()} onClick={() => void handleEnqueue()}>{t('runQueue.enqueue.submit')}</Button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                            <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{t('runQueue.drain.concurrency')}</span>
                            <input type="number" min={1} max={4} value={drainConcurrency} onChange={(e) => setDrainConcurrency(e.target.value)} style={{ width: 60, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 11 }} />
                            <Button variant="accent" size="sm" disabled={busy} onClick={() => void handleDrain()}>{t('runQueue.drain.submit')}</Button>
                        </div>
                    </div>
                </div>

                {!active ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-500)', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 32, opacity: 0.2 }}>📦</div>
                        <div style={{ fontSize: 12, maxWidth: 360, textAlign: 'center' }}>Select a run on the left or enqueue a new one above. Drain executes queued runs up to concurrency.</div>
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{active.refId.slice(0, 80)}</span>
                            <StatusBadge status={active.status} label={t(`runQueue.status.${active.status}`)} />
                            <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'var(--slate-400)' }}>{t(`runQueue.kind.${active.kind}`)}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--slate-500)', marginBottom: 12 }}>{active.id} · {new Date(active.createdAt).toLocaleString()}</div>
                        {active.result ? (
                            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>{t('runQueue.result.heading')}</div>
                                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, margin: 0, wordBreak: 'break-word' }}>{active.result}</pre>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 20, color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>No result yet — drain the queue to execute</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
