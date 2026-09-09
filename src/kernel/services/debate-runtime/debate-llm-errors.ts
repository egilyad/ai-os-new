/**
 * Typed LLM error taxonomy for the debate runtime (B-12).
 *
 * Historically `debate-llm-caller.ts` classified failures by fragile
 * string-matching of raw error messages (`abortReason.includes('TimedOut')`,
 * `errStr.includes('API key not valid')`, …). Correctness of failover / payment
 * handling hinged on exact substrings, so any adapter message change silently
 * re-broke failover (three prior prod incidents: 402 arg-swap, G-01 governor
 * timeout, G-02 SSE idle).
 *
 * This module is the single stable boundary: adapters/guards produce an
 * `LlmError` with a `code` from a closed union; `debateCallLlm` branches on the
 * stable `code` instead of magic strings. The magic strings live ONLY here.
 */

export type LlmErrorCode =
    | 'TIMEOUT'
    | 'PAYMENT_REQUIRED'
    | 'AUTH'
    | 'RATE_LIMIT'
    | 'CONTEXT_EXCEEDED'
    | 'MODEL_NOT_FOUND'
    | 'PROVIDER_UNAVAILABLE'
    | 'CANCELLED'
    | 'NO_KEYS'
    | 'UNKNOWN';

export class LlmError extends Error {
    readonly code: LlmErrorCode;
    readonly statusCode?: number;
    constructor(
        code: LlmErrorCode,
        message: string,
        statusCode?: number,
        options?: { cause?: unknown },
    ) {
        super(message, options);
        this.name = 'LlmError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

export interface LlmErrorClassifyInput {
    /** HTTP-style status code carried by the raw error (e.g. AuthError.statusCode). */
    statusCode?: number;
    /** True when the raw error is a DOMException AbortError. */
    isAbortError?: boolean;
    /** Human-readable abort reason (controller.signal.reason.message). */
    abortReason?: string;
    /** Pre-computed String(e) for string matching. */
    errorString?: string;
}

/**
 * Map a raw adapter/guard error onto a stable `LlmError` code.
 *
 * Classification priority (first match wins):
 *   1. TIMEOUT — abort reason contains *TimedOut* / *OperationTimedOut* /
 *      *PreflightTimedOut*, or an SSE idle-timeout message.
 *   2. CANCELLED — any other non-timeout AbortError (CancelledByUser / Governor).
 *   3. PAYMENT_REQUIRED — 402.
 *   4. AUTH — 401 / 403, or Gemini "API key not valid" / INVALID_ARGUMENT.
 *   5. RATE_LIMIT — 429, or 413 TPM ("rate_limit_exceeded" / "tokens per minute").
 *   6. CONTEXT_EXCEEDED — 413 non-TPM (model context window exceeded).
 *   7. MODEL_NOT_FOUND — 404 or model-not-found strings.
 *   8. PROVIDER_UNAVAILABLE — HALF-OPEN circuit / "All LLM providers unavailable".
 *   9. NO_KEYS — "No available API keys".
 *  10. UNKNOWN — anything else.
 */
export function classifyLlmError(e: unknown, input: LlmErrorClassifyInput = {}): LlmError {
    const statusCode = input.statusCode;
    const isAbortError = input.isAbortError ?? false;
    const abortReason = input.abortReason ?? '';
    const errStr = input.errorString ?? String(e);

    const isTimeout =
        (isAbortError &&
            (abortReason.includes('RequestTimedOut') ||
                abortReason.includes('TimedOut') ||
                abortReason.includes('PreflightTimedOut') ||
                abortReason.includes('OperationTimedOut'))) ||
        (isAbortError && errStr.includes('SSE idle timeout'));
    if (isTimeout) {
        return new LlmError('TIMEOUT', abortReason || 'SSE idle timeout', statusCode, {
            cause: e,
        });
    }

    if (isAbortError) {
        return new LlmError('CANCELLED', abortReason || 'Aborted', statusCode, { cause: e });
    }

    if (statusCode === 402) {
        return new LlmError('PAYMENT_REQUIRED', 'Payment Required', statusCode, { cause: e });
    }

    if (
        statusCode === 401 ||
        statusCode === 403 ||
        errStr.includes('API key not valid') ||
        errStr.includes('INVALID_ARGUMENT') ||
        errStr.includes('Authentication failed') ||
        errStr.includes('Invalid API Key')
    ) {
        return new LlmError('AUTH', 'Authentication failed', statusCode, { cause: e });
    }

    if (statusCode === 429) {
        return new LlmError('RATE_LIMIT', 'Rate limited (429)', statusCode, { cause: e });
    }

    if (statusCode === 413) {
        const isTpmRateLimit =
            errStr.includes('rate_limit_exceeded') || errStr.includes('tokens per minute');
        if (isTpmRateLimit) {
            return new LlmError('RATE_LIMIT', 'TPM rate limited (413)', statusCode, { cause: e });
        }
        return new LlmError('CONTEXT_EXCEEDED', 'Context window exceeded (413)', statusCode, {
            cause: e,
        });
    }

    if (
        statusCode === 404 ||
        errStr.includes('model_not_found') ||
        errStr.includes('is not found for API version') ||
        errStr.includes('not supported for generateContent')
    ) {
        return new LlmError('MODEL_NOT_FOUND', 'Model not found', statusCode, { cause: e });
    }

    if (errStr.includes('HALF-OPEN') || errStr.includes('All LLM providers unavailable')) {
        return new LlmError('PROVIDER_UNAVAILABLE', 'Provider unavailable', statusCode, {
            cause: e,
        });
    }

    if (errStr.includes('No available API keys')) {
        return new LlmError('NO_KEYS', 'No available API keys', statusCode, { cause: e });
    }

    return new LlmError('UNKNOWN', errStr.slice(0, 200), statusCode, { cause: e });
}
