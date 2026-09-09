import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerStatus } from './DebateReplayTypes';
import type { TimelineEntry } from '../kernel/contracts/debate-runtime';

interface Props {
    currentEvent: TimelineEntry | null;
    replayStatus: PlayerStatus;
}

const DebateReplayEventDetail: React.FC<Props> = ({ currentEvent, replayStatus }) => (
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
                            maxHeight: 120,
                            overflow: 'auto',
                        }}
                    >
                        {(currentEvent.payload as { content?: string })?.content?.slice(0, 500) ??
                            JSON.stringify(currentEvent.payload).slice(0, 300)}
                    </div>
                </motion.div>
            )}
    </AnimatePresence>
);

export default DebateReplayEventDetail;
