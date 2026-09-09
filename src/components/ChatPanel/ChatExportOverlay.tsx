import { X } from 'lucide-react';
import ChatExportPanel from '../ChatExportPanel';
import { useEffect } from 'react';

interface Props {
    onClose: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const ChatExportOverlay: React.FC<Props> = ({ onClose, t }) => {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
            }}
            role="dialog"
            aria-modal="true"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '90vw',
                    height: '85vh',
                    background: 'var(--slate-900)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            padding: 8,
                        }}
                        aria-label={t('common.close')}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <ChatExportPanel />
                </div>
            </div>
        </div>
    );
};

export default ChatExportOverlay;
