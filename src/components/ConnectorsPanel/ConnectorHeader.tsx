import { Server, Share2, Globe } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
    activeView: 'grid' | 'webhooks';
    totalCount: number;
    connectedCount: number;
    onViewChange: (view: 'grid' | 'webhooks') => void;
}

const ConnectorHeader: React.FC<Props> = ({
    activeView,
    totalCount,
    connectedCount,
    onViewChange,
}) => {
    const { t } = useTranslation();
    return (
        <div className="connector-header">
            <div className="connector-header-left">
                <h2 className="connector-heading">
                    <Server size={28} color="#3b82f6" aria-hidden="true" /> {t('connectors.title')}
                </h2>
                <p className="connector-subtitle">{t('connectors.subtitle')}</p>
            </div>
            <div className="connector-tab-bar" role="tablist" aria-label="Connector views">
                <button
                    onClick={() => onViewChange('grid')}
                    className={`connector-tab${activeView === 'grid' ? ' connector-tab--active' : ''}`}
                    role="tab"
                    aria-selected={activeView === 'grid'}
                    tabIndex={activeView === 'grid' ? 0 : -1}
                >
                    <Share2 size={16} aria-hidden="true" /> {t('connectors.tab.api')} (
                    {connectedCount}/{totalCount})
                </button>
                <button
                    onClick={() => onViewChange('webhooks')}
                    className={`connector-tab${activeView === 'webhooks' ? ' connector-tab--active' : ''}`}
                    role="tab"
                    aria-selected={activeView === 'webhooks'}
                    tabIndex={activeView === 'webhooks' ? 0 : -1}
                >
                    <Globe size={16} aria-hidden="true" /> {t('connectors.tab.webhooks')}
                </button>
            </div>
        </div>
    );
};

export default ConnectorHeader;
