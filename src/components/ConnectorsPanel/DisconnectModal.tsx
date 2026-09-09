import React, { useRef, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ModalShell } from '../ModalShell';
import { Button } from '../Common';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
    connectorName: string | null;
    onConfirm: () => void;
    onClose: () => void;
}

const DisconnectModal: React.FC<Props> = ({ connectorName, onConfirm, onClose }) => {
    const { t } = useTranslation();
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (connectorName && modalRef.current) {
            const btn = modalRef.current.querySelector<HTMLButtonElement>(
                '.connector-modal-actions button:last-child',
            );
            btn?.focus();
        }
    }, [connectorName]);

    return (
        <ModalShell open={connectorName !== null} onClose={onClose} width={420}>
            <div ref={modalRef}>
                <div className="connector-modal-header">
                    <AlertTriangle size={24} color="#ef4444" aria-hidden="true" />
                    <h3 className="connector-modal-title">Revoke Connection?</h3>
                </div>
                <p className="connector-modal-body">
                    This will revoke the OAuth token and disconnect the service. You can reconnect
                    at any time.
                </p>
                <div className="connector-modal-actions">
                    <Button variant="secondary" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="danger" onClick={onConfirm}>
                        Yes, Revoke
                    </Button>
                </div>
            </div>
        </ModalShell>
    );
};

export default DisconnectModal;
