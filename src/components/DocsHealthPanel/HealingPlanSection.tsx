import { Wrench } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { textSecondaryXs } from '../../styles/common';
import type { HealingPlan } from '../../kernel/instances';

interface HealingPlanSectionProps {
    plan: HealingPlan;
}

export const HealingPlanSection: React.FC<HealingPlanSectionProps> = ({ plan }) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                padding: '1.5rem',
                borderRadius: 16,
                border: '1px solid rgba(245,158,11,0.2)',
                background: 'rgba(245,158,11,0.03)',
            }}
        >
            <h3
                style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--warning)',
                    margin: '0 0 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <Wrench size={18} /> {t('docs_health.healing_plan')}
            </h3>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginBottom: '1rem',
                }}
            >
                <div>
                    <div style={textSecondaryXs}>{t('docs_health.total_tasks')}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {plan.totalTasks}
                    </div>
                </div>
                <div>
                    <div style={textSecondaryXs}>{t('docs_health.completed_tasks')}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                        {plan.completedTasks}
                    </div>
                </div>
                <div>
                    <div style={textSecondaryXs}>{t('docs_health.failed_tasks')}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--error)' }}>
                        {plan.failedTasks}
                    </div>
                </div>
            </div>
            {plan.tasks.map((task) => (
                <div
                    key={task.id}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        marginBottom: '0.5rem',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-100)' }}>
                            {task.docFile}
                        </div>
                        <span
                            style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: 999,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                background:
                                    task.status === 'completed'
                                        ? 'rgba(16,185,129,0.15)'
                                        : task.status === 'failed'
                                          ? 'rgba(239,68,68,0.15)'
                                          : 'rgba(245,158,11,0.15)',
                                color:
                                    task.status === 'completed'
                                        ? '#10b981'
                                        : task.status === 'failed'
                                          ? '#ef4444'
                                          : '#f59e0b',
                            }}
                        >
                            {task.status}
                        </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                        {task.failedItems.length} {t('docs_health.broken')} —{' '}
                        {task.suggestedFixes.length} {t('docs_health.fixes')}
                    </div>
                </div>
            ))}
        </div>
    );
};
