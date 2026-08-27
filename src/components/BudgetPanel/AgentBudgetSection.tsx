import { Users } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { fmtUSD, usageColor } from './budget-utils';

interface AgentBudgetSectionProps {
    agents: Array<{ agentId: string; name?: string; budget: number; spent: number; pct: number }>;
    lang: string;
}

export const AgentBudgetSection: React.FC<AgentBudgetSectionProps> = ({ agents, lang }) => {
    const { t } = useTranslation();
    if (agents.length === 0) return null;
    return (
        <div
            style={{
                padding: '1.5rem',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.15)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <Users size={18} color="#3b82f6" />
                <span style={{ fontWeight: 700, color: 'var(--slate-200)', fontSize: '1rem' }}>
                    {t('budget.agents_section')}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {agents.map((a) => (
                    <div
                        key={a.agentId}
                        style={{
                            padding: '0.6rem',
                            borderRadius: 6,
                            background: 'rgba(0,0,0,0.1)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.8rem',
                            }}
                        >
                            <span style={{ color: 'var(--slate-200)' }}>{a.name || a.agentId}</span>
                            <span style={{ color: 'var(--slate-400)' }}>
                                {fmtUSD(a.spent, lang)} / {fmtUSD(a.budget, lang)}
                            </span>
                        </div>
                        <div
                            style={{
                                height: 4,
                                borderRadius: 2,
                                background: 'rgba(255,255,255,0.05)',
                                marginTop: '0.3rem',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    borderRadius: 2,
                                    width: `${Math.min(a.pct, 100)}%`,
                                    background: usageColor(a.pct),
                                    transition: 'width 0.5s ease',
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
