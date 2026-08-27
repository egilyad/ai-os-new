import { Plus, Globe } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
    onGenerateUrl: () => void;
}

const ConnectorWebhooksView: React.FC<Props> = ({ onGenerateUrl }) => {
    const { t } = useTranslation();
    return (
        <div className="glass-panel connector-webhooks-panel" role="tabpanel">
            <div className="connector-webhooks-header">
                <div>
                    <h3 className="connector-webhooks-title">{t('connectors.webhooks_heading')}</h3>
                    <p className="connector-webhooks-subtitle">
                        Allow external systems to push asynchronous events directly into the OS
                        EventBus.
                    </p>
                </div>
                <button
                    className="btn-primary"
                    onClick={onGenerateUrl}
                    style={{
                        padding: '0.85rem 1.5rem',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 800,
                        background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                        boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                    }}
                >
                    <Plus size={18} aria-hidden="true" /> Generate URL
                </button>
            </div>
            <div className="connector-table-wrapper">
                <table className="connector-table">
                    <thead>
                        <tr>
                            <th>Endpoint Name</th>
                            <th>Route (URL)</th>
                            <th>Target Agent</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={4} className="connector-empty">
                                <div className="connector-empty-content">
                                    <Globe
                                        size={48}
                                        className="connector-empty-icon"
                                        aria-hidden="true"
                                    />
                                    <div className="connector-empty-label">
                                        {t('connectors.webhooks_empty')}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ConnectorWebhooksView;
