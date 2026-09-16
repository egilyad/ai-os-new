import { Play, Pause, Square, Loader2 } from 'lucide-react';
import type { DebateSessionSnapshot } from '../../kernel/instances';
import { PHASE_COLORS } from './debate-runtime-constants';
import { flexGap2 } from '../../styles/common';
import { Button } from '../Common';

interface SessionDetailHeaderProps {
    selected: DebateSessionSnapshot;
    linkedChatIds: string[];
    actionLoading: string | null;
    onPause: () => void;
    onStart: () => void;
    onCancel: () => void;
    onChatNavigate: (chatId: string) => void;
    t: (key: string) => string;
}

const SessionDetailHeader: React.FC<SessionDetailHeaderProps> = ({
    selected,
    linkedChatIds,
    actionLoading,
    onPause,
    onStart,
    onCancel,
    onChatNavigate,
    t,
}) => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
        }}
    >
        <h3
            style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--slate-200)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}
        >
            {selected.topic}
            <span
                style={{
                    marginLeft: 8,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 4,
                    background: `${PHASE_COLORS[selected.phase]}20`,
                    color: PHASE_COLORS[selected.phase],
                }}
            >
                {selected.phase}
            </span>
            {linkedChatIds.map((linkedId) => (
                <button
                    key={linkedId}
                    onClick={(e) => {
                        e.stopPropagation();
                        onChatNavigate(linkedId);
                    }}
                    style={{
                        fontSize: '0.65rem',
                        padding: '2px 8px',
                        borderRadius: 8,
                        background: 'rgba(16,185,129,0.2)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        color: '#34d399',
                        cursor: 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                    }}
                    title="Open linked chat"
                >
                    💬 Chat
                </button>
            ))}
        </h3>
        <div style={flexGap2}>
            {(selected.phase === 'active' || selected.phase === 'deliberating') && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPause}
                    style={{
                        background: 'rgba(245,158,11,0.2)',
                        color: 'var(--warning)',
                    }}
                >
                    <Pause size={14} /> {t('debate_runtime.pause')}
                </Button>
            )}
            {selected.phase === 'created' && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onStart}
                    disabled={actionLoading === selected.id}
                    style={{
                        cursor: actionLoading === selected.id ? 'not-allowed' : 'pointer',
                        background:
                            actionLoading === selected.id
                                ? 'rgba(34,197,94,0.3)'
                                : 'rgba(34,197,94,0.2)',
                        color: 'var(--success)',
                    }}
                >
                    {actionLoading === selected.id ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Play size={14} />
                    )}{' '}
                    {t('debate_runtime.start')}
                </Button>
            )}
            {['active', 'deliberating', 'paused'].includes(selected.phase) && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    style={{
                        background: 'rgba(239,68,68,0.2)',
                        color: 'var(--error)',
                    }}
                >
                    <Square size={14} /> {t('debate_runtime.cancel')}
                </Button>
            )}
        </div>
    </div>
);

export default SessionDetailHeader;
