import { ModalShell } from './ModalShell';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
}) => {
    return (
        <ModalShell open={open} onClose={onCancel} width={400}>
            <h3 style={{ margin: 0, color: 'var(--slate-100)', fontWeight: 600, fontSize: '1rem' }}>
                {title}
            </h3>
            <p
                style={{
                    margin: '0.75rem 0 1.25rem',
                    color: 'var(--slate-400)',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                }}
            >
                {message}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                    }}
                >
                    {cancelLabel}
                </button>
                <button
                    autoFocus
                    onClick={onConfirm}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 8,
                        border: 'none',
                        background: variant === 'danger' ? '#ef4444' : '#3b82f6',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                    }}
                >
                    {confirmLabel}
                </button>
            </div>
        </ModalShell>
    );
};
