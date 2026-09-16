import { Search } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
    searchQuery: string;
    statusFilter: string;
    totalCount: number;
    connectedCount: number;
    onSearchChange: (q: string) => void;
    onStatusFilterChange: (f: string) => void;
}

const FILTERS = (total: number, connected: number) => [
    { label: 'All', value: 'all', count: total },
    { label: 'Connected', value: 'connected', count: connected },
    { label: 'Offline', value: 'disconnected', count: total - connected },
];

const ConnectorControls: React.FC<Props> = ({
    searchQuery,
    statusFilter,
    totalCount,
    connectedCount,
    onSearchChange,
    onStatusFilterChange,
}) => {
    const { t } = useTranslation();
    return (
        <div className="connector-controls">
            <div className="connector-search-wrapper">
                <Search size={14} className="connector-search-icon" aria-hidden="true" />
                <input
                    type="text"
                    placeholder={t('connectors.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="connector-search-input"
                    aria-label={t('common.aria.search')}
                />
            </div>
            <div
                className="connector-filter-group"
                role="group"
                aria-label={t('common.aria.filter')}
            >
                {FILTERS(totalCount, connectedCount).map((f) => (
                    <button
                        key={f.value}
                        onClick={() => onStatusFilterChange(f.value)}
                        className={`connector-filter-btn${statusFilter === f.value ? ' connector-filter-btn--active' : ''}`}
                        aria-pressed={statusFilter === f.value}
                    >
                        {f.label} ({f.count})
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ConnectorControls;
