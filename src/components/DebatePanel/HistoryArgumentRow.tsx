import { getPositionIcon } from './history-constants';

interface DebateArgument {
    id: string;
    agentId: string;
    agentName?: string;
    round: number;
    position?: string;
    content: string;
    confidence: number;
    provider?: string;
    model?: string;
}

interface HistoryArgumentRowProps {
    arg: DebateArgument;
}

const HistoryArgumentRow: React.FC<HistoryArgumentRowProps> = ({ arg }) => (
    <div
        style={{
            display: 'flex',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            alignItems: 'flex-start',
        }}
    >
        <div
            style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background:
                    arg.position === 'pro'
                        ? 'rgba(59,130,246,0.15)'
                        : arg.position === 'con'
                          ? 'rgba(239,68,68,0.15)'
                          : 'rgba(148,163,184,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.65rem',
                color:
                    arg.position === 'pro'
                        ? '#3b82f6'
                        : arg.position === 'con'
                          ? '#ef4444'
                          : '#94a3b8',
            }}
        >
            {getPositionIcon(arg.position)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.2rem',
                }}
            >
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--slate-200)' }}>
                    {arg.agentName || arg.agentId}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>Round {arg.round}</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--slate-500)' }}>
                    {Math.round((arg.confidence ?? 0) * 100)}%
                </span>
                {arg.provider && (
                    <span style={{ fontSize: '0.62rem', color: 'var(--slate-600)' }}>
                        {arg.provider}/{arg.model}
                    </span>
                )}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
                {arg.content.length > 200 ? arg.content.slice(0, 200) + '...' : arg.content}
            </div>
        </div>
    </div>
);

export default HistoryArgumentRow;
