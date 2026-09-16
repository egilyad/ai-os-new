import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { groupChatService } from '../../kernel/instances/services-extras';
import type { GroupChat, SpeakerSelection } from '../../kernel/contracts/rivals';
import { Button, StatusBadge } from '../../components/Common';

const SELECTIONS: SpeakerSelection[] = ['auto', 'round_robin', 'manual'];

const inputStyle: React.CSSProperties = {
    width: '100%',
    marginBottom: '0.35rem',
    background: 'var(--bg-elevated)',
    color: 'inherit',
    border: '1px solid var(--border-subtle)',
    borderRadius: 6,
    padding: '0.3rem 0.5rem',
};

export default function GroupChatPanel() {
    const { t } = useTranslation();
    const [chats, setChats] = useState<GroupChat[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [members, setMembers] = useState('');
    const [selection, setSelection] = useState<SpeakerSelection>('auto');
    const [maxRounds, setMaxRounds] = useState('6');
    const [openId, setOpenId] = useState('');

    const [speaker, setSpeaker] = useState('');
    const [postSpeaker, setPostSpeaker] = useState('');
    const [postText, setPostText] = useState('');
    const [nestTopic, setNestTopic] = useState('');
    const [summary, setSummary] = useState<string | null>(null);

    const active = chats.find((c) => c.id === activeId) ?? null;

    const fail = (e: unknown) => {
        console.error('[GroupChatPanel]', e);
        setError(t('groupChat.error.generic'));
    };

    const refresh = async (id: string) => {
        const chat = await groupChatService.get(id);
        if (chat) {
            setChats((prev) => {
                const rest = prev.filter((c) => c.id !== id);
                return [...rest, chat];
            });
        }
    };

    const handleCreate = async () => {
        setError(null);
        setNotice(null);
        const parsed = members.split(',').map((m) => m.trim()).filter(Boolean);
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
            setChats((prev) => [...prev.filter((c) => c.id !== chat.id), chat]);
            setActiveId(chat.id);
            setPostSpeaker(chat.members[0] ?? '');
            setSummary(null);
            setName('');
            setMembers('');
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
            setChats((prev) => [...prev.filter((c) => c.id !== chat.id), chat]);
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

    return (
        <div style={{ padding: '0.75rem 1rem' }}>
            <h2 style={{ margin: 0 }}>{t('groupChat.title')}</h2>
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('groupChat.subtitle')}</p>
            {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
            {notice && <p style={{ opacity: 0.8 }}>{notice}</p>}

            <section aria-label={t('groupChat.create.heading')}>
                <h3>{t('groupChat.create.heading')}</h3>
                <input
                    aria-label={t('groupChat.name')}
                    placeholder={t('groupChat.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                />
                <input
                    aria-label={t('groupChat.members')}
                    placeholder={t('groupChat.membersPlaceholder')}
                    value={members}
                    onChange={(e) => setMembers(e.target.value)}
                    style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    <select
                        aria-label={t('groupChat.selection')}
                        value={selection}
                        onChange={(e) => setSelection(e.target.value as SpeakerSelection)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    >
                        {SELECTIONS.map((s) => (
                            <option key={s} value={s}>
                                {t(`groupChat.selection.${s}`)}
                            </option>
                        ))}
                    </select>
                    <input
                        aria-label={t('groupChat.maxRounds')}
                        type="number"
                        min={1}
                        value={maxRounds}
                        onChange={(e) => setMaxRounds(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 110 }}
                    />
                </div>
                <Button variant="primary" size="sm" disabled={busy} onClick={() => void handleCreate()}>
                    {t('groupChat.create.submit')}
                </Button>
            </section>

            <section aria-label={t('groupChat.list.heading')}>
                <h3>{t('groupChat.list.heading')}</h3>
                {chats.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('groupChat.list.empty')}</p>
                ) : (
                    <ul>
                        {chats.map((c) => (
                            <li key={c.id}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveId(c.id);
                                        setPostSpeaker(c.members[0] ?? '');
                                        setSummary(null);
                                    }}
                                    style={{ fontWeight: c.id === activeId ? 700 : 400 }}
                                >
                                    {c.name}
                                </button>{' '}
                                <StatusBadge status={c.status} label={t(`groupChat.status.${c.status}`)} />
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <input
                        aria-label={t('groupChat.openById')}
                        placeholder={t('groupChat.openPlaceholder')}
                        value={openId}
                        onChange={(e) => setOpenId(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => void handleOpen()}>
                        {t('groupChat.open')}
                    </Button>
                </div>
            </section>

            {active && (
                <section aria-label={t('groupChat.chat.heading')}>
                    <h3>
                        {active.name} <StatusBadge status={active.status} label={t(`groupChat.status.${active.status}`)} />
                    </h3>
                    <p style={{ opacity: 0.7, fontSize: '0.8rem' }}>{active.members.join(', ')}</p>

                    <h4>{t('groupChat.history.heading')}</h4>
                    {active.turns.length === 0 ? (
                        <p style={{ opacity: 0.6 }}>{t('groupChat.history.empty')}</p>
                    ) : (
                        <ul>
                            {active.turns.map((turn, i) => (
                                <li key={`${turn.createdAt}-${i}`}>
                                    <strong>{turn.speaker}</strong> · {t('groupChat.round', { round: String(turn.round) })}:{' '}
                                    {turn.text}
                                </li>
                            ))}
                        </ul>
                    )}

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        <input
                            aria-label={t('groupChat.speakerOptional')}
                            placeholder={t('groupChat.speakerPlaceholder')}
                            value={speaker}
                            onChange={(e) => setSpeaker(e.target.value)}
                            style={{ ...inputStyle, marginBottom: 0, maxWidth: 180 }}
                        />
                        <Button
                            variant="primary"
                            size="sm"
                            disabled={busy || active.status !== 'running'}
                            onClick={() => void act((id) => groupChatService.nextTurn(id, speaker.trim() || undefined))}
                        >
                            {t('groupChat.nextTurn')}
                        </Button>
                        <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleSummarize()}>
                            {t('groupChat.summarize')}
                        </Button>
                    </div>
                    {summary !== null && (
                        <div>
                            <h4>{t('groupChat.summary.heading')}</h4>
                            <p>{summary}</p>
                        </div>
                    )}

                    <h4>{t('groupChat.post.heading')}</h4>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <select
                            aria-label={t('groupChat.post.speaker')}
                            value={postSpeaker}
                            onChange={(e) => setPostSpeaker(e.target.value)}
                            style={{ ...inputStyle, marginBottom: 0, maxWidth: 180 }}
                        >
                            {active.members.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                        <input
                            aria-label={t('groupChat.post.text')}
                            placeholder={t('groupChat.post.textPlaceholder')}
                            value={postText}
                            onChange={(e) => setPostText(e.target.value)}
                            style={{ ...inputStyle, marginBottom: 0 }}
                        />
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={busy || !postText.trim() || active.status !== 'running'}
                            onClick={() =>
                                void act((id) => {
                                    const text = postText;
                                    setPostText('');
                                    return groupChatService.postTurn(id, postSpeaker, text);
                                })
                            }
                        >
                            {t('groupChat.post.submit')}
                        </Button>
                    </div>

                    <h4>{t('groupChat.nest.heading')}</h4>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input
                            aria-label={t('groupChat.nest.topic')}
                            placeholder={t('groupChat.nest.topicPlaceholder')}
                            value={nestTopic}
                            onChange={(e) => setNestTopic(e.target.value)}
                            style={{ ...inputStyle, marginBottom: 0 }}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy || !nestTopic.trim() || active.status !== 'running'}
                            onClick={() =>
                                void act((id) => {
                                    const topic = nestTopic;
                                    setNestTopic('');
                                    return groupChatService.nestChat(id, topic);
                                })
                            }
                        >
                            {t('groupChat.nest.submit')}
                        </Button>
                    </div>
                </section>
            )}
        </div>
    );
}
