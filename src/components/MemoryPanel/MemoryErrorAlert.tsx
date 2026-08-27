import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface MemoryErrorAlertProps {
    error: string | null;
    onDismiss: () => void;
}

const MemoryErrorAlert: React.FC<MemoryErrorAlertProps> = ({ error, onDismiss }) => {
    const { t } = useTranslation();
    if (!error) return null;
    return (
        <div
            role="alert"
            aria-live="assertive"
            style={{
                padding: '0.5rem 1rem',
                background: 'var(--error-tint)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10,
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}
        >
            <AlertTriangle size={14} aria-hidden="true" /> {error}
            <button
                onClick={onDismiss}
                style={{
                    cursor: 'pointer',
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                }}
                aria-label={t('common.dismiss_error')}
            >
                <X size={14} aria-hidden="true" />
            </button>
        </div>
    );
};

export default MemoryErrorAlert;
