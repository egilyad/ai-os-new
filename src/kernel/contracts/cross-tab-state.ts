export interface CircuitBreakerState {
    provider: string;
    keyId: string;
    status: 'closed' | 'half-open' | 'open';
    failureCount: number;
    lastFailure: number;
}

export interface RateLimitState {
    provider: string;
    keyId: string;
    remaining: number;
    resetAt: number;
}

/**
 * Cross-tab state synchronization via BroadcastChannel.
 * Use for: propagating infrastructure state (circuit breaker, rate limits) to all tabs.
 * Do NOT use for: mutual exclusion — see IDistributedLock instead.
 */
export interface ICrossTabStateSync {
    updateCircuitBreaker(state: CircuitBreakerState): void;
    updateRateLimit(state: RateLimitState): void;
}
