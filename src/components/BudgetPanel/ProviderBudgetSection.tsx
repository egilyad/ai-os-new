import { Shield } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { fmtUSD, usageColor } from './budget-utils';

interface ProviderBudgetSectionProps {
    providers: Array<{
        provider: string;
        budget: number;
        spent: number;
        remaining: number;
        pct: number;
    }>;
    lang: string;
}

export const ProviderBudgetSection: React.FC<ProviderBudgetSectionProps> = ({
    providers,
    lang,
}) => {
    const { t } = useTranslation();
    if (providers.length === 0) return null;
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
                <Shield size={18} color="#a855f7" />
                <span style={{ fontWeight: 700, color: 'var(--slate-200)', fontSize: '1rem' }}>
                    {t('budget.providers_section')}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {providers.map((p) => (
                    <div
                        key={p.provider}
                        style={{
                            padding: '0.75rem',
                            borderRadius: 8,
                            background: 'rgba(0,0,0,0.15)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '0.25rem',
                            }}
                        >
                            <span
                                style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--slate-200)' }}
                            >
                                {p.provider}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                                {fmtUSD(p.spent, lang)} / {fmtUSD(p.budget, lang)}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.7rem',
                                color: 'var(--slate-500)',
                                marginBottom: '0.2rem',
                            }}
                        >
                            <span>
                                {t('budget.remaining')}: {fmtUSD(p.remaining, lang)}
                            </span>
                            <span>{p.pct.toFixed(1)}%</span>
                        </div>
                        <div
                            style={{
                                height: 6,
                                borderRadius: 3,
                                background: 'rgba(255,255,255,0.05)',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    borderRadius: 3,
                                    width: `${Math.min(p.pct, 100)}%`,
                                    background: usageColor(p.pct),
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
