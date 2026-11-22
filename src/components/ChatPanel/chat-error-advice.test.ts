import { describe, it, expect } from 'vitest';
import { adviseChatError } from './chat-error-advice';

const advice = adviseChatError;

describe('adviseChatError', () => {
    it('maps rate-limit and auth statuses', () => {
        expect(advice('HTTP 429 rate limit exceeded')).toContain('Лимит запросов');
        expect(advice('401 unauthorized')).toContain('авторизации');
    });

    it('maps timeout status', () => {
        expect(advice('Request timed out', 'timeout')).toContain('таймаут');
    });

    it('maps model and keys failures', () => {
        expect(advice('404 model_not_found')).toContain('Модель недоступна');
        expect(advice('No available API keys')).toContain('добавь ключ');
    });

    it('falls back for unknown errors', () => {
        expect(advice('something odd')).toContain('Проверь ключи');
    });
});
