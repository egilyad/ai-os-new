import { motion } from 'framer-motion';

interface TimelineItem {
    round: number;
    agentId: string;
    content: string;
    type: string;
    index: number;
    ts: string;
}

interface Props {
    visibleEvents: TimelineItem[];
    currentIndex: number;
    eventsEndRef: React.RefObject<HTMLDivElement | null>;
}

const DebateReplayTimeline: React.FC<Props> = ({ visibleEvents, currentIndex, eventsEndRef }) => (
    <div
        style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
        }}
    >
        {visibleEvents.length === 0 ? (
            <div
                style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                }}
            >
                No events yet. Press Play or Step Forward to begin.
            </div>
        ) : (
            visibleEvents.map((e, i) => (
                <motion.div
                    key={`${e.index}-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.5) }}
                >
                    {e.type === 'marker' ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.2rem 0',
                            }}
                        >
                            <div
                                style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }}
                            />
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--text-muted)',
                                    padding: '0.1rem 0.5rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '4px',
                                }}
                            >
                                {e.content}
                            </span>
                            <div
                                style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }}
                            />
                        </div>
                    ) : e.type === 'error' ? (
                        <div
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                background: 'rgba(239,68,68,0.05)',
                                border: '1px solid rgba(239,68,68,0.12)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    color: 'var(--error)',
                                    marginBottom: '0.2rem',
                                }}
                            >
                                {e.agentId}
                            </div>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    color: '#fca5a5',
                                    lineHeight: 1.4,
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                {e.content}
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                background:
                                    e.index === currentIndex
                                        ? 'rgba(59,130,246,0.06)'
                                        : 'rgba(255,255,255,0.015)',
                                border:
                                    e.index === currentIndex
                                        ? '1px solid rgba(59,130,246,0.2)'
                                        : '1px solid transparent',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.2rem',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        color: '#60a5fa',
                                    }}
                                >
                                    {e.agentId}
                                </span>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                    #{e.index + 1} · {e.ts}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-primary)',
                                    lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                {e.content.slice(0, 600)}
                            </div>
                        </div>
                    )}
                </motion.div>
            ))
        )}
        <div ref={eventsEndRef} />
    </div>
);

export default DebateReplayTimeline;
