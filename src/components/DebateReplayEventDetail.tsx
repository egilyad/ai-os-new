import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerStatus } from './DebateReplayTypes';
import type { TimelineEntry } from '../kernel/contracts/debate-runtime';

interface Props {
    currentEvent: TimelineEntry | null;
    replayStatus: PlayerStatus;
}

const DebateReplayEventDetail: React.FC<Props> = ({ currentEvent, replayStatus }) => {
    const [expanded, setExpanded] = useState(false);
    const rawContent =
        (currentEvent?.payload as { content?: string })?.content ??
        (currentEvent ? JSON.stringify(currentEvent.payload, null, 2) : '');
    const limit = (currentEvent?.payload as { content?: string })?.content ? 500 : 300;
    const needsTruncate = rawContent.length > limit;
    const display = expanded ? rawContent : rawContent.slice(0, limit);
    return (
        <AnimatePresence>
            {currentEvent &&
                replayStatus !== 'playing' &&
                currentEvent.type !== 'round:start' &&
                currentEvent.type !== 'round:end' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(96,165,250,0.05)',
                            borderRadius: '8px',
                            border: '1px solid rgba(96,165,250,0.15)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: '#60a5fa',
                                fontWeight: 600,
                                marginBottom: '0.3rem',
                            }}
                        >
                            Current: {currentEvent.type}
                            {currentEvent.type === 'agent:responded' &&
                                (currentEvent.payload as { agentId?: string })?.agentId &&
                                ` — ${(currentEvent.payload as { agentId: string }).agentId}`}
                        </div>
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-primary)',
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: expanded ? 400 : 120,
                                overflow: 'auto',
                            }}
                        >
                            {display}
                            {needsTruncate && !expanded ? '...' : ''}
                        </div>
                        {needsTruncate && (
                            <button
                                onClick={() => setExpanded((v) => !v)}
                                style={{
                                    marginTop: 6,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    border: '1px solid rgba(96,165,250,0.3)',
                                    background: 'rgba(96,165,250,0.08)',
                                    color: '#60a5fa',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {expanded ? 'свернуть' : `развернуть (${rawContent.length} симв.)`}
                            </button>
                        )}
                    </motion.div>
                )}
        </AnimatePresence>
    );
};

export default DebateReplayEventDetail;
