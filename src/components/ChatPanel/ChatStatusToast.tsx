import { toastBase } from '../../styles/common';

interface Props {
    message: string | null;
    type?: 'success' | 'error' | 'info';
}

const BG_COLORS = {
    success: 'rgba(16,185,129,0.95)',
    error: 'rgba(239,68,68,0.95)',
    info: 'rgba(59,130,246,0.95)',
};

const ChatStatusToast: React.FC<Props> = ({ message, type = 'info' }) => {
    if (!message) return null;

    return (
        <div
            style={{
                ...toastBase,
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                background: BG_COLORS[type],
                color: '#fff',
                padding: '0.6rem 1.25rem',
                borderRadius: 100,
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
        >
            {message}
        </div>
    );
};

export default ChatStatusToast;
