import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import {
    autonomyService,
    groupChatService,
    sopService,
    runQueueService,
    memoryBlocksService,
    dyadService,
} from '../../kernel/instances/services-extras';
import type {
    AgentLoop,
    GroupChat,
    SopDefinition,
    QueuedRun,
    Toolkit,
    MemoryBlock,
} from '../../kernel/contracts/rivals';
import type { QueuedRunKind } from '../../kernel/types/rival-types';
import { Button, StatusBadge } from '../../components/Common';

const QUEUE_KINDS: QueuedRunKind[] = ['crew', 'graph', 'eval'];

const inputStyle: React.CSSProperties = {
    width: '100%',
    marginBottom: '0.35rem',
    background: 'var(--bg-elevated)',
    color: 'inherit',
    border: '1px solid var(--border-subtle)',
    borderRadius: 6,
    padding: '0.3rem 0.5rem',
};

export default function RivalsHub() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [loops, setLoops] = useState<AgentLoop[]>([]);
    const [chats, setChats] = useState<GroupChat[]>([]);
    const [sops, setSops] = useState<SopDefinition[]>([]);
    const [queue, setQueue] = useState<QueuedRun[]>([]);
    const [toolkits, setToolkits] = useState<Toolkit[]>([]);
    const [blocks, setBlocks] = useState<MemoryBlock[]>([]);

    const [sopId, setSopId] = useState('');
    const [sopGoal, setSopGoal] = useState('');
    const [queueKind, setQueueKind] = useState<QueuedRunKind>('crew');
    const [queueRef, setQueueRef] = useState('');
    const [toolkitName, setToolkitName] = useState('');
    const [toolkitPrefixes, setToolkitPrefixes] = useState('');
    const [ownerId, setOwnerId] = useState('');
    const [dyadTopic, setDyadTopic] = useState('');

    const fail = (e: unknown) => {
        console.error('[RivalsHub]', e);
        setError(t('hub.error.generic'));
    };

    const reload = async () => {
        try {
            const [l, c, s, q, k] = await Promise.all([
                autonomyService.listLoops(),
                groupChatService.listChats(),
                sopService.listSops(),
                runQueueService.list(),
                runQueueService.listToolkits(),
            ]);
            setLoops([...l].sort((a, b) => b.createdAt - a.createdAt));
            setChats([...c].sort((a, b) => b.createdAt - a.createdAt));
            setSops([...s].sort((a, b) => b.createdAt - a.createdAt));
            setQueue([...q].sort((a, b) => b.createdAt - a.createdAt));
            setToolkits(k);
            if (s.length > 0) setSopId((prev) => prev || s[0]!.id);
        } catch (e) {
            fail(e);
        }
    };

    useEffect(() => {
        void reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const act = async (fn: () => Promise<unknown>) => {
        setError(null);
        setNotice(null);
        setBusy(true);
        try {
            await fn();
            await reload();
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    const need = (cond: boolean, key: string): boolean => {
        if (!cond) setNotice(t(key));
        return cond;
    };

    return (
        <div style={{ padding: '0.75rem 1rem' }}>
            <h2 style={{ margin: 0 }}>{t('hub.title')}</h2>
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('hub.subtitle')}</p>
            {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
            {notice && <p style={{ opacity: 0.8 }}>{notice}</p>}

            <section aria-label={t('hub.nav.heading')}>
                <h3>{t('hub.nav.heading')}</h3>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/group-chat')}>
                        {t('nav.group_chat')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/autonomy')}>
                        {t('nav.autonomy')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/planner')}>
                        {t('nav.planner')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/guardrails')}>
                        {t('nav.guardrails')}
                    </Button>
                </div>
            </section>

            <section aria-label={t('hub.loops.heading')}>
                <h3>{t('hub.loops.heading')}</h3>
                {loops.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('hub.empty')}</p>
                ) : (
                    <ul>
                        {loops.slice(0, 20).map((l) => (
                            <li key={l.id}>
                                <StatusBadge status={l.kind} label={t(`autonomy.kind.${l.kind}`)} />{' '}
                                <StatusBadge status={l.status} label={t(`autonomy.status.${l.status}`)} />{' '}
                                {l.goal.slice(0, 60)} · {l.iterations}/{l.maxIterations}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section aria-label={t('hub.chats.heading')}>
                <h3>{t('hub.chats.heading')}</h3>
                {chats.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('hub.empty')}</p>
                ) : (
                    <ul>
                        {chats.slice(0, 20).map((c) => (
                            <li key={c.id}>
                                {c.name} <StatusBadge status={c.status} label={t(`groupChat.status.${c.status}`)} /> ·{' '}
                                {t('hub.chats.members', { count: String(c.members.length), turns: String(c.turns.length) })}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section aria-label={t('hub.sops.heading')}>
                <h3>{t('hub.sops.heading')}</h3>
                {sops.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('hub.empty')}</p>
                ) : (
                    <ul>
                        {sops.map((s) => (
                            <li key={s.id}>
                                {s.name} · {t('hub.sops.phases', { count: String(s.phases.length) })}
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <select
                        aria-label={t('hub.sops.select')}
                        value={sopId}
                        onChange={(e) => setSopId(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 220 }}
                    >
                        {sops.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                    <input
                        aria-label={t('hub.sops.goal')}
                        placeholder={t('hub.sops.goalPlaceholder')}
                        value={sopGoal}
                        onChange={(e) => setSopGoal(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy || sops.length === 0}
                        onClick={() => {
                            if (need(sopId !== '' && sopGoal.trim() !== '', 'hub.validation.sop')) {
                                void act(() => sopService.runSop(sopId, sopGoal.trim()));
                            }
                        }}
                    >
                        {t('hub.sops.run')}
                    </Button>
                </div>
            </section>

            <section aria-label={t('hub.queue.heading')}>
                <h3>{t('hub.queue.heading')}</h3>
                {queue.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('hub.empty')}</p>
                ) : (
                    <ul>
                        {queue.map((q) => (
                            <li key={q.id}>
                                <StatusBadge status={q.kind} label={q.kind} />{' '}
                                <StatusBadge status={q.status} label={t(`hub.queue.status.${q.status}`)} /> {q.refId}
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <select
                        aria-label={t('hub.queue.kind')}
                        value={queueKind}
                        onChange={(e) => setQueueKind(e.target.value as QueuedRunKind)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 140 }}
                    >
                        {QUEUE_KINDS.map((k) => (
                            <option key={k} value={k}>
                                {k}
                            </option>
                        ))}
                    </select>
                    <input
                        aria-label={t('hub.queue.ref')}
                        placeholder={t('hub.queue.refPlaceholder')}
                        value={queueRef}
                        onChange={(e) => setQueueRef(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                            if (need(queueRef.trim() !== '', 'hub.validation.queue')) {
                                const ref = queueRef;
                                setQueueRef('');
                                void act(() => runQueueService.enqueue(queueKind, ref.trim()));
                            }
                        }}
                    >
                        {t('hub.queue.enqueue')}
                    </Button>
                    <Button variant="primary" size="sm" disabled={busy} onClick={() => void act(() => runQueueService.drain())}>
                        {t('hub.queue.drain')}
                    </Button>
                </div>
            </section>

            <section aria-label={t('hub.toolkits.heading')}>
                <h3>{t('hub.toolkits.heading')}</h3>
                {toolkits.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('hub.empty')}</p>
                ) : (
                    <ul>
                        {toolkits.map((k) => (
                            <li key={k.id}>
                                {k.name} · {k.prefixes.join(', ')}
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <input
                        aria-label={t('hub.toolkits.name')}
                        placeholder={t('hub.toolkits.namePlaceholder')}
                        value={toolkitName}
                        onChange={(e) => setToolkitName(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 200 }}
                    />
                    <input
                        aria-label={t('hub.toolkits.prefixes')}
                        placeholder={t('hub.toolkits.prefixesPlaceholder')}
                        value={toolkitPrefixes}
                        onChange={(e) => setToolkitPrefixes(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                            if (need(toolkitName.trim() !== '', 'hub.validation.toolkit')) {
                                const n = toolkitName;
                                const p = toolkitPrefixes.split(',').map((x) => x.trim()).filter(Boolean);
                                setToolkitName('');
                                setToolkitPrefixes('');
                                void act(() => runQueueService.defineToolkit(n.trim(), p));
                            }
                        }}
                    >
                        {t('hub.toolkits.define')}
                    </Button>
                </div>
            </section>

            <section aria-label={t('hub.blocks.heading')}>
                <h3>{t('hub.blocks.heading')}</h3>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    <input
                        aria-label={t('hub.blocks.owner')}
                        placeholder={t('hub.blocks.ownerPlaceholder')}
                        value={ownerId}
                        onChange={(e) => setOwnerId(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                            if (need(ownerId.trim() !== '', 'hub.validation.owner')) {
                                const o = ownerId;
                                void act(async () => {
                                    setBlocks(await memoryBlocksService.getBlocks(o.trim()));
                                });
                            }
                        }}
                    >
                        {t('hub.blocks.load')}
                    </Button>
                </div>
                {blocks.length > 0 && (
                    <ul>
                        {blocks.map((b) => (
                            <li key={`${b.ownerId}:${b.section}`}>
                                {b.section} · {b.content.slice(0, 120)}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section aria-label={t('hub.dyad.heading')}>
                <h3>{t('hub.dyad.heading')}</h3>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                        aria-label={t('hub.dyad.topic')}
                        placeholder={t('hub.dyad.topicPlaceholder')}
                        value={dyadTopic}
                        onChange={(e) => setDyadTopic(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                            if (need(dyadTopic.trim() !== '', 'hub.validation.dyad')) {
                                const topic = dyadTopic;
                                setDyadTopic('');
                                void act(() => dyadService.startDyad({ topic: topic.trim(), maxTurns: 6 }));
                            }
                        }}
                    >
                        {t('hub.dyad.start')}
                    </Button>
                </div>
            </section>
        </div>
    );
}
