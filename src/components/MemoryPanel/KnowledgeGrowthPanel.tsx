import { Calendar } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { sectionPanelTitle } from '../../styles/common';

interface KnowledgeGrowthPanelProps {
    activityMap: Record<string, number>;
    totalEntries: number;
}

const KnowledgeGrowthPanel: React.FC<KnowledgeGrowthPanelProps> = ({
    activityMap,
    totalEntries,
}) => {
    const { t } = useTranslation();

    return (
        <div
            className="glass-panel"
            style={{
                padding: '1.5rem',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.05)',
                flex: 1,
            }}
        >
            <h3 style={sectionPanelTitle}>
                <Calendar size={18} color="#f59e0b" aria-hidden="true" />{' '}
                {t('memory.knowledge_growth')}
            </h3>
            <div
                style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}
            >
                {Array.from({ length: 42 }).map((_, i) => {
                    const dayIndex = 41 - i;
                    const count = activityMap[dayIndex] || 0;
                    const activityLevel = count === 0 ? 0 : count > 5 ? 3 : count > 2 ? 2 : 1;
                    const bg =
                        activityLevel === 3
                            ? '#10b981'
                            : activityLevel === 2
                              ? 'rgba(16,185,129,0.5)'
                              : activityLevel === 1
                                ? 'rgba(16,185,129,0.2)'
                                : 'rgba(255,255,255,0.05)';
                    return (
                        <div
                            key={dayIndex}
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                background: bg,
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.02)',
                            }}
                            title={t('memory.fragments_added')
                                .replace('{0}', String(count))
                                .replace(
                                    '{1}',
                                    dayIndex === 0
                                        ? t('memory.today')
                                        : `${dayIndex} ${t('memory.days_ago')}`,
                                )}
                            aria-label={`${count} memory entries on day ${42 - i}`}
                        />
                    );
                })}
            </div>
            <div
                style={{
                    fontSize: '0.85rem',
                    color: 'var(--slate-400)',
                    lineHeight: 1.6,
                    background: 'rgba(0,0,0,0.3)',
                    padding: '1.25rem',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                {t('memory.knowledge_desc').replace('{0}', totalEntries.toLocaleString())}
            </div>
        </div>
    );
};

export default KnowledgeGrowthPanel;
