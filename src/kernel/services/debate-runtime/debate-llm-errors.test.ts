import { describe, it, expect } from 'vitest';
import { classifyLlmError, LlmError } from './debate-llm-errors';
import type { LlmErrorCode } from './debate-llm-errors';

/** Build an AbortError DOMException with the given reason message. */
function abortError(reason: string): DOMException {
    const d = new DOMException('aborted', 'AbortError');
    // controller.signal.reason is read as `instanceof Error ? .message : 'Aborted'`.
    Object.defineProperty(d, 'message', { value: reason });
    return d;
}

describe('classifyLlmError', () => {
    it('maps governor/request timeouts to TIMEOUT (G-01)', () => {
        for (const reason of [
            'RequestTimedOut',
            'TimedOut',
            'PreflightTimedOut',
            'OperationTimedOut',
        ]) {
            const r = classifyLlmError(abortError(reason), {
                isAbortError: true,
                abortReason: reason,
                errorString: 'Aborted',
            });
            expect(r.code).toBe('TIMEOUT');
        }
    });

    it('maps SSE idle timeout to TIMEOUT (G-02)', () => {
        const r = classifyLlmError(abortError('Aborted'), {
            isAbortError: true,
            abortReason: 'Aborted',
            errorString: 'SSE idle timeout',
        });
        expect(r.code).toBe('TIMEOUT');
    });

    it('maps non-timeout aborts to CANCELLED', () => {
        const r = classifyLlmError(abortError('CancelledByUser'), {
            isAbortError: true,
            abortReason: 'CancelledByUser',
            errorString: 'Aborted',
        });
        expect(r.code).toBe('CANCELLED');
    });

    it('maps 402 to PAYMENT_REQUIRED', () => {
        const r = classifyLlmError(new Error('Payment Required'), { statusCode: 402 });
        expect(r.code).toBe('PAYMENT_REQUIRED');
        expect(r.statusCode).toBe(402);
    });

    it('maps 401/403 and Gemini bad-key strings to AUTH', () => {
        expect(classifyLlmError(new Error('x'), { statusCode: 401 }).code).toBe('AUTH');
        expect(classifyLlmError(new Error('x'), { statusCode: 403 }).code).toBe('AUTH');
        for (const s of [
            'API key not valid',
            'INVALID_ARGUMENT',
            'Authentication failed',
            'Invalid API Key',
        ]) {
            expect(classifyLlmError(new Error(s), { errorString: s }).code).toBe('AUTH');
        }
    });

    it('maps 429 and 413-TPM to RATE_LIMIT', () => {
        expect(classifyLlmError(new Error('x'), { statusCode: 429 }).code).toBe('RATE_LIMIT');
        const r = classifyLlmError(new Error('Payload Too Large'), {
            statusCode: 413,
            errorString: '413 rate_limit_exceeded tokens per minute',
        });
        expect(r.code).toBe('RATE_LIMIT');
    });

    it('maps 413 non-TPM to CONTEXT_EXCEEDED', () => {
        const r = classifyLlmError(new Error('Payload Too Large'), {
            statusCode: 413,
            errorString: '413 Payload Too Large (context window)',
        });
        expect(r.code).toBe('CONTEXT_EXCEEDED');
    });

    it('maps 404 and model-not-found strings to MODEL_NOT_FOUND', () => {
        expect(classifyLlmError(new Error('x'), { statusCode: 404 }).code).toBe('MODEL_NOT_FOUND');
        for (const s of [
            'model_not_found',
            'is not found for API version',
            'not supported for generateContent',
        ]) {
            expect(classifyLlmError(new Error(s), { errorString: s }).code).toBe('MODEL_NOT_FOUND');
        }
    });

    it('maps HALF-OPEN / all-providers-dead to PROVIDER_UNAVAILABLE', () => {
        expect(
            classifyLlmError(new Error('HALF-OPEN circuit'), {
                errorString: 'HALF-OPEN circuit',
            }).code,
        ).toBe('PROVIDER_UNAVAILABLE');
        expect(
            classifyLlmError(new Error('All LLM providers unavailable'), {
                errorString: 'All LLM providers unavailable',
            }).code,
        ).toBe('PROVIDER_UNAVAILABLE');
    });

    it('maps no-keys message to NO_KEYS', () => {
        expect(
            classifyLlmError(new Error('No available API keys'), {
                errorString: 'No available API keys',
            }).code,
        ).toBe('NO_KEYS');
    });

    it('falls back to UNKNOWN for unrecognized errors', () => {
        const r = classifyLlmError(new Error('weird thing happened'), {
            errorString: 'weird thing happened',
        });
        expect(r.code).toBe('UNKNOWN');
    });

    it('preserves the cause on the returned LlmError', () => {
        const cause = new Error('root');
        const r = classifyLlmError(cause, { statusCode: 402 });
        expect(r).toBeInstanceOf(LlmError);
        expect(r.code).toBe<LlmErrorCode>('PAYMENT_REQUIRED');
        expect(r.cause).toBe(cause);
    });

    it('prioritizes TIMEOUT over AUTH even when strings overlap', () => {
        const r = classifyLlmError(abortError('RequestTimedOut'), {
            isAbortError: true,
            abortReason: 'RequestTimedOut',
            errorString: 'Aborted INVALID_ARGUMENT',
        });
        expect(r.code).toBe('TIMEOUT');
    });
});
