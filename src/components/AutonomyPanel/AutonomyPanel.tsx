import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { autonomyService } from '../../kernel/instances/services-extras';
import type { AgentLoop } from '../../kernel/contracts/rivals';
import { Button, StatusBadge } from '../../components/Common';

type Mode = 'goal' | 'queue';

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
            if (selectId) {
                setActiveId(selectId);
            } else if (activeId === null && sorted.length > 0) {
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

    const pollOnce = async () => {
        try {
            const all = await autonomyService.listLoops();
            const sorted = [...all].sort(byNewest);
            setLoops(sorted);
            const running = sorted.find((l) => l.status === 'running') ?? null;
            setRunningId(running ? running.id : null);
            if (running) setActiveId(running.id);
        } catch (e) {
            fail(e);
        }
    };

    const handleRun = (mode: Mode) => {
        setError(null);
        setNotice(null);
        if (!goal.trim()) {
            setNotice(t('autonomy.validation.goal'));
            return;
        }
        const text = goal.trim().slice(0, 500);
        const max = Math.max(1, Number(maxIters) || 8);
        setBusy(true);
        setRunningId(null);
        const timer = window.setInterval(() => {
            if (busyRef.current) void pollOnce();
        }, 1500);
        const done = () => {
            window.clearInterval(timer);
            setBusy(false);
            setRunningId(null);
        };
        (mode === 'goal' ? autonomyService.runGoal(text, max) : autonomyService.runTaskQueue(text, max)).then(
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

    const handleAbort = async () => {
        if (!runningId) return;
        setBusy(true);
        try {
            await autonomyService.abortLoop(runningId);
            await reload(runningId);
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
            setRunningId(null);
        }
    };

    const handleOpen = async () => {
        setError(null);
        setNotice(null);
        const id = openId.trim();
        if (!id) return;
        try {
            const loop = await autonomyService.getLoop(id);
            if (!loop) {
                setNotice(t('autonomy.open.notFound'));
                return;
            }
            await reload(loop.id);
            setOpenId('');
        } catch (e) {
            fail(e);
        }
    };

    return (
        <div style={{ padding: '0.75rem 1rem' }}>
            <h2 style={{ margin: 0 }}>{t('autonomy.title')}</h2>
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('autonomy.subtitle')}</p>
            {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
            {notice && <p style={{ opacity: 0.8 }}>{notice}</p>}

            <section aria-label={t('autonomy.run.heading')}>
                <h3>{t('autonomy.run.heading')}</h3>
                <input
                    aria-label={t('autonomy.goal')}
                    placeholder={t('autonomy.goalPlaceholder')}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <input
                        aria-label={t('autonomy.maxIters')}
                        type="number"
                        min={1}
                        value={maxIters}
                        onChange={(e) => setMaxIters(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 110 }}
                    />
                    <Button variant="primary" size="sm" disabled={busy} onClick={() => handleRun('goal')}>
                        {t('autonomy.run.goal')}
                    </Button>
                    <Button variant="secondary" size="sm" disabled={busy} onClick={() => handleRun('queue')}>
                        {t('autonomy.run.queue')}
                    </Button>
                    {runningId && (
                        <Button variant="danger" size="sm" onClick={() => void handleAbort()}>
                            {t('autonomy.abort')}
                        </Button>
                    )}
                </div>
                {busy && <p style={{ opacity: 0.7 }}>{t('autonomy.running')}</p>}
            </section>

            <section aria-label={t('autonomy.list.heading')}>
                <h3>{t('autonomy.list.heading')}</h3>
                {loops.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('autonomy.list.empty')}</p>
                ) : (
                    <ul>
                        {loops.map((l) => (
                            <li key={l.id}>
                                <button
                                    type="button"
                                    onClick={() => setActiveId(l.id)}
                                    style={{ fontWeight: l.id === activeId ? 700 : 400 }}
                                >
                                    {l.goal.slice(0, 60)}
                                </button>{' '}
                                <StatusBadge status={l.kind} label={t(`autonomy.kind.${l.kind}`)} />{' '}
                                <StatusBadge status={l.status} label={t(`autonomy.status.${l.status}`)} />{' '}
                                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                                    {l.iterations}/{l.maxIterations}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <input
                        aria-label={t('autonomy.openById')}
                        placeholder={t('autonomy.openPlaceholder')}
                        value={openId}
                        onChange={(e) => setOpenId(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <Button variant="ghost" size="sm" onClick={() => void handleOpen()}>
                        {t('autonomy.open')}
                    </Button>
                </div>
            </section>

            {active && (
                <section aria-label={t('autonomy.loop.heading')}>
                    <h3>
                        {active.goal.slice(0, 80)}{' '}
                        <StatusBadge status={active.status} label={t(`autonomy.status.${active.status}`)} />
                    </h3>
                    <p style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                        {t(`autonomy.kind.${active.kind}`)} · {active.iterations}/{active.maxIterations}
                    </p>

                    {active.taskList.length > 0 && (
                        <>
                            <h4>{t('autonomy.tasks.heading')}</h4>
                            <ul>
                                {active.taskList.map((task) => (
                                    <li key={task.id}>
                                        <StatusBadge
                                            status={task.status}
                                            label={t(`autonomy.task.${task.status}`)}
                                        />{' '}
                                        {task.text}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    <h4>{t('autonomy.log.heading')}</h4>
                    {active.log.length === 0 ? (
                        <p style={{ opacity: 0.6 }}>{t('autonomy.log.empty')}</p>
                    ) : (
                        <ul role="log" aria-live="polite">
                            {active.log.map((line, i) => (
                                <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                            ))}
                        </ul>
                    )}

                    {active.result && (
                        <>
                            <h4>{t('autonomy.result.heading')}</h4>
                            <p>{active.result}</p>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}
