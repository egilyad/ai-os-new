import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { BudgetAlert } from '../../kernel/contracts/budget';

interface AlertsSectionProps {
    alerts: BudgetAlert[];
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({ alerts }) => {
    const { t } = useTranslation();
    if (alerts.length === 0) return null;
    return (
        <div
            style={{
                padding: '1.5rem',
                borderRadius: 16,
                border: '1px solid rgba(239,68,68,0.15)',
                background: 'rgba(239,68,68,0.03)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                <AlertTriangle size={18} color="#ef4444" />
                <span style={{ fontWeight: 700, color: '#fca5a5', fontSize: '1rem' }}>
                    {t('budget.alerts_section')} ({alerts.length})
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {alerts.slice(0, 20).map((alert) => (
                    <div
                        key={alert.message}
                        style={{
                            fontSize: '0.8rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 6,
                            background: 'rgba(239,68,68,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <span
                                style={{
                                    padding: '0.1rem 0.3rem',
                                    borderRadius: 3,
                                    fontSize: '0.65rem',
                                    background: 'rgba(239,68,68,0.15)',
                                    color: 'var(--error)',
                                    marginRight: 6,
                                }}
                            >
                                {alert.type}
                            </span>
                            <span style={{ color: 'var(--slate-200)' }}>{alert.message}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                            {alert.current.toFixed(2)}/{alert.limit.toFixed(2)} ({alert.level}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
