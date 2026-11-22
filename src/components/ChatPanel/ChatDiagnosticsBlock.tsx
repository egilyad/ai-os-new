import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { adviseChatError } from './chat-error-advice';

export interface ChatDiagnosticsError {
    message: string;
    requestId?: string;
    status: string;
}

const ChatDiagnosticsBlock: React.FC<{ error: ChatDiagnosticsError | null }> = ({ error }) => {
    if (!error) return null;
    return (
        <div
            role="alert"
            style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start',
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                fontSize: '0.78rem',
                color: 'var(--error)',
            }}
        >
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>{error.message}</span>
                <span style={{ opacity: 0.75 }}>
                    {adviseChatError(error.message, error.status)}
                </span>
                {error.requestId && (
                    <span style={{ opacity: 0.5, fontSize: '0.68rem' }}>
                        requestId: {error.requestId}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ChatDiagnosticsBlock;
