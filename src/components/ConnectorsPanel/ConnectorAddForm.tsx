import { X } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
    newName: string;
    newType: string;
    onNameChange: (v: string) => void;
    onTypeChange: (v: string) => void;
    onAdd: () => void;
    onClose: () => void;
}

const ConnectorAddForm: React.FC<Props> = ({
    newName,
    newType,
    onNameChange,
    onTypeChange,
    onAdd,
    onClose,
}) => {
    const { t } = useTranslation();
    return (
        <div className="connector-form-card">
            <div className="connector-form-header">
                <span className="connector-form-title">{t('connectors.form_title')}</span>
                <button
                    onClick={onClose}
                    className="btn-secondary"
                    style={{ padding: '0.4rem', borderRadius: 8 }}
                    aria-label={t('connectors.close_form_aria')}
                >
                    <X size={16} aria-hidden="true" />
                </button>
            </div>
            <input
                placeholder={t('connectors.name_placeholder')}
                value={newName}
                onChange={(e) => onNameChange(e.target.value)}
                className="connector-input"
                aria-label="API endpoint name"
            />
            <input
                placeholder={t('connectors.category_placeholder')}
                value={newType}
                onChange={(e) => onTypeChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                className="connector-input"
                aria-label="Connector category"
            />
            <button
                onClick={onAdd}
                className="btn-primary"
                style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: 10,
                    marginTop: '0.5rem',
                    fontWeight: 800,
                    background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                }}
            >
                {t('connectors.deploy')}
            </button>
        </div>
    );
};

export default ConnectorAddForm;
