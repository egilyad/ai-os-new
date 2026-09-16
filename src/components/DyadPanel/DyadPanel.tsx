import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { dyadService } from '../../kernel/instances/services-extras';
import type { AgentLoop } from '../../kernel/contracts/rivals';
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
            const all = await dyadService.listLoops();
            const sorted = [...all].filter((l) => l.kind === 'dyad').sort(byNewest);
            setLoops(sorted);
            const running = sorted.find((l) => l.status === 'running') ?? null;
            if (running) setActiveId(running.id);
        } catch (e) {
            fail(e);
        }
    };

    const handleStart = () => {
        setError(null);
        setNotice(null);
        if (!topic.trim()) {
            setNotice(t('dyad.validation.topic'));
            return;
        }
        const text = topic.trim().slice(0, 500);
        const max = Math.max(2, Math.min(30, Number(maxTurns) || 10));
        setBusy(true);
        const timer = window.setInterval(() => {
            if (busyRef.current) void pollOnce();
        }, 1500);
        const done = () => {
            window.clearInterval(timer);
            setBusy(false);
        };
        dyadService
            .startDyad({
                topic: text,
                userRole: userRole.trim() || undefined,
                assistantRole: assistantRole.trim() || undefined,
                maxTurns: max,
            })
            .then(
                (loop) => {
                    done();
                    void reload(loop.id);
                    setTopic('');
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
            const loop = await dyadService.getLoop(id);
            if (!loop) {
                setNotice(t('dyad.open.notFound'));
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
            <h2 style={{ margin: 0 }}>{t('dyad.title')}</h2>
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('dyad.subtitle')}</p>
            {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
            {notice && <p style={{ opacity: 0.8 }}>{notice}</p>}

            <section aria-label={t('dyad.run.heading')}>
                <h3>{t('dyad.run.heading')}</h3>
                <input
                    aria-label={t('dyad.topic')}
                    placeholder={t('dyad.topicPlaceholder')}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <input
                        aria-label={t('dyad.userRole')}
                        placeholder={t('dyad.userRolePlaceholder')}
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 200 }}
                    />
                    <input
                        aria-label={t('dyad.assistantRole')}
                        placeholder={t('dyad.assistantRolePlaceholder')}
                        value={assistantRole}
                        onChange={(e) => setAssistantRole(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 200 }}
                    />
                    <input
                        aria-label={t('dyad.maxTurns')}
                        type="number"
                        min={2}
                        max={30}
                        value={maxTurns}
                        onChange={(e) => setMaxTurns(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 90 }}
                    />
                    <Button variant="primary" size="sm" disabled={busy} onClick={handleStart}>
                        {t('dyad.run.start')}
                    </Button>
                </div>
                {busy && <p style={{ opacity: 0.7 }}>{t('dyad.running')}</p>}
            </section>

            <section aria-label={t('dyad.list.heading')}>
                <h3>{t('dyad.list.heading')}</h3>
                {loops.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('dyad.list.empty')}</p>
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
                                <StatusBadge status={l.status} label={t(`dyad.status.${l.status}`)} />{' '}
                                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                                    {l.iterations}/{l.maxIterations}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <input
                        aria-label={t('dyad.openById')}
                        placeholder={t('dyad.openPlaceholder')}
                        value={openId}
                        onChange={(e) => setOpenId(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <Button variant="ghost" size="sm" onClick={() => void handleOpen()}>
                        {t('dyad.open')}
                    </Button>
                </div>
            </section>

            {active && (
                <section aria-label={t('dyad.loop.heading')}>
                    <h3>
                        {active.goal.slice(0, 80)}{' '}
                        <StatusBadge status={active.status} label={t(`dyad.status.${active.status}`)} />
                    </h3>
                    <p style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                        {active.iterations}/{active.maxIterations}
                    </p>

                    <h4>{t('dyad.log.heading')}</h4>
                    {active.log.length === 0 ? (
                        <p style={{ opacity: 0.6 }}>{t('dyad.log.empty')}</p>
                    ) : (
                        <ul role="log" aria-live="polite">
                            {active.log.map((line, i) => (
                                <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                            ))}
                        </ul>
                    )}

                    {active.result && (
                        <>
                            <h4>{t('dyad.result.heading')}</h4>
                            <p>{active.result}</p>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}
