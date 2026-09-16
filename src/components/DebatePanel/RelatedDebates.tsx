import { Link2, Loader2, Brain } from 'lucide-react';
import type { DebateSession } from '../../kernel/contracts/debate-types';
import { CONCLUSION_COLORS, getConclusionType } from './debate-memory-helpers';

interface RelatedItem {
    session: DebateSession;
    relevance: number;
}

interface Props {
    relatedDebates: RelatedItem[];
    currentTopic?: string;
    expandedId: string | null;
    sessions: DebateSession[];
    onSelectSession?: (sessionId: string) => void;
    injecting: boolean;
    handleInjectMemory: () => void;
    hasActiveSession: boolean;
}

const RelatedDebates: React.FC<Props> = ({
    relatedDebates,
    currentTopic: _currentTopic,
    expandedId,
    sessions,
    onSelectSession,
    injecting,
    handleInjectMemory,
    hasActiveSession,
}) => {
    if (relatedDebates.length === 0) return null;

    const sourceSession = expandedId ? sessions.find((s) => s.id === expandedId) : null;

    return (
        <div style={{ marginBottom: '1rem' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                }}
            >
                <Link2 size={12} /> Related to &quot;
                {(sourceSession ?? relatedDebates[0]?.session)?.topic?.slice(0, 40)}&quot;
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {relatedDebates.map((r) => (
                    <div
                        key={r.session.id}
                        onClick={() => onSelectSession?.(r.session.id)}
                        style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: 8,
                            background: 'rgba(139,92,246,0.06)',
                            border: '1px solid rgba(139,92,246,0.15)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <span
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                flexShrink: 0,
                                background:
                                    CONCLUSION_COLORS[
                                        getConclusionType(r.session.convergenceScore)
                                    ] || '#6b7280',
                            }}
                        />
                        <span
                            style={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {r.session.topic}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {Math.round(r.relevance * 100)}%
                        </span>
                    </div>
                ))}
            </div>
            {hasActiveSession && (
                <button
                    onClick={handleInjectMemory}
                    disabled={injecting}
                    style={{
                        marginTop: 6,
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(139,92,246,0.3)',
                        background: 'var(--purple-tint)',
                        color: '#a855f7',
                        cursor: injecting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        opacity: injecting ? 0.6 : 1,
                    }}
                >
                    {injecting ? <Loader2 size={12} className="spinning" /> : <Brain size={12} />}
                    {injecting ? 'Injecting...' : 'Inject Memory into Active Debate'}
                </button>
            )}
        </div>
    );
};

export default RelatedDebates;
