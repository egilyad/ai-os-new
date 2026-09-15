/**
 * Smart Retry — AGEMS port, Phase 12.6.
 * Retry logic with exponential backoff and provider failover.
 */

export interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

export interface RetryState {
    attempt: number;
    lastError: string;
    totalDelayMs: number;
    shouldRetry: boolean;
    delayMs: number;
}

const DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
};

export class SmartRetry {
    private config: RetryConfig;
    private attempt = 0;

    constructor(config?: Partial<RetryConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Calculate next retry delay with exponential backoff.
     */
    nextRetry(error: string): RetryState {
        this.attempt++;
        const shouldRetry = this.attempt <= this.config.maxRetries;
        const delayMs = shouldRetry
            ? Math.min(
                this.config.baseDelayMs * Math.pow(this.config.backoffMultiplier, this.attempt - 1),
                this.config.maxDelayMs
            )
            : 0;

        return {
            attempt: this.attempt,
            lastError: error,
            totalDelayMs: this.calculateTotalDelay(),
            shouldRetry,
            delayMs,
        };
    }

    /**
     * Calculate total delay if all retries were executed.
     */
    private calculateTotalDelay(): number {
        let total = 0;
        for (let i = 0; i < this.config.maxRetries; i++) {
            total += Math.min(
                this.config.baseDelayMs * Math.pow(this.config.backoffMultiplier, i),
                this.config.maxDelayMs
            );
        }
        return total;
    }

    /**
     * Reset retry state.
     */
    reset(): void {
        this.attempt = 0;
    }

    /**
     * Check if error is retryable.
     */
    isRetryable(error: string): boolean {
        const lower = error.toLowerCase();
        const retryablePatterns = [
            'timeout',
            'rate limit',
            '429',
            '500',
            '502',
            '503',
            '504',
            'econnreset',
            'econnrefused',
            'etimedout',
            'socket hang up',
        ];
        return retryablePatterns.some(p => lower.includes(p));
    }

    /**
     * Get current attempt number.
     */
    getAttempt(): number {
        return this.attempt;
    }
}
