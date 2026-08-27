import type { DebateSessionSnapshot } from '../kernel/contracts/debate-runtime';
import { statusColor } from './DebateReplayTypes';

interface Props {
    sessions: DebateSessionSnapshot[];
    selectedId: string | null;
    selectSession: (id: string) => void;
}

const DebateReplaySidebar: React.FC<Props> = ({ sessions, selectedId, selectSession }) => (
    <div
        style={{
            width: 280,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            overflow: 'auto',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            paddingRight: '0.75rem',
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
                style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
                Debates ({sessions.length})
            </span>
            <span style={{ fontSize: '0.6rem', color: '#6b7280', fontFamily: 'monospace' }}>
                auto-refresh 5s
            </span>
        </div>
        {sessions.length === 0 && (
            <div
                style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                }}
            >
                No debates yet
            </div>
        )}
        {sessions.map((s) => (
            <div
                key={s.id}
                onClick={() => selectSession(s.id)}
                style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    background: selectedId === s.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                    border:
                        selectedId === s.id
                            ? '1px solid rgba(59,130,246,0.3)'
                            : '1px solid transparent',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span
                        style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#60a5fa' }}
                    >
                        {s.id.slice(-12)}
                    </span>
                    <span
                        style={{
                            fontSize: '0.6rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '3px',
                            background: `${statusColor[s.phase] || '#666'}20`,
                            color: statusColor[s.phase] || '#666',
                        }}
                    >
                        {s.phase}
                    </span>
                </div>
                <div
                    style={{
                        color: 'var(--text-primary)',
                        marginTop: '0.2rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {s.topic.slice(0, 40)}
                </div>
                <div
                    style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}
                >
                    {s.round} rounds | {s.totalTokens} tokens
                </div>
            </div>
        ))}
    </div>
);

export default DebateReplaySidebar;
