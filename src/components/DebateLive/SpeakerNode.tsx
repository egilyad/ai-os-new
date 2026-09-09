import { motion } from 'framer-motion';
import { useDebateLiveStore } from '../../stores/debateLiveStore';
import {
    DEBATE_EMOTION_COLORS,
    DEBATE_EMOTION_LABELS,
} from '../../kernel/contracts/debate-emotion';
import type { TopologyNode } from '../../kernel/contracts/debate-runtime';
import type { Avatar } from '../../kernel/services/agent-avatar-service';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import { CountdownRing } from './CountdownRing';
import { ThoughtBubble } from './ThoughtBubble';
import { MemoryBubble } from './MemoryBubble';

const EMOTION_ICONS: Record<string, string> = {
    joy: '😊',
    anger: '😠',
    sadness: '😢',
    surprise: '😲',
    fear: '😨',
    disgust: '😖',
    confidence: '💪',
    doubt: '🤔',
    curiosity: '🔍',
    triumph: '🏆',
    defeat: '😔',
    neutral: '😐',
};

interface Props {
    node: TopologyNode;
    avatar: Avatar;
    avatarCSS: Record<string, string>;
    isActive: boolean;
    sessionId: string;
}

export const SpeakerNode: React.FC<Props> = ({ node, avatar, avatarCSS, isActive, sessionId }) => {
    const displayName = resolveAgentIdentity(node.id).displayName;
    const key = `${sessionId}:${node.id}`;
    const streamText = useDebateLiveStore((s) => s.streamingContent.get(key));
    const thinking = useDebateLiveStore((s) => s.currentThinking.get(key));
    const emotion = useDebateLiveStore((s) => s.emotions.get(key) ?? 'neutral');
    const emotionColor = DEBATE_EMOTION_COLORS[emotion];
    const countdown = useDebateLiveStore((s) => s.agentCountdowns.get(key) ?? null);
    const memoryBubble = useDebateLiveStore((s) => s.memoryBubbles.get(key) ?? null);
    const qualityActivations = useDebateLiveStore((s) => s.agentQualityActivations.get(key) ?? 0);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                width: 120,
            }}
        >
            <div style={{ position: 'relative' }}>
                <motion.div
                    animate={
                        isActive
                            ? {
                                  boxShadow: [
                                      `0 0 20px ${emotionColor}80, 0 0 60px ${emotionColor}40`,
                                      `0 0 30px ${emotionColor}, 0 0 80px ${emotionColor}60`,
                                      `0 0 20px ${emotionColor}80, 0 0 60px ${emotionColor}40`,
                                  ],
                                  scale: [1, 1.08, 1],
                              }
                            : emotion !== 'neutral'
                              ? { boxShadow: `0 0 12px ${emotionColor}40` }
                              : undefined
                    }
                    transition={
                        isActive
                            ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                            : undefined
                    }
                    style={{
                        ...avatarCSS,
                        width: isActive ? 56 : 44,
                        height: isActive ? 56 : 44,
                        fontSize: isActive ? '1.5em' : '1.2em',
                        transition: 'width 0.3s, height 0.3s, font-size 0.3s',
                        cursor: 'default',
                        position: 'relative',
                    }}
                >
                    {avatar.emoji}
                </motion.div>

                {countdown && (
                    <CountdownRing
                        secondsTotal={countdown.secondsTotal}
                        secondsLeft={countdown.secondsLeft}
                        isActive={isActive}
                    />
                )}

                {thinking && (
                    <ThoughtBubble
                        draftPreview={displayName + ' is formulating...'}
                        progress={countdown ? countdown.secondsLeft / countdown.secondsTotal : 0.5}
                    />
                )}
            </div>

            {emotion !== 'neutral' && (
                <div
                    style={{
                        fontSize: '0.75rem',
                        lineHeight: 1,
                        color: emotionColor,
                        marginTop: -2,
                    }}
                    title={DEBATE_EMOTION_LABELS[emotion]}
                >
                    {EMOTION_ICONS[emotion] ?? '😐'}
                </div>
            )}

            {qualityActivations > 0 && (
                <div
                    style={{
                        fontSize: '0.55rem',
                        fontWeight: 700,
                        color: 'var(--success)',
                        background: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: 4,
                        padding: '1px 5px',
                        lineHeight: '1.2',
                    }}
                    title={`${qualityActivations} quality technique activations`}
                >
                    ✦{qualityActivations}
                </div>
            )}

            <div
                style={{
                    fontSize: '0.7rem',
                    color: isActive ? '#e2e8f0' : '#64748b',
                    fontWeight: isActive ? 700 : 400,
                    textAlign: 'center',
                    maxWidth: 110,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.3s, font-weight 0.3s',
                }}
            >
                {displayName}
            </div>

            <div style={{ fontSize: '0.6rem', color: 'var(--slate-600)', textTransform: 'capitalize' }}>
                {node.role}
            </div>

            {memoryBubble && (
                <MemoryBubble
                    debateLabel={memoryBubble.debateLabel}
                    similarity={memoryBubble.similarity}
                    relation={memoryBubble.relation}
                />
            )}

            {(streamText || thinking) && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        fontSize: '0.6rem',
                        color: isActive ? emotionColor : '#64748b',
                        maxWidth: 110,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: 2,
                    }}
                    aria-live="polite"
                    role="status"
                >
                    {streamText
                        ? streamText
                        : isActive
                          ? 'speaking...'
                          : thinking
                            ? 'thinking...'
                            : ''}
                </motion.div>
            )}
        </div>
    );
};
