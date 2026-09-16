import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audienceService } from '../kernel/instances';
import { usePolling } from './Common/usePolling';
import type {
    AudienceMember,
    AudienceReaction,
    AudienceReactionEvent,
    AudienceSideChatMessage,
    AudiencePoll,
} from '../kernel/contracts/audience';
import PanelLoader from './PanelLoader';

const REACTION_EMOJI: Record<AudienceReaction, string> = {
    laugh: '\uD83D\uDE06',
    applause: '\uD83D\uDC4F',
    outrage: '\uD83D\uDE21',
    cheer: '\uD83C\uDF89',
    boo: '\uD83D\uDC4E',
    silence: '\uD83E\uDD10',
};

const REACTION_COLOR: Record<AudienceReaction, string> = {
    laugh: '#fbbf24',
    applause: '#22c55e',
    outrage: '#ef4444',
    cheer: '#22c55e',
    boo: '#ef4444',
    silence: '#6b7280',
};

const SENTIMENT_COLOR = {
    positive: '#22c55e',
    negative: '#ef4444',
    neutral: '#6b7280',
    sarcastic: '#f59e0b',
};

function AudienceReactions({ events }: { events: AudienceReactionEvent[] }) {
    const recent = events.slice(-8).reverse();
    return (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            <AnimatePresence>
                {recent.map((e) => (
                    <motion.div
                        key={e.timestamp + e.sourceId}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            fontSize: '1.1rem',
                            filter: `drop-shadow(0 0 4px ${REACTION_COLOR[e.reaction]}60)`,
                        }}
                        title={e.sourceName}
                    >
                        {REACTION_EMOJI[e.reaction]}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function AudiencePollView({
    poll,
    onVote,
}: {
    poll: AudiencePoll;
    onVote: (option: string) => void;
}) {
    const total = poll.totalVotes || 1;
    return (
        <div
            style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            <div
                style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                }}
            >
                {poll.question}
                <span
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        marginLeft: '0.5rem',
                    }}
                >
                    {poll.totalVotes} votes
                </span>
            </div>
            {poll.closed ? (
                <div>
                    {poll.options.map((o) => {
                        const pct = ((poll.votes[o] || 0) / total) * 100;
                        return (
                            <div
                                key={o}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.25rem',
                                }}
                            >
                                <span
                                    style={{
                                        width: 100,
                                        fontSize: '0.7rem',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {o}
                                </span>
                                <div
                                    style={{
                                        flex: 1,
                                        height: 6,
                                        borderRadius: 3,
                                        background: 'rgba(255,255,255,0.05)',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            borderRadius: 3,
                                            width: `${pct}%`,
                                            background: o === poll.winner ? '#22c55e' : '#6b7280',
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--text-muted)',
                                        width: 30,
                                        textAlign: 'right',
                                    }}
                                >
                                    {Math.round(pct)}%
                                </span>
                            </div>
                        );
                    })}
                    {poll.winner && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                            Winner: {poll.winner}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {poll.options.map((o) => (
                        <button
                            key={o}
                            onClick={() => onVote(o)}
                            style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(59,130,246,0.2)',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                            }}
                        >
                            {o}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function AudienceSideChat({ messages }: { messages: AudienceSideChatMessage[] }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {messages
                .slice(-15)
                .reverse()
                .map((m) => (
                    <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            display: 'flex',
                            gap: '0.4rem',
                            alignItems: 'flex-start',
                            fontSize: '0.7rem',
                        }}
                    >
                        <span style={{ fontSize: '0.85rem' }}>{m.emoji}</span>
                        <div>
                            <span
                                style={{
                                    color: SENTIMENT_COLOR[m.sentiment],
                                    fontWeight: 600,
                                    marginRight: '0.3rem',
                                }}
                            >
                                {m.memberName}:
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>{m.text}</span>
                        </div>
                    </motion.div>
                ))}
        </div>
    );
}

export const AudiencePanel: React.FC = () => {
    const [members, setMembers] = useState<AudienceMember[]>([]);
    const [reactions, setReactions] = useState<AudienceReactionEvent[]>([]);
    const [messages, setMessages] = useState<AudienceSideChatMessage[]>([]);
    const [poll, setPoll] = useState<AudiencePoll | null>(null);
    const [tab, setTab] = useState<'all' | 'reactions' | 'chat' | 'poll'>('all');
    const [size, setSize] = useState(30);

    const refresh = useCallback(() => {
        const state = audienceService.getState();
        setMembers(state.members);
        setReactions(state.reactions);
        setMessages(state.recentMessages);
        setPoll(state.activePoll);
    }, []);

    useEffect(() => {
        if (members.length === 0) {
            audienceService.populate(size);
        }
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size]);

    // C-95: usePolling gates on document.hidden
    usePolling(refresh, 1500);

    const handlePopulate = () => {
        audienceService.populate(size);
        refresh();
    };

    const handleReaction = (reaction: AudienceReaction) => {
        audienceService.triggerReaction(reaction, 0.5);
        refresh();
    };

    const handleStartPoll = () => {
        const p = audienceService.startPoll('Who won this round?', [
            'Proposition',
            'Opposition',
            'Draw',
        ]);
        setPoll(p);
    };

    const handleVote = (option: string) => {
        if (!poll) return;
        setPoll({
            ...poll,
            votes: { ...poll.votes, [option]: (poll.votes[option] || 0) + 1 },
            totalVotes: poll.totalVotes + 1,
        });
    };

    const handleClosePoll = () => {
        const closed = audienceService.closePoll();
        if (closed) setPoll({ ...closed });
    };

    const avgSentiment =
        members.length > 0 ? members.reduce((s, m) => s + m.sentiment, 0) / members.length : 0;
    const avgEngagement =
        members.length > 0 ? members.reduce((s, m) => s + m.engagement, 0) / members.length : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Header stats */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.6rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.15rem',
                        }}
                    >
                        AUDIENCE
                    </div>
                    <div
                        style={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                        }}
                    >
                        {members.length}
                    </div>
                </div>
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.6rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.15rem',
                        }}
                    >
                        SENTIMENT
                    </div>
                    <div
                        style={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color:
                                avgSentiment > 0.2
                                    ? '#22c55e'
                                    : avgSentiment < -0.2
                                      ? '#ef4444'
                                      : '#fbbf24',
                        }}
                    >
                        {avgSentiment > 0 ? '+' : ''}
                        {(avgSentiment * 100).toFixed(0)}%
                    </div>
                </div>
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.6rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.15rem',
                        }}
                    >
                        ENGAGEMENT
                    </div>
                    <div
                        style={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color:
                                avgEngagement > 0.6
                                    ? '#22c55e'
                                    : avgEngagement > 0.3
                                      ? '#fbbf24'
                                      : '#ef4444',
                        }}
                    >
                        {(avgEngagement * 100).toFixed(0)}%
                    </div>
                </div>
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.6rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.15rem',
                        }}
                    >
                        REACTIONS
                    </div>
                    <AudienceReactions events={reactions} />
                </div>
            </div>

            {/* Action bar */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                        type="number"
                        min={5}
                        max={100}
                        value={size}
                        onChange={(e) => setSize(Number(e.target.value))}
                        style={{
                            width: 50,
                            padding: '0.2rem 0.3rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'var(--text-primary)',
                            fontSize: '0.7rem',
                        }}
                    />
                    <button
                        onClick={handlePopulate}
                        style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'rgba(59,130,246,0.3)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                        }}
                    >
                        Populate
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {(['laugh', 'applause', 'cheer', 'outrage', 'boo'] as AudienceReaction[]).map(
                        (r) => (
                            <button
                                key={r}
                                onClick={() => handleReaction(r)}
                                style={{
                                    padding: '0.2rem 0.4rem',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: `${REACTION_COLOR[r]}30`,
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                }}
                                title={r}
                            >
                                {REACTION_EMOJI[r]}
                            </button>
                        ),
                    )}
                </div>
                <button
                    onClick={handleStartPoll}
                    style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'rgba(139,92,246,0.3)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                    }}
                >
                    Start Poll
                </button>
                {poll && !poll.closed && (
                    <button
                        onClick={handleClosePoll}
                        style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'rgba(239,68,68,0.3)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                        }}
                    >
                        Close Poll
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    paddingBottom: '0.4rem',
                }}
            >
                {(['all', 'reactions', 'chat', 'poll'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            border: 'none',
                            background: tab === t ? 'rgba(59,130,246,0.3)' : 'transparent',
                            color: tab === t ? '#60a5fa' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: tab === t ? 600 : 400,
                        }}
                    >
                        {t.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div
                style={{
                    maxHeight: 400,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                }}
            >
                {(tab === 'all' || tab === 'reactions') && reactions.length > 0 && (
                    <div>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: 'var(--text-muted)',
                                marginBottom: '0.3rem',
                            }}
                        >
                            RECENT REACTIONS
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {reactions
                                .slice(-20)
                                .reverse()
                                .map((e, i) => (
                                    <div
                                        key={`${e.sourceName}-${e.reaction}-${i}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.2rem',
                                            padding: '0.15rem 0.4rem',
                                            borderRadius: '4px',
                                            background: 'rgba(255,255,255,0.02)',
                                            fontSize: '0.65rem',
                                        }}
                                    >
                                        <span>{REACTION_EMOJI[e.reaction]}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            {e.sourceName}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {(tab === 'all' || tab === 'poll') && poll && (
                    <AudiencePollView poll={poll} onVote={handleVote} />
                )}

                {(tab === 'all' || tab === 'chat') && (
                    <div>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: 'var(--text-muted)',
                                marginBottom: '0.3rem',
                            }}
                        >
                            SIDE CHAT
                        </div>
                        {messages.length === 0 ? (
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                    fontStyle: 'italic',
                                }}
                            >
                                No messages yet. Trigger a reaction or populate the audience.
                            </div>
                        ) : (
                            <AudienceSideChat messages={messages} />
                        )}
                    </div>
                )}

                {(tab === 'all' || tab === 'reactions') && (
                    <div>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: 'var(--text-muted)',
                                marginBottom: '0.3rem',
                            }}
                        >
                            AUDIENCE MEMBERS ({members.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                            {members.map((m) => (
                                <div
                                    key={m.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.2rem',
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '4px',
                                        background: 'rgba(255,255,255,0.02)',
                                        fontSize: '0.65rem',
                                    }}
                                >
                                    <span>{m.emoji}</span>
                                    <span
                                        style={{
                                            color: 'var(--text-secondary)',
                                            maxWidth: 80,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {m.name}
                                    </span>
                                    {m.currentReaction && (
                                        <span style={{ fontSize: '0.7rem' }}>
                                            {REACTION_EMOJI[m.currentReaction]}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function AudiencePanelWrapper() {
    return (
        <PanelLoader title={'Audience'}>
            <AudiencePanel />
        </PanelLoader>
    );
}
