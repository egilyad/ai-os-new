import { classifyLlmError, type LlmErrorCode } from '../../kernel';

const ADVICE: Record<LlmErrorCode, string> = {
    TIMEOUT: 'Превышен таймаут — повтори или уменьши размер запроса.',
    PAYMENT_REQUIRED: 'Недостаточно средств — пополни баланс провайдера.',
    AUTH: 'Ошибка авторизации — проверь ключ API.',
    RATE_LIMIT: 'Лимит запросов — подожди или смени ключ/провайдера.',
    CONTEXT_EXCEEDED: 'Контекст слишком большой — сократи историю или начни новый чат.',
    MODEL_NOT_FOUND: 'Модель недоступна у провайдера — выбери другую модель или ключ.',
    PROVIDER_UNAVAILABLE: 'Провайдер временно недоступен — подожди и повтори.',
    CANCELLED: 'Запрос отменён — отправь сообщение снова.',
    NO_KEYS: 'Нет доступных провайдеров/ключей — добавь ключ в Настройках.',
    UNKNOWN: 'Проверь ключи и модель; при повторе посмотри консоль.',
};

export function adviseChatError(message: string, status?: string): string {
    const statusCodeMatch = message.match(/\b([45]\d{2})\b/);
    const statusCode = statusCodeMatch?.[1] ? Number(statusCodeMatch[1]) : undefined;
    const isTimeout = /timeout|timed out/i.test(message) || status === 'timeout';
    const error = classifyLlmError(message, {
        statusCode,
        isAbortError: isTimeout,
        abortReason: isTimeout ? 'RequestTimedOut' : undefined,
        errorString: message,
    });
    return ADVICE[error.code];
}
