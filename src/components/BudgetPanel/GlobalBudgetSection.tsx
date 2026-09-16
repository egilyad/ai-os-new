import { TrendingUp } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { fmtUSD, usageColor } from './budget-utils';
import { StatCard } from './StatCard';

interface GlobalBudgetSectionProps {
    budget: number;
    spent: number;
    remaining: number;
    pct: number;
    lang: string;
}

export const GlobalBudgetSection: React.FC<GlobalBudgetSectionProps> = ({
    budget,
    spent,
    remaining,
    pct,
    lang,
}) => {
    const { t } = useTranslation();
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
                <TrendingUp size={18} color="#10b981" />
                <span style={{ fontWeight: 700, color: 'var(--slate-200)', fontSize: '1rem' }}>
                    {t('budget.global_section')}
                </span>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem',
                }}
            >
                <StatCard label={t('budget.budget')} value={fmtUSD(budget, lang)} color="#10b981" />
                <StatCard label={t('budget.spent')} value={fmtUSD(spent, lang)} color="#f59e0b" />
                <StatCard
                    label={t('budget.remaining')}
                    value={fmtUSD(remaining, lang)}
                    color={remaining > 0 ? '#3b82f6' : '#ef4444'}
                />
            </div>
            <div style={{ marginTop: '0.5rem' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--slate-400)',
                        marginBottom: '0.25rem',
                    }}
                >
                    <span>{t('budget.usage')}</span>
                    <span>{pct.toFixed(1)}%</span>
                </div>
                <div
                    style={{
                        height: 8,
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.05)',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            borderRadius: 4,
                            width: `${Math.min(pct, 100)}%`,
                            background: usageColor(pct),
                            transition: 'width 0.5s ease',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
