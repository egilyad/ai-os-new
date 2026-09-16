import { useTranslation } from '../../i18n/useTranslation';

interface CollectionTabsProps {
    activeCollection: 'long_term' | 'ephemeral' | 'rag_sources';
    onChange: (id: 'long_term' | 'ephemeral' | 'rag_sources') => void;
}

const TABS: Array<{ id: CollectionTabsProps['activeCollection']; labelKey: string }> = [
    { id: 'long_term', labelKey: 'memory.tab.long_term' },
    { id: 'ephemeral', labelKey: 'memory.tab.ephemeral' },
    { id: 'rag_sources', labelKey: 'memory.tab.rag' },
];

const CollectionTabs: React.FC<CollectionTabsProps> = ({ activeCollection, onChange }) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: 'flex',
                gap: '0.5rem',
                background: 'rgba(0,0,0,0.3)',
                padding: '0.3rem',
                borderRadius: 12,
                width: 'fit-content',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
            role="tablist"
            aria-label={t('memory.title')}
        >
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    role="tab"
                    aria-selected={activeCollection === tab.id}
                    style={{
                        padding: '0.6rem 1.25rem',
                        borderRadius: 10,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background:
                            activeCollection === tab.id ? 'rgba(16,185,129,0.15)' : 'transparent',
                        color: activeCollection === tab.id ? '#10b981' : '#64748b',
                    }}
                >
                    {t(tab.labelKey)}
                </button>
            ))}
        </div>
    );
};

export default CollectionTabs;
