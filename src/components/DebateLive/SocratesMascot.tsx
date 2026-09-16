import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '../../kernel/instances';
import { EVENTS } from '../../kernel/events/event-names';

type SocratesEmotion =
    | 'observing'
    | 'approving'
    | 'questioning'
    | 'illuminated'
    | 'satisfied'
    | 'concerned'
    | 'entertained'
    | 'bored';

const SOCRATES_ICONS: Record<SocratesEmotion, string> = {
    observing: '🧐',
    approving: '🎓',
    questioning: '🤔',
    illuminated: '💡',
    satisfied: '🤝',
    concerned: '⚠️',
    entertained: '🎭',
    bored: '😴',
};

const SPEECH_BUBBLES: Record<SocratesEmotion, string[]> = {
    observing: ['I am listening...', 'The dialectic unfolds.', 'Speak, so I may see you.'],
    approving: ['Excellent dialectic!', 'Well argued!', 'A most reasonable point.'],
    questioning: [
        'But define your terms...',
        'Is that true by observation?',
        'What follows from that premise?',
    ],
    illuminated: ['A novel thought — rare and precious!', 'I see!', 'The light of reason!'],
    satisfied: [
        'The dialectic has done its work.',
        'We have reached understanding.',
        'Truth emerges from discourse.',
    ],
    concerned: ['Beware the fallacy!', 'That is not logical.', 'Consider the counterexample...'],
    entertained: ['Most amusing!', 'Wit and wisdom together!', 'A clever turn of phrase.'],
    bored: ['...', 'I await greater challenges.', 'The silence grows long.'],
};

function pickQuote(emotion: SocratesEmotion): string {
    const quotes = SPEECH_BUBBLES[emotion]!;
    return quotes[Math.floor(Math.random() * quotes.length)]!;
}

interface Props {
    hidden?: boolean;
}

export const SocratesMascot: React.FC<Props> = ({ hidden }) => {
    const [emotion, setEmotion] = useState<SocratesEmotion>('observing');
    const [speechBubble, setSpeechBubble] = useState<string | null>(null);
    const [bubbleKey, setBubbleKey] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const showQuote = useCallback((newEmotion: SocratesEmotion) => {
        setEmotion(newEmotion);
        setSpeechBubble(pickQuote(newEmotion));
        setBubbleKey((k) => k + 1);
    }, []);

    useEffect(() => {
        const subs = [
            eventBus.onSafe<{ agentId: string; content: string }>(
                EVENTS.DEBATE_AGENT_RESPONDED,
                () => {
                    if (emotion !== 'bored') showQuote('approving');
                },
            ),
            eventBus.onSafe<{ agentId: string; error: string }>(EVENTS.DEBATE_AGENT_ERROR, () =>
                showQuote('concerned'),
            ),
            eventBus.onSafe<{ sessionId: string; type: string }>(EVENTS.DEBATE_UPDATED, (d) => {
                if (d.type === 'consensus_reached') showQuote('satisfied');
            }),
        ];

        const idleTimer = setInterval(() => {
            if (Math.random() > 0.7) {
                showQuote('observing');
            }
        }, 15000);

        const boredomTimer = setTimeout(() => {
            showQuote('bored');
        }, 120000);

        return () => {
            subs.forEach((u) => u());
            clearInterval(idleTimer);
            clearTimeout(boredomTimer);
        };
    }, [emotion, showQuote]);

    const handleClick = useCallback(() => {
        const r = Math.random();
        if (r < 0.4) showQuote('illuminated');
        else if (r < 0.7) showQuote('entertained');
        else showQuote('questioning');
    }, [showQuote]);

    if (hidden) return null;

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 20,
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
            }}
            onClick={handleClick}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            title="Click Socrates!"
        >
            <AnimatePresence mode="wait">
                {speechBubble && (
                    <motion.div
                        key={bubbleKey}
                        initial={{ opacity: 0, scale: 0.8, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            background: 'rgba(30,27,75,0.9)',
                            color: 'var(--warning)',
                            padding: '8px 14px',
                            borderRadius: 12,
                            fontSize: '0.7rem',
                            maxWidth: 200,
                            marginBottom: 6,
                            border: '1px solid rgba(251,191,36,0.3)',
                            lineHeight: 1.3,
                            textAlign: 'center',
                        }}
                    >
                        {speechBubble}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: -6,
                                right: 20,
                                width: 0,
                                height: 0,
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '6px solid rgba(30,27,75,0.9)',
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                animate={
                    emotion === 'bored'
                        ? { opacity: [1, 0.6, 1], scale: [1, 0.95, 1] }
                        : emotion === 'illuminated'
                          ? { scale: [1, 1.15, 1] }
                          : emotion === 'concerned'
                            ? { rotate: [0, -5, 5, -3, 0] }
                            : emotion === 'entertained'
                              ? { rotate: [0, -8, 8, 0] }
                              : {}
                }
                transition={{ duration: 0.5 }}
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    boxShadow:
                        emotion === 'illuminated'
                            ? '0 0 20px rgba(139,92,246,0.6)'
                            : '0 0 10px rgba(139,92,246,0.3)',
                    transition: 'box-shadow 0.3s',
                }}
            >
                {SOCRATES_ICONS[emotion]}
            </motion.div>
        </div>
    );
};
