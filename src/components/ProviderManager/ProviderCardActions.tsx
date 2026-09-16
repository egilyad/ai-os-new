import {
    PowerOff,
    Power,
    Loader2,
    Activity,
    RefreshCw,
    Terminal,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface ProviderCardActionsProps {
    status: string;
    probeLoading: boolean;
    isChecking: boolean;
    onToggleStatus: () => void;
    onProbe: (e: React.MouseEvent) => void;
    onCheckHealth: () => void;
    onSandbox: () => void;
    onRemove: () => void;
    confirmRemove: boolean;
    onConfirmRemove: () => void;
    onCancelRemove: () => void;
}

export const ProviderCardActions: React.FC<ProviderCardActionsProps> = ({
    status,
    probeLoading,
    isChecking,
    onToggleStatus,
    onProbe,
    onCheckHealth,
    onSandbox,
    onRemove,
    confirmRemove,
    onConfirmRemove,
    onCancelRemove: _onCancelRemove,
}) => {
    const { t } = useTranslation();

    return (
        <div className="provider-action-group" style={{ marginLeft: 'auto' }}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus();
                }}
                className={`provider-action-btn ${status === 'active' ? 'provider-action-btn--active' : 'provider-action-btn--inactive'}`}
                title={status === 'active' ? t('provider.disable') : t('provider.enable')}
            >
                {status === 'active' ? <PowerOff size={14} /> : <Power size={14} />}
            </button>
            <button
                onClick={onProbe}
                className="provider-action-btn"
                disabled={probeLoading}
                title={t('provider.tooltip_probe')}
            >
                {probeLoading ? (
                    <Loader2 size={14} className="provider-spin" />
                ) : (
                    <Activity size={14} color="#a855f7" />
                )}
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isChecking) onCheckHealth();
                }}
                className={`provider-action-btn${isChecking ? ' provider-action-btn--checking' : ''}`}
                disabled={isChecking}
                title={isChecking ? t('provider.checking_health') : t('provider.check_health')}
            >
                <RefreshCw size={14} className={isChecking ? 'provider-spin' : ''} />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onSandbox();
                }}
                className="provider-action-btn provider-action-btn--sandbox"
                title={t('provider.tooltip_open_sandbox')}
            >
                <Terminal size={14} />
            </button>
            {confirmRemove ? (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onConfirmRemove();
                    }}
                    className="provider-action-btn provider-action-btn--danger"
                    title={t('provider.tooltip_confirm_remove')}
                >
                    <AlertTriangle size={14} />
                </button>
            ) : (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="provider-action-btn provider-action-btn--remove"
                    title={t('provider.tooltip_remove')}
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
};

export const ConfirmRemoveBanner: React.FC<{ onCancel: () => void; onConfirm: () => void }> = ({
    onCancel,
    onConfirm: _onConfirm,
}) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--error-tint)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                fontSize: '0.75rem',
                color: '#fca5a5',
                textAlign: 'center',
            }}
        >
            {t('provider.confirm_remove')}{' '}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onCancel();
                }}
                style={{
                    color: 'var(--slate-400)',
                    textDecoration: 'underline',
                    marginLeft: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                }}
            >
                {t('common.cancel')}
            </button>
        </div>
    );
};
