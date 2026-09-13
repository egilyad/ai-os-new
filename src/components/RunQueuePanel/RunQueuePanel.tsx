import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { runQueueService } from '../../kernel/instances/services-extras';
import type { QueuedRun, Toolkit } from '../../kernel/contracts/rivals';
import { Button, StatusBadge } from '../../components/Common';

const inputStyle: React.CSSProperties = {
    width: '100%',
    marginBottom: '0.35rem',
    background: 'var(--bg-elevated)',
    color: 'inherit',
    border: '1px solid var(--border-subtle)',
    borderRadius: 6,
    padding: '0.3rem 0.5rem',
};

const KINDS: QueuedRun['kind'][] = ['crew', 'graph', 'eval'];

function byNewest(a: QueuedRun, b: QueuedRun): number {
    return b.createdAt - a.createdAt;
}

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
        } catch (e) {
            fail(e);
        }
    };

    useEffect(() => {
        void reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEnqueue = async () => {
        setError(null);
        setNotice(null);
        if (!refId.trim()) {
            setNotice(t('runQueue.validation.refId'));
            return;
        }
        setBusy(true);
        try {
            let parsed: Record<string, unknown> | undefined;
            if (inputJson.trim()) {
                try {
                    parsed = JSON.parse(inputJson) as Record<string, unknown>;
                } catch {
                    setNotice(t('runQueue.validation.json'));
                    setBusy(false);
                    return;
                }
            }
            const item = await runQueueService.enqueue(kind, refId.trim().slice(0, 200), parsed);
            setRuns((prev) => [item, ...prev]);
            setActiveId(item.id);
            setRefId('');
            setInputJson('');
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    const handleDrain = async () => {
        setError(null);
        setNotice(null);
        setBusy(true);
        try {
            const concurrency = Math.max(1, Math.min(4, Number(drainConcurrency) || 1));
            const done = await runQueueService.drain(concurrency);
            if (done.length > 0) {
                setNotice(t('runQueue.drain.done', { count: String(done.length) }));
            } else {
                setNotice(t('runQueue.drain.empty'));
            }
            await reload();
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    const handleDefineToolkit = async () => {
        setError(null);
        setNotice(null);
        if (!tkName.trim()) {
            setNotice(t('runQueue.validation.toolkitName'));
            return;
        }
        setBusy(true);
        try {
            const prefixes = tkPrefixes.split(',').map((p) => p.trim()).filter(Boolean);
            const tk = await runQueueService.defineToolkit(tkName.trim().slice(0, 80), prefixes);
            setToolkits((prev) => [...prev, tk]);
            setTkName('');
            setTkPrefixes('');
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={{ padding: '0.75rem 1rem' }}>
            <h2 style={{ margin: 0 }}>{t('runQueue.title')}</h2>
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('runQueue.subtitle')}</p>
            {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
            {notice && <p style={{ opacity: 0.8 }}>{notice}</p>}

            <section aria-label={t('runQueue.enqueue.heading')}>
                <h3>{t('runQueue.enqueue.heading')}</h3>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    <select
                        aria-label={t('runQueue.kind')}
                        value={kind}
                        onChange={(e) => setKind(e.target.value as QueuedRun['kind'])}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 140 }}
                    >
                        {KINDS.map((k) => (
                            <option key={k} value={k}>
                                {t(`runQueue.kind.${k}`)}
                            </option>
                        ))}
                    </select>
                    <input
                        aria-label={t('runQueue.refId')}
                        placeholder={t('runQueue.refIdPlaceholder')}
                        value={refId}
                        onChange={(e) => setRefId(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    />
                </div>
                <textarea
                    aria-label={t('runQueue.inputJson')}
                    placeholder={t('runQueue.inputJsonPlaceholder')}
                    value={inputJson}
                    onChange={(e) => setInputJson(e.target.value)}
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical' }}
                />
                <Button variant="primary" size="sm" disabled={busy} onClick={() => void handleEnqueue()}>
                    {t('runQueue.enqueue.submit')}
                </Button>
            </section>

            <section aria-label={t('runQueue.queue.heading')}>
                <h3>{t('runQueue.queue.heading')}</h3>
                {runs.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('runQueue.queue.empty')}</p>
                ) : (
                    <ul>
                        {runs.map((r) => (
                            <li key={r.id}>
                                <button
                                    type="button"
                                    onClick={() => setActiveId(r.id)}
                                    style={{ fontWeight: r.id === activeId ? 700 : 400 }}
                                >
                                    {r.refId.slice(0, 60)}
                                </button>{' '}
                                <StatusBadge status={r.status} label={t(`runQueue.status.${r.status}`)} />{' '}
                                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                                    {t(`runQueue.kind.${r.kind}`)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>{t('runQueue.drain.concurrency')}</label>
                    <input
                        aria-label={t('runQueue.drain.concurrency')}
                        type="number"
                        min={1}
                        max={4}
                        value={drainConcurrency}
                        onChange={(e) => setDrainConcurrency(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 70 }}
                    />
                    <Button variant="accent" size="sm" disabled={busy} onClick={() => void handleDrain()}>
                        {t('runQueue.drain.submit')}
                    </Button>
                </div>
            </section>

            {active && (
                <section aria-label={t('runQueue.detail.heading')}>
                    <h3>
                        {active.refId.slice(0, 80)}{' '}
                        <StatusBadge status={active.status} label={t(`runQueue.status.${active.status}`)} />
                    </h3>
                    <p style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                        {t(`runQueue.kind.${active.kind}`)} · {active.id}
                    </p>
                    {active.result && (
                        <div>
                            <h4>{t('runQueue.result.heading')}</h4>
                            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', opacity: 0.85 }}>
                                {active.result}
                            </pre>
                        </div>
                    )}
                </section>
            )}

            <section aria-label={t('runQueue.toolkits.heading')}>
                <h3>{t('runQueue.toolkits.heading')}</h3>
                {toolkits.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('runQueue.toolkits.empty')}</p>
                ) : (
                    <ul>
                        {toolkits.map((tk) => (
                            <li key={tk.id}>
                                <strong>{tk.name}</strong>{' '}
                                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                                    [{tk.prefixes.join(', ')}]
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <input
                        aria-label={t('runQueue.toolkit.name')}
                        placeholder={t('runQueue.toolkit.namePlaceholder')}
                        value={tkName}
                        onChange={(e) => setTkName(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <input
                        aria-label={t('runQueue.toolkit.prefixes')}
                        placeholder={t('runQueue.toolkit.prefixesPlaceholder')}
                        value={tkPrefixes}
                        onChange={(e) => setTkPrefixes(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => void handleDefineToolkit()}>
                        {t('runQueue.toolkit.define')}
                    </Button>
                </div>
            </section>
        </div>
    );
}
