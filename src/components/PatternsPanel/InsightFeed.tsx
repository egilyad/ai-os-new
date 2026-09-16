import { Lightbulb, Zap, Shield, GitBranch } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

const INSIGHTS = [
    {
        icon: <Zap size={14} />,
        text: 'NVIDIA API: Latency in EU-West is 20% lower today.',
        time: '2m ago',
    },
    {
        icon: <Shield size={14} />,
        text: 'Safety Violation: Gemini blocked a prompt on Politics.',
        time: '15m ago',
    },
    {
        icon: <GitBranch size={14} />,
        text: 'Router: Switched 50 requests to Groq due to TPS spikes.',
        time: '1h ago',
    },
];

const BACKLOG = [
    'Implement RAG Cache partitioning',
    'Optimize WebScraper for IPv6',
    'Add token budget visualizer',
    'Self-healing fallback implementation',
];

const InsightFeed: React.FC = () => {
    const { t } = useTranslation();
    return (
        <>
            <div
                className="glass-panel"
                style={{
                    padding: '1.5rem',
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(139,92,246,0.03)',
                }}
            >
                <h4
                    style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'var(--slate-50)',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <Lightbulb size={18} color="#f59e0b" /> {t('patterns.insight_feed')}
                    <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)', fontWeight: 400 }}>
                        (example)
                    </span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {INSIGHTS.map((item) => (
                        <div
                            key={item.text}
                            style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}
                        >
                            <div style={{ color: 'var(--slate-500)', marginTop: '2px' }}>{item.icon}</div>
                            <div>
                                <div style={{ color: 'var(--slate-200)' }}>{item.text}</div>
                                <div style={{ color: 'var(--slate-600)', fontSize: '0.7rem' }}>
                                    {item.time}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div
                className="glass-panel"
                style={{
                    padding: '1.5rem',
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                    flex: 1,
                }}
            >
                <h4
                    style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'var(--slate-50)',
                        marginBottom: '1rem',
                    }}
                >
                    {t('patterns.backlog')}
                    <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)', fontWeight: 400 }}>
                        {' '}
                        (example)
                    </span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {BACKLOG.map((item) => (
                        <div
                            key={item}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontSize: '0.8rem',
                                color: 'var(--slate-400)',
                            }}
                        >
                            <div
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: 'var(--accent)',
                                }}
                            />
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default InsightFeed;
