import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ChatDiagnosticsError {
    message: string;
    requestId?: string;
    status: string;
}

function suggestFix(message: string): string {
    const m = message.toLowerCase();
    if (m.includes('429') || m.includes('rate limit') || m.includes('quota'))
        return 'Лимит запросов — подожди или смени ключ/провайдера.';
    if (m.includes('401') || m.includes('403') || m.includes('unauthorized') || m.includes('auth'))
        return 'Ошибка авторизации — проверь ключ API.';
    if (m.includes('404') || m.includes('model') || m.includes('not found'))
        return 'Модель недоступна у провайдера — выбери другую модель или ключ.';
    if (m.includes('timeout') || m.includes('timed out'))
        return 'Превышен таймаут — попробуй ещё раз или уменьши размер запроса.';
    if (m.includes('balance') || m.includes('insufficient') || m.includes('402'))
        return 'Недостаточно средств — пополни баланс провайдера.';
    if (m.includes('circuit') || m.includes('backoff'))
        return 'Провайдер временно недоступен — подожди и повтори.';
    if (m.includes('no providers') || m.includes('no keys') || m.includes('no active'))
        return 'Нет доступных провайдеров/ключей — добавь ключ в Настройках.';
    return 'Проверь ключи и модель; при повторе посмотри консоль.';
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
                <span style={{ opacity: 0.75 }}>{suggestFix(error.message)}</span>
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
