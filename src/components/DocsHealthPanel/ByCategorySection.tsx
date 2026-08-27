import { useTranslation } from '../../i18n/useTranslation';
import type { ConsistencyReport } from '../../kernel/instances';

interface ByCategorySectionProps {
    report: ConsistencyReport;
}

export const ByCategorySection: React.FC<ByCategorySectionProps> = ({ report }) => {
    const { t } = useTranslation();
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div
                style={{
                    padding: '1.5rem',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)',
                }}
            >
                <h3
                    style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--slate-100)',
                        margin: '0 0 1rem',
                    }}
                >
                    {t('docs_health.by_category')}
                </h3>
                {Object.entries(report.byCategory).map(([cat, stats]) => (
                    <div
                        key={cat}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.4rem 0',
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '0.85rem',
                                color: 'var(--slate-200)',
                                textTransform: 'capitalize',
                            }}
                        >
                            {cat}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                                {stats.passed}/{stats.total}
                            </span>
                            {stats.failed > 0 && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>
                                    -{stats.failed}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div
                style={{
                    padding: '1.5rem',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)',
                }}
            >
                <h3
                    style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--slate-100)',
                        margin: '0 0 1rem',
                    }}
                >
                    {t('docs_health.summary')}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', lineHeight: 1.6 }}>
                    {report.summary}
                </div>
            </div>
        </div>
    );
};
