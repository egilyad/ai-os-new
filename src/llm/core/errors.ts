import { LLMError } from '../../kernel/errors';

export { LLMError, AuthError } from '../../kernel/errors';

export class RetryableError extends LLMError {
    readonly attempt?: number;
    readonly retryAfter?: number;

    constructor(
        message: string,
        provider: string,
        statusCode?: number,
        attempt?: number,
        retryAfter?: number,
        options?: ErrorOptions,
    ) {
        super(message, provider, statusCode, options);
        this.name = 'RetryableError';
        this.attempt = attempt;
        this.retryAfter = retryAfter;
    }
}

export class SafetyError extends LLMError {
    readonly finishReason:
        'SAFETY' | 'RECITATION' | 'LANGUAGE' | 'BLOCKLIST' | 'PROHIBITED_CONTENT' | 'SPII';
    readonly safetyRatings?: Array<{ category: string; probability: string }>;

    constructor(
        provider: string,
        finishReason:
            'SAFETY' | 'RECITATION' | 'LANGUAGE' | 'BLOCKLIST' | 'PROHIBITED_CONTENT' | 'SPII',
        safetyRatings?: Array<{ category: string; probability: string }>,
    ) {
        super(`Generation blocked due to ${finishReason}`, provider);
        this.name = 'SafetyError';
        this.finishReason = finishReason;
        this.safetyRatings = safetyRatings;
    }
}

export class ModelValidationError extends LLMError {
    constructor(model: string, reason: string, provider: string) {
        super(`Invalid model "${model}": ${reason}`, provider);
        this.name = 'ModelValidationError';
    }
}
