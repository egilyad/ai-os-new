import { XCircle } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { textMutedXs, textSm } from '../../styles/common';
import type { ConsistencyReport } from '../../kernel/instances';

interface BrokenItemsSectionProps {
    items: ConsistencyReport['items'];
}

export const BrokenItemsSection: React.FC<BrokenItemsSectionProps> = ({ items }) => {
    const { t } = useTranslation();
    const broken = items.filter((i) => !i.found);
    if (broken.length === 0) return null;

    return (
        <div
            style={{
                padding: '1.5rem',
                borderRadius: 16,
                border: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.03)',
            }}
        >
            <h3
                style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#fca5a5',
                    margin: '0 0 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <XCircle size={18} color="#ef4444" /> {t('docs_health.broken')} ({broken.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {broken.map((item) => (
                    <div
                        key={item.name}
                        style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 8,
                            background: 'rgba(239,68,68,0.05)',
                            border: '1px solid rgba(239,68,68,0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.75rem',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {item.type}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--slate-100)', ...textSm }}>
                                {item.name}
                            </div>
                            <div style={textMutedXs}>{item.docFile}</div>
                        </div>
                        {item.note && (
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--warning)',
                                    fontStyle: 'italic',
                                }}
                            >
                                {item.note}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
