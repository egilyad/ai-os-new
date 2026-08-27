export class LLMError extends Error {
    readonly provider: string;
    readonly statusCode?: number;

    constructor(message: string, provider: string, statusCode?: number, options?: ErrorOptions) {
        super(message, options);
        this.name = 'LLMError';
        this.provider = provider;
        this.statusCode = statusCode;
    }
}

export class AuthError extends LLMError {
    constructor(messageOrProvider: string, provider?: string, statusCode = 401) {
        super(
            provider ? messageOrProvider : `Authentication failed for ${messageOrProvider}`,
            provider ?? messageOrProvider,
            statusCode,
        );
        this.name = 'AuthError';
    }
}
