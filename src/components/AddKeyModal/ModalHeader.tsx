import { X } from 'lucide-react';

interface ModalHeaderProps {
    title: string;
    onClose: () => void;
    closeAria: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose, closeAria }) => (
    <div className="modal-body-header">
        <h3 className="modal-body-title">{title}</h3>
        <button onClick={onClose} className="modal-close-btn" aria-label={closeAria}>
            <X size={20} />
        </button>
    </div>
);

export default ModalHeader;
