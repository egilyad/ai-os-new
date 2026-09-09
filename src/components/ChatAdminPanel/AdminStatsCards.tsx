import { MessageSquare, History, MessageCircle, BarChart3 } from 'lucide-react';

interface StatsCardsProps {
    totalSessions: number;
    totalMessages: number;
    totalResponses: number;
    avgMessages: string;
}

const CARDS = [
    {
        label: 'Total Sessions',
        key: 'totalSessions' as const,
        icon: MessageSquare,
        color: 'var(--accent)',
        border: 'rgba(59,130,246,0.3)',
        bg: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(0,0,0,0) 100%)',
    },
    {
        label: 'Total Prompts Executed',
        key: 'totalMessages' as const,
        icon: History,
        color: 'var(--success)',
        border: 'rgba(16,185,129,0.3)',
        bg: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(0,0,0,0) 100%)',
    },
    {
        label: 'AI Responses Generated',
        key: 'totalResponses' as const,
        icon: MessageCircle,
        color: '#a855f7',
        border: 'rgba(168,85,247,0.3)',
        bg: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(0,0,0,0) 100%)',
    },
    {
        label: 'Avg Turns / Session',
        key: 'avgMessages' as const,
        icon: BarChart3,
        color: 'var(--warning)',
        border: 'rgba(245,158,11,0.3)',
        bg: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(0,0,0,0) 100%)',
    },
];

const AdminStatsCards: React.FC<StatsCardsProps> = (stats) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
        }}
    >
        {CARDS.map((card) => {
            const Icon = card.icon;
            return (
                <div
                    key={card.label}
                    className="glass-panel"
                    style={{
                        background: card.bg,
                        padding: '1.75rem',
                        borderRadius: 20,
                        border: `2px solid ${card.border}`,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                color: 'var(--slate-400)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            {card.label}
                        </span>
                        <div
                            style={{
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 12,
                            }}
                        >
                            <Icon size={28} color={card.color} />
                        </div>
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                        {stats[card.key]}
                    </div>
                </div>
            );
        })}
    </div>
);

export default AdminStatsCards;
