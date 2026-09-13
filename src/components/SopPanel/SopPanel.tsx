import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { sopService, autonomyService } from '../../kernel/instances/services-extras';
import type { AgentLoop, SopDefinition } from '../../kernel/contracts/rivals';
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
            if (selectId) {
                setActiveId(selectId);
            } else if (activeId === null && sopRuns.length > 0) {
                setActiveId(sopRuns[0]!.id);
            }
            if (defs.length > 0 && !selectedSop) {
                setSelectedSop(defs[0]!.id);
            }
        } catch (e) {
            fail(e);
        }
    };

    useEffect(() => {
        void reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pollOnce = async () => {
        try {
            const loops = await autonomyService.listLoops();
            const sopRuns = [...loops].filter((l) => l.kind === 'sop').sort(byNewest);
            setRuns(sopRuns);
            const running = sopRuns.find((l) => l.status === 'running') ?? null;
            if (running) setActiveId(running.id);
        } catch (e) {
            fail(e);
        }
    };

    const handleRun = () => {
        setError(null);
        setNotice(null);
        if (!selectedSop) {
            setNotice(t('sop.validation.noSop'));
            return;
        }
        if (!goal.trim()) {
            setNotice(t('sop.validation.goal'));
            return;
        }
        const text = goal.trim().slice(0, 500);
        setBusy(true);
        const timer = window.setInterval(() => {
            if (busyRef.current) void pollOnce();
        }, 2000);
        const done = () => {
            window.clearInterval(timer);
            setBusy(false);
        };
        sopService.runSop(selectedSop, text).then(
            (loop) => {
                done();
                void reload(loop.id);
                setGoal('');
            },
            (e: unknown) => {
                done();
                fail(e);
            },
        );
    };

    const handleOpen = async () => {
        setError(null);
        setNotice(null);
        const id = openId.trim();
        if (!id) return;
        try {
            const loop = await autonomyService.getLoop(id);
            if (!loop) {
                setNotice(t('sop.open.notFound'));
                return;
            }
            await reload(loop.id);
            setOpenId('');
        } catch (e) {
            fail(e);
        }
    };

    const activeDef = sops.find((s) => s.id === selectedSop) ?? null;

    return (
        <div style={{ padding: '0.75rem 1rem' }}>
            <h2 style={{ margin: 0 }}>{t('sop.title')}</h2>
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('sop.subtitle')}</p>
            {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
            {notice && <p style={{ opacity: 0.8 }}>{notice}</p>}

            <section aria-label={t('sop.definitions.heading')}>
                <h3>{t('sop.definitions.heading')}</h3>
                {sops.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('sop.definitions.empty')}</p>
                ) : (
                    <ul>
                        {sops.map((s) => (
                            <li key={s.id}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedSop(s.id)}
                                    style={{ fontWeight: s.id === selectedSop ? 700 : 400 }}
                                >
                                    {s.name}
                                </button>{' '}
                                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                                    {s.phases.length} phases
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {activeDef && (
                <section aria-label={t('sop.phases.heading')}>
                    <h3>{activeDef.name}</h3>
                    <ol>
                        {activeDef.phases.map((p, i) => (
                            <li key={`${p.name}-${i}`}>
                                <strong>{p.role}</strong> → <em>{p.artifact}</em>: {p.instruction}
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            <section aria-label={t('sop.run.heading')}>
                <h3>{t('sop.run.heading')}</h3>
                <input
                    aria-label={t('sop.goal')}
                    placeholder={t('sop.goalPlaceholder')}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    style={inputStyle}
                />
                <Button variant="primary" size="sm" disabled={busy || !selectedSop} onClick={handleRun}>
                    {t('sop.run.start')}
                </Button>
                {busy && <span style={{ opacity: 0.7, marginLeft: '0.5rem' }}>{t('sop.running')}</span>}
            </section>

            <section aria-label={t('sop.runs.heading')}>
                <h3>{t('sop.runs.heading')}</h3>
                {runs.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('sop.runs.empty')}</p>
                ) : (
                    <ul>
                        {runs.map((r) => (
                            <li key={r.id}>
                                <button
                                    type="button"
                                    onClick={() => setActiveId(r.id)}
                                    style={{ fontWeight: r.id === activeId ? 700 : 400 }}
                                >
                                    {r.goal.slice(0, 60)}
                                </button>{' '}
                                <StatusBadge status={r.status} label={t(`sop.status.${r.status}`)} />{' '}
                                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                                    {r.iterations}/{r.maxIterations}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <input
                        aria-label={t('sop.openById')}
                        placeholder={t('sop.openPlaceholder')}
                        value={openId}
                        onChange={(e) => setOpenId(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <Button variant="ghost" size="sm" onClick={() => void handleOpen()}>
                        {t('sop.open')}
                    </Button>
                </div>
            </section>

            {active && (
                <section aria-label={t('sop.active.heading')}>
                    <h3>
                        {active.goal.slice(0, 80)}{' '}
                        <StatusBadge status={active.status} label={t(`sop.status.${active.status}`)} />
                    </h3>
                    <p style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                        Phase {active.iterations}/{active.maxIterations}
                    </p>

                    <h4>{t('sop.log.heading')}</h4>
                    {active.log.length === 0 ? (
                        <p style={{ opacity: 0.6 }}>{t('sop.log.empty')}</p>
                    ) : (
                        <ul role="log" aria-live="polite">
                            {active.log.map((line, i) => (
                                <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                            ))}
                        </ul>
                    )}

                    {active.result && (
                        <>
                            <h4>{t('sop.result.heading')}</h4>
                            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', opacity: 0.85 }}>
                                {active.result}
                            </pre>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}
