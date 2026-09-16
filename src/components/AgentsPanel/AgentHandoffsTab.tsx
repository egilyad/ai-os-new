import { taskHandoffService } from '../../kernel/instances';
import type { AgentDetailPanelProps } from './AgentDetailPanelProps';

type Props = Pick<AgentDetailPanelProps, 'agent'>;

const AgentHandoffsTab: React.FC<Props> = ({ agent }) => {
    const handoffs = taskHandoffService.getHandoffs(agent.id);
    if (handoffs.length === 0) {
        return (
            <div style={{ color: 'var(--slate-500)', padding: '2rem', textAlign: 'center' }}>
                No handoffs for this agent.
            </div>
        );
    }
    return (
        <div
            style={{
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
            }}
        >
            {handoffs.map((h) => (
                <div
                    key={h.id}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.4rem',
                        }}
                    >
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {h.description}
                        </span>
                        <span
                            style={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                color:
                                    h.status === 'completed'
                                        ? '#10b981'
                                        : h.status === 'failed'
                                          ? '#ef4444'
                                          : '#f59e0b',
                            }}
                        >
                            {h.status}
                        </span>
                    </div>
                    <div
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--slate-500)',
                            display: 'flex',
                            gap: '1rem',
                        }}
                    >
                        <span>From: {h.fromAgent}</span>
                        <span>To: {h.toAgent}</span>
                        <span>Priority: {h.priority}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AgentHandoffsTab;
