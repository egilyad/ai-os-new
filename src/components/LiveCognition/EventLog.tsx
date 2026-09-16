import { Terminal } from 'lucide-react';

interface LogEntry {
    time: string;
    event: string;
    type: string;
}

interface Props {
    logs: LogEntry[];
}

const EventLog: React.FC<Props> = ({ logs }) => {
    const content =
        logs.length === 0 ? (
            <div
                style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                }}
            >
                Waiting for system events...
            </div>
        ) : (
            logs.map((log, idx) => (
                <div
                    key={`log-${log.time}-${idx}`}
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        padding: '0.6rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        border: '1px solid rgba(255,255,255,0.03)',
                    }}
                >
                    <span
                        style={{
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                        }}
                    >
                        [{log.time}]
                    </span>
                    <span
                        style={{
                            color:
                                log.type === 'warning'
                                    ? '#f59e0b'
                                    : log.type === 'success'
                                      ? '#10b981'
                                      : 'white',
                            flex: 1,
                        }}
                    >
                        {log.event}
                    </span>
                </div>
            ))
        );

    return (
        <div
            style={{
                flex: 1,
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(10px)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                }}
            >
                <h3
                    style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <Terminal size={18} color="#3b82f6" aria-hidden="true" /> Cognitive Event Stream
                </h3>
            </div>
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                }}
                role="log"
                aria-live="polite"
                aria-label="System event log"
            >
                {content}
            </div>
        </div>
    );
};

export default EventLog;
